import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { UpdateDocumentInput, DocumentFilterInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class DocumentController {
  async getDocuments(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page = 1, limit = 25, sortBy, sortOrder } = req.query as any;
    const filters: DocumentFilterInput = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
    };

    if (filters.category) where.category = filters.category;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.taskId) where.taskId = filters.taskId;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          entity: {
            select: {
              id: true,
              legalName: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
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

  async getDocumentById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const document = await prisma.document.findFirst({
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
          },
        },
        entity: {
          select: {
            id: true,
            legalName: true,
            entityType: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    res.json({
      success: true,
      data: { document },
    });
  }

  async downloadDocument(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    try {
      const filePath = path.resolve(document.filePath);
      
      // Check if file exists
      await fs.access(filePath);

      // Update download count
      await prisma.document.update({
        where: { id },
        data: {
          downloadCount: {
            increment: 1,
          },
          lastDownloadedAt: new Date(),
        },
      });

      // Log audit event
      await auditService.log({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        action: 'DOCUMENT_DOWNLOADED',
        entityType: 'document',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimeType);

      // Send file
      res.sendFile(filePath);
    } catch (error) {
      logger.error({
        documentId: id,
        filePath: document.filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to download document');
      
      throw new NotFoundError('File not found on disk');
    }
  }

  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const {
      name,
      description,
      category = 'OTHER',
      clientId,
      entityId,
      taskId,
      tags = [],
    } = req.body;

    // Validate related entities if provided
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          tenantId: req.user.tenantId,
        },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }
    }

    if (entityId) {
      const entity = await prisma.entity.findFirst({
        where: {
          id: entityId,
          tenantId: req.user.tenantId,
        },
      });

      if (!entity) {
        throw new ValidationError('Entity not found');
      }
    }

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId: req.user.tenantId,
        },
      });

      if (!task) {
        throw new ValidationError('Task not found');
      }
    }

    const document = await prisma.document.create({
      data: {
        tenantId: req.user.tenantId,
        name: name || req.file.originalname,
        originalName: req.file.originalname,
        description,
        category,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: req.file.path,
        clientId,
        entityId,
        taskId,
        uploadedBy: req.user.id,
        tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        entity: {
          select: {
            id: true,
            legalName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: document.id,
      newValues: {
        name: document.name,
        category,
        size: document.size,
        mimeType: document.mimeType,
        clientId,
        entityId,
        taskId,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      documentId: document.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      fileName: document.originalName,
      size: document.size,
    }, 'Document uploaded successfully');

    res.status(201).json({
      success: true,
      data: { document },
    });
  }

  async updateDocument(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateDocumentInput = req.body;

    const currentDocument = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!currentDocument) {
      throw new NotFoundError('Document not found');
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        entity: {
          select: {
            id: true,
            legalName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'DOCUMENT_UPDATED',
      entityType: 'document',
      entityId: id,
      oldValues: currentDocument,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { document: updatedDocument },
    });
  }

  async deleteDocument(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Delete the document record
    await prisma.document.delete({
      where: { id },
    });

    // Try to delete the physical file
    try {
      await fs.unlink(document.filePath);
      logger.info({
        documentId: id,
        filePath: document.filePath,
      }, 'Physical file deleted successfully');
    } catch (error) {
      logger.warn({
        documentId: id,
        filePath: document.filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to delete physical file');
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'DOCUMENT_DELETED',
      entityType: 'document',
      entityId: id,
      oldValues: document,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'Document deleted successfully' },
    });
  }
}
