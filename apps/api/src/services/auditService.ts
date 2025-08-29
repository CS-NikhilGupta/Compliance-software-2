import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestId: data.requestId,
          timestamp: new Date(),
        },
      });

      logger.info({
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
      }, 'Audit log created');
    } catch (error) {
      logger.error({ error, auditData: data }, 'Failed to create audit log');
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getAuditLogs(tenantId: string, filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 25,
    } = filters;

    const where: any = { tenantId };

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityHistory(tenantId: string, entityType: string, entityId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs;
  }

  async getUserActivity(tenantId: string, userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs;
  }

  async getSecurityEvents(tenantId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const securityActions = [
      'USER_LOGIN',
      'USER_LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_CHANGED',
      'ROLE_CHANGED',
      'PERMISSION_DENIED',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
    ];

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: {
          in: securityActions,
        },
        timestamp: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs;
  }
}
