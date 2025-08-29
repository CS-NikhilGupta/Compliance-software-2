import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ConflictError } from '@/middleware/errorHandler';
import { CreateEntityInput, UpdateEntityInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class EntityController {
  async getEntities(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page, limit, sortBy, sortOrder } = req.query as any;
    const { search, entityType, clientId } = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
    };

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cinNumber: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { panNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              entityCompliances: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.entity.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        entities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getEntityById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const entity = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
          },
        },
        entityCompliances: {
          include: {
            compliance: {
              select: {
                id: true,
                name: true,
                category: true,
                periodicity: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    res.json({
      success: true,
      data: { entity },
    });
  }

  async createEntity(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const entityData: CreateEntityInput = req.body;

    // Verify client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: entityData.clientId,
        tenantId: req.user.tenantId,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Check for duplicate CIN number if provided
    if (entityData.cinNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          cinNumber: entityData.cinNumber,
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this CIN number already exists');
      }
    }

    // Check for duplicate GST number if provided
    if (entityData.gstNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          gstNumber: entityData.gstNumber,
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this GST number already exists');
      }
    }

    // Check for duplicate PAN number if provided
    if (entityData.panNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          panNumber: entityData.panNumber,
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this PAN number already exists');
      }
    }

    const entity = await prisma.entity.create({
      data: {
        ...entityData,
        tenantId: req.user.tenantId,
        incorporationDate: entityData.incorporationDate ? new Date(entityData.incorporationDate) : null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Auto-assign applicable compliances based on entity type
    await this.assignApplicableCompliances(entity.id, entityData.entityType, req.user.tenantId);

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'ENTITY_CREATED',
      entityType: 'entity',
      entityId: entity.id,
      newValues: entityData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      entityId: entity.id,
      clientId: entityData.clientId,
      tenantId: req.user.tenantId,
      userId: req.user.id,
    }, 'Entity created successfully');

    res.status(201).json({
      success: true,
      data: { entity },
    });
  }

  async updateEntity(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateEntityInput = req.body;

    // Get current entity data
    const currentEntity = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!currentEntity) {
      throw new NotFoundError('Entity not found');
    }

    // Check for duplicate CIN number if being updated
    if (updateData.cinNumber && updateData.cinNumber !== currentEntity.cinNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          cinNumber: updateData.cinNumber,
          id: { not: id },
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this CIN number already exists');
      }
    }

    // Check for duplicate GST number if being updated
    if (updateData.gstNumber && updateData.gstNumber !== currentEntity.gstNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          gstNumber: updateData.gstNumber,
          id: { not: id },
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this GST number already exists');
      }
    }

    // Check for duplicate PAN number if being updated
    if (updateData.panNumber && updateData.panNumber !== currentEntity.panNumber) {
      const existingEntity = await prisma.entity.findFirst({
        where: {
          tenantId: req.user.tenantId,
          panNumber: updateData.panNumber,
          id: { not: id },
        },
      });

      if (existingEntity) {
        throw new ConflictError('Entity with this PAN number already exists');
      }
    }

    const updatedEntity = await prisma.entity.update({
      where: { id },
      data: {
        ...updateData,
        incorporationDate: updateData.incorporationDate ? new Date(updateData.incorporationDate) : undefined,
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'ENTITY_UPDATED',
      entityType: 'entity',
      entityId: id,
      oldValues: currentEntity,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { entity: updatedEntity },
    });
  }

  async deleteEntity(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const entity = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    // Check if entity has tasks
    if (entity._count.tasks > 0) {
      // Soft delete by deactivating
      await prisma.entity.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no dependencies
      await prisma.entity.delete({
        where: { id },
      });
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'ENTITY_DELETED',
      entityType: 'entity',
      entityId: id,
      oldValues: entity,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'Entity deleted successfully' },
    });
  }

  async getEntityCompliances(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    // Verify entity exists and belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    const entityCompliances = await prisma.entityCompliance.findMany({
      where: {
        entityId: id,
      },
      include: {
        compliance: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            periodicity: true,
            dueDateRule: true,
            actName: true,
            formNumber: true,
          },
        },
      },
      orderBy: {
        compliance: {
          category: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: { entityCompliances },
    });
  }

  async getEntityTasks(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { status, priority, page = 1, limit = 25 } = req.query as any;

    // Verify entity exists and belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    const where: any = {
      entityId: id,
      tenantId: req.user.tenantId,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          compliance: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  private async assignApplicableCompliances(entityId: string, entityType: string, tenantId: string) {
    try {
      // Get all compliances applicable to this entity type
      const applicableCompliances = await prisma.compliance.findMany({
        where: {
          isActive: true,
          entityTypes: {
            has: entityType,
          },
        },
      });

      // Create entity compliance records
      const entityComplianceData = applicableCompliances.map(compliance => ({
        entityId,
        complianceId: compliance.id,
        isApplicable: true,
      }));

      if (entityComplianceData.length > 0) {
        await prisma.entityCompliance.createMany({
          data: entityComplianceData,
          skipDuplicates: true,
        });

        logger.info({
          entityId,
          entityType,
          compliancesAssigned: entityComplianceData.length,
        }, 'Auto-assigned applicable compliances to entity');
      }
    } catch (error) {
      logger.error({ error, entityId, entityType }, 'Failed to auto-assign compliances');
      // Don't throw error as this is not critical for entity creation
    }
  }
}
