import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { UpdateTenantInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class TenantController {
  async getTenant(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          logo: tenant.logo,
          email: tenant.email,
          phone: tenant.phone,
          address: tenant.address,
          gstNumber: tenant.gstNumber,
          panNumber: tenant.panNumber,
          planType: tenant.planType,
          planExpiry: tenant.planExpiry,
          isActive: tenant.isActive,
          timezone: tenant.timezone,
          currency: tenant.currency,
          createdAt: tenant.createdAt,
          subscription: tenant.subscriptions[0] || null,
        },
      },
    });
  }

  async updateTenant(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const updateData: UpdateTenantInput = req.body;

    // Get current tenant data for audit
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
    });

    if (!currentTenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Check if slug is being changed and if it's available
    if (updateData.slug && updateData.slug !== currentTenant.slug) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: updateData.slug },
      });

      if (existingTenant) {
        throw new ValidationError('Slug is already taken');
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: updateData,
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TENANT_UPDATED',
      entityType: 'tenant',
      entityId: req.user.tenantId,
      oldValues: currentTenant,
      newValues: updatedTenant,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      tenantId: req.user.tenantId,
      userId: req.user.id,
    }, 'Tenant updated successfully');

    res.json({
      success: true,
      data: { tenant: updatedTenant },
    });
  }

  async getSettings(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: {
        settings: true,
        timezone: true,
        currency: true,
        planType: true,
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    res.json({
      success: true,
      data: {
        settings: tenant.settings || {},
        timezone: tenant.timezone,
        currency: tenant.currency,
        planType: tenant.planType,
      },
    });
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { settings, timezone, currency } = req.body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        ...(settings && { settings }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TENANT_SETTINGS_UPDATED',
      entityType: 'tenant',
      entityId: req.user.tenantId,
      newValues: { settings, timezone, currency },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        settings: updatedTenant.settings,
        timezone: updatedTenant.timezone,
        currency: updatedTenant.currency,
      },
    });
  }

  async getUsage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get current month usage
    const usage = await prisma.usageCounter.findMany({
      where: {
        tenantId: req.user.tenantId,
        period: currentMonth,
      },
    });

    // Get counts for current usage
    const [userCount, clientCount, taskCount, documentCount] = await Promise.all([
      prisma.user.count({ where: { tenantId: req.user.tenantId, isActive: true } }),
      prisma.client.count({ where: { tenantId: req.user.tenantId, isActive: true } }),
      prisma.task.count({ where: { tenantId: req.user.tenantId } }),
      prisma.document.count({ where: { tenantId: req.user.tenantId } }),
    ]);

    // Calculate storage usage (in MB)
    const storageResult = await prisma.document.aggregate({
      where: { tenantId: req.user.tenantId },
      _sum: { size: true },
    });

    const storageUsageMB = Math.round((storageResult._sum.size || 0) / (1024 * 1024));

    // Plan limits (these would typically come from a plan configuration)
    const planLimits = {
      STARTER: { users: 5, clients: 50, storage: 1024 }, // 1GB
      PROFESSIONAL: { users: 25, clients: 200, storage: 5120 }, // 5GB
      ENTERPRISE: { users: 100, clients: 1000, storage: 20480 }, // 20GB
    };

    const currentPlan = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { planType: true },
    });

    const limits = planLimits[currentPlan?.planType || 'STARTER'];

    res.json({
      success: true,
      data: {
        current: {
          users: userCount,
          clients: clientCount,
          tasks: taskCount,
          documents: documentCount,
          storageMB: storageUsageMB,
        },
        limits,
        usage: usage.reduce((acc, u) => {
          acc[u.metric] = u.value;
          return acc;
        }, {} as Record<string, number>),
        period: currentMonth,
      },
    });
  }
}
