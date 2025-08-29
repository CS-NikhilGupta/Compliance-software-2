import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ConflictError } from '@/middleware/errorHandler';
import { CreateClientInput, UpdateClientInput, PaginationInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class ClientController {
  async getClients(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page, limit, sortBy, sortOrder } = req.query as any;
    const { search, type, isActive } = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { panNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          entities: {
            select: {
              id: true,
              legalName: true,
              entityType: true,
            },
          },
          contacts: {
            where: { isPrimary: true },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              entities: true,
              tasks: true,
              documents: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getClientById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        entities: {
          include: {
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
        contacts: true,
        _count: {
          select: {
            tasks: true,
            documents: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    res.json({
      success: true,
      data: { client },
    });
  }

  async createClient(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const clientData: CreateClientInput = req.body;

    // Check for duplicate GST number if provided
    if (clientData.gstNumber) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId: req.user.tenantId,
          gstNumber: clientData.gstNumber,
        },
      });

      if (existingClient) {
        throw new ConflictError('Client with this GST number already exists');
      }
    }

    // Check for duplicate PAN number if provided
    if (clientData.panNumber) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId: req.user.tenantId,
          panNumber: clientData.panNumber,
        },
      });

      if (existingClient) {
        throw new ConflictError('Client with this PAN number already exists');
      }
    }

    const client = await prisma.client.create({
      data: {
        ...clientData,
        tenantId: req.user.tenantId,
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CLIENT_CREATED',
      entityType: 'client',
      entityId: client.id,
      newValues: clientData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      clientId: client.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
    }, 'Client created successfully');

    res.status(201).json({
      success: true,
      data: { client },
    });
  }

  async updateClient(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateClientInput = req.body;

    // Get current client data
    const currentClient = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!currentClient) {
      throw new NotFoundError('Client not found');
    }

    // Check for duplicate GST number if being updated
    if (updateData.gstNumber && updateData.gstNumber !== currentClient.gstNumber) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId: req.user.tenantId,
          gstNumber: updateData.gstNumber,
          id: { not: id },
        },
      });

      if (existingClient) {
        throw new ConflictError('Client with this GST number already exists');
      }
    }

    // Check for duplicate PAN number if being updated
    if (updateData.panNumber && updateData.panNumber !== currentClient.panNumber) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId: req.user.tenantId,
          panNumber: updateData.panNumber,
          id: { not: id },
        },
      });

      if (existingClient) {
        throw new ConflictError('Client with this PAN number already exists');
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CLIENT_UPDATED',
      entityType: 'client',
      entityId: id,
      oldValues: currentClient,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { client: updatedClient },
    });
  }

  async deleteClient(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        _count: {
          select: {
            entities: true,
            tasks: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Check if client has entities or tasks
    if (client._count.entities > 0 || client._count.tasks > 0) {
      // Soft delete by deactivating
      await prisma.client.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no dependencies
      await prisma.client.delete({
        where: { id },
      });
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CLIENT_DELETED',
      entityType: 'client',
      entityId: id,
      oldValues: client,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'Client deleted successfully' },
    });
  }

  async getClientEntities(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    // Verify client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const entities = await prisma.entity.findMany({
      where: {
        clientId: id,
        tenantId: req.user.tenantId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            entityCompliances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { entities },
    });
  }

  async getClientTasks(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { status, priority, page = 1, limit = 25 } = req.query as any;

    // Verify client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const where: any = {
      clientId: id,
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
          entity: {
            select: {
              id: true,
              legalName: true,
              entityType: true,
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

  async getClientDocuments(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { category, page = 1, limit = 25 } = req.query as any;

    // Verify client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const where: any = {
      clientId: id,
      tenantId: req.user.tenantId,
    };

    if (category) where.category = category;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }
}
