import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { CreateNotificationInput, NotificationFilterInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page = 1, limit = 25, sortBy, sortOrder } = req.query as any;
    const filters: NotificationFilterInput = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
      userId: req.user.id,
    };

    if (filters.type) where.type = filters.type;
    // Note: Using status field instead of isRead - notifications don't have isRead field

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getNotificationById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.json({
      success: true,
      data: { notification },
    });
  }

  async createNotification(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const notificationData: CreateNotificationInput = req.body;

    // Validate target user exists and belongs to tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: notificationData.userId,
        tenantId: req.user.tenantId,
        isActive: true,
      },
    });

    if (!targetUser) {
      throw new ValidationError('Target user not found');
    }

    const notification = await prisma.notification.create({
      data: {
        ...notificationData,
        tenantId: req.user.tenantId,
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'NOTIFICATION_CREATED',
      entityType: 'notification',
      entityId: notification.id,
      newValues: notificationData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      notificationId: notification.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      targetUserId: notificationData.userId,
      type: notificationData.type,
    }, 'Notification created successfully');

    res.status(201).json({
      success: true,
      data: { notification },
    });
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { notification: updatedNotification },
    });
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const result = await prisma.notification.updateMany({
      where: {
        tenantId: req.user.tenantId,
        userId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        message: `${result.count} notifications marked as read`,
        count: result.count,
      },
    });
  }

  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
        userId: req.user.id,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'NOTIFICATION_DELETED',
      entityType: 'notification',
      entityId: id,
      oldValues: notification,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'Notification deleted successfully' },
    });
  }
}
