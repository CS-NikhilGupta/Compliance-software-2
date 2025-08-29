import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError } from '@/middleware/errorHandler';
import { CreateComplianceInput, UpdateComplianceInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class ComplianceController {
  async getCompliances(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page, limit, sortBy, sortOrder } = req.query as any;
    const { search, category, entityType, periodicity } = req.query as any;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { actName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { formNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (entityType) {
      where.entityTypes = {
        has: entityType,
      };
    }

    if (periodicity) {
      where.periodicity = periodicity;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.category = 'asc';
    }

    const [compliances, total] = await Promise.all([
      prisma.compliance.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.compliance.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        compliances,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getComplianceById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const compliance = await prisma.compliance.findUnique({
      where: { id },
    });

    if (!compliance) {
      throw new NotFoundError('Compliance not found');
    }

    res.json({
      success: true,
      data: { compliance },
    });
  }

  async createCompliance(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const complianceData: CreateComplianceInput = req.body;

    const compliance = await prisma.compliance.create({
      data: complianceData,
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'COMPLIANCE_CREATED',
      entityType: 'compliance',
      entityId: compliance.id,
      newValues: complianceData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      complianceId: compliance.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
    }, 'Compliance created successfully');

    res.status(201).json({
      success: true,
      data: { compliance },
    });
  }

  async updateCompliance(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateComplianceInput = req.body;

    const currentCompliance = await prisma.compliance.findUnique({
      where: { id },
    });

    if (!currentCompliance) {
      throw new NotFoundError('Compliance not found');
    }

    const updatedCompliance = await prisma.compliance.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'COMPLIANCE_UPDATED',
      entityType: 'compliance',
      entityId: id,
      oldValues: currentCompliance,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { compliance: updatedCompliance },
    });
  }

  async getCategories(req: AuthenticatedRequest, res: Response) {
    const categories = await prisma.compliance.findMany({
      where: { isActive: true },
      select: {
        category: true,
        subCategory: true,
      },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    const categoryMap = new Map();
    
    categories.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Set());
      }
      if (item.subCategory) {
        categoryMap.get(item.category).add(item.subCategory);
      }
    });

    const result = Array.from(categoryMap.entries()).map(([category, subCategories]) => ({
      category,
      subCategories: Array.from(subCategories),
    }));

    res.json({
      success: true,
      data: { categories: result },
    });
  }

  async getApplicableCompliances(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { entityId } = req.params;

    // Verify entity exists and belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        tenantId: req.user.tenantId,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    // Get all compliances applicable to this entity type
    const applicableCompliances = await prisma.compliance.findMany({
      where: {
        isActive: true,
        entityTypes: {
          has: entity.entityType,
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get entity's current compliance assignments
    const entityCompliances = await prisma.entityCompliance.findMany({
      where: { entityId },
      select: {
        complianceId: true,
        isApplicable: true,
        customDueDate: true,
        assigneeId: true,
        priority: true,
        notes: true,
      },
    });

    const entityComplianceMap = new Map(
      entityCompliances.map(ec => [ec.complianceId, ec])
    );

    // Merge compliance data with entity-specific settings
    const result = applicableCompliances.map(compliance => ({
      ...compliance,
      entitySettings: entityComplianceMap.get(compliance.id) || {
        isApplicable: true,
        customDueDate: null,
        assigneeId: null,
        priority: 'MEDIUM',
        notes: null,
      },
    }));

    res.json({
      success: true,
      data: { compliances: result },
    });
  }
}
