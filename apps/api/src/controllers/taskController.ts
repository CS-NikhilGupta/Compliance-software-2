import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError, ValidationError, AuthorizationError } from '@/middleware/errorHandler';
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';
import { DueDateCalculator } from '@/services/dueDateCalculator';
import { NotificationService } from '@/services/notificationService';

const prisma = new PrismaClient();
const auditService = new AuditService();
const dueDateCalculator = new DueDateCalculator();
const notificationService = new NotificationService();

export class TaskController {
  async getTasks(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page = 1, limit = 25, sortBy, sortOrder } = req.query as any;
    const filters: TaskFilterInput = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.complianceId) where.complianceId = filters.complianceId;

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
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
      orderBy.dueDate = 'asc';
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
          compliance: {
            select: {
              id: true,
              name: true,
              category: true,
              formNumber: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              checklists: true,
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy,
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

  async getTaskById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const task = await prisma.task.findFirst({
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
        entity: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            entityType: true,
            cinNumber: true,
            gstNumber: true,
            panNumber: true,
          },
        },
        compliance: true,
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        checklists: {
          orderBy: { order: 'asc' },
        },
        comments: {
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
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            document: {
              select: {
                id: true,
                name: true,
                originalName: true,
                mimeType: true,
                size: true,
                category: true,
              },
            },
          },
        },
        timeEntries: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    res.json({
      success: true,
      data: { task },
    });
  }

  async createTask(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const taskData: CreateTaskInput = req.body;

    // Validate client exists if provided
    if (taskData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: taskData.clientId,
          tenantId: req.user.tenantId,
        },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }
    }

    // Validate entity exists if provided
    if (taskData.entityId) {
      const entity = await prisma.entity.findFirst({
        where: {
          id: taskData.entityId,
          tenantId: req.user.tenantId,
        },
      });

      if (!entity) {
        throw new ValidationError('Entity not found');
      }
    }

    // Validate assignee exists if provided
    if (taskData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: taskData.assigneeId,
          tenantId: req.user.tenantId,
          isActive: true,
        },
      });

      if (!assignee) {
        throw new ValidationError('Assignee not found');
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
        dueDate: new Date(taskData.dueDate),
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
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
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to assignee if assigned
    if (task.assigneeId && task.assignee) {
      await notificationService.sendTaskAssignment(
        task.assignee.email,
        task.title,
        task.dueDate,
        task.client?.name
      );
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      newValues: taskData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      taskId: task.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
    }, 'Task created successfully');

    res.status(201).json({
      success: true,
      data: { task },
    });
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateTaskInput = req.body;

    // Get current task data
    const currentTask = await prisma.task.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!currentTask) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can update this task
    const canUpdate = req.user.isAdmin || 
                     currentTask.createdBy === req.user.id || 
                     currentTask.assigneeId === req.user.id;

    if (!canUpdate) {
      throw new AuthorizationError('You can only update tasks created by you or assigned to you');
    }

    // Validate assignee if being updated
    if (updateData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: updateData.assigneeId,
          tenantId: req.user.tenantId,
          isActive: true,
        },
      });

      if (!assignee) {
        throw new ValidationError('Assignee not found');
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        completedAt: updateData.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notifications for status changes
    if (updateData.status && updateData.status !== currentTask.status) {
      if (updatedTask.assignee) {
        await notificationService.sendTaskStatusUpdate(
          updatedTask.assignee.email,
          updatedTask.title,
          updateData.status,
          currentTask.client?.name
        );
      }
    }

    // Send notification for new assignment
    if (updateData.assigneeId && updateData.assigneeId !== currentTask.assigneeId) {
      if (updatedTask.assignee) {
        await notificationService.sendTaskAssignment(
          updatedTask.assignee.email,
          updatedTask.title,
          updatedTask.dueDate,
          currentTask.client?.name
        );
      }
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TASK_UPDATED',
      entityType: 'task',
      entityId: id,
      oldValues: currentTask,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { task: updatedTask },
    });
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can delete this task
    const canDelete = req.user.isAdmin || task.createdBy === req.user.id;

    if (!canDelete) {
      throw new AuthorizationError('You can only delete tasks created by you');
    }

    await prisma.task.delete({
      where: { id },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TASK_DELETED',
      entityType: 'task',
      entityId: id,
      oldValues: task,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'Task deleted successfully' },
    });
  }

  async generateTasks(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { entityId, year = new Date().getFullYear(), complianceIds } = req.body;

    // Verify entity exists and belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        tenantId: req.user.tenantId,
      },
      include: {
        client: true,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    // Get applicable compliances
    let compliances;
    if (complianceIds && complianceIds.length > 0) {
      compliances = await prisma.compliance.findMany({
        where: {
          id: { in: complianceIds },
          isActive: true,
        },
      });
    } else {
      compliances = await prisma.compliance.findMany({
        where: {
          isActive: true,
          entityTypes: {
            has: entity.entityType,
          },
        },
      });
    }

    const tasksToCreate = [];

    for (const compliance of compliances) {
      const dueDates = dueDateCalculator.calculateDueDates(compliance, year);
      
      for (const dueDate of dueDates) {
        // Check if task already exists for this period
        const existingTask = await prisma.task.findFirst({
          where: {
            tenantId: req.user.tenantId,
            entityId,
            complianceId: compliance.id,
            dueDate: {
              gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
              lt: new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 1),
            },
          },
        });

        if (!existingTask) {
          tasksToCreate.push({
            tenantId: req.user.tenantId,
            clientId: entity.clientId,
            entityId,
            complianceId: compliance.id,
            title: `${compliance.name} - ${entity.legalName}`,
            description: compliance.description,
            type: 'COMPLIANCE',
            dueDate,
            priority: 'MEDIUM',
            createdBy: req.user.id,
            tags: [compliance.category, entity.entityType],
          });
        }
      }
    }

    if (tasksToCreate.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No new tasks to generate',
          tasksCreated: 0,
        },
      });
    }

    const createdTasks = await prisma.task.createMany({
      data: tasksToCreate,
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TASKS_GENERATED',
      entityType: 'entity',
      entityId,
      newValues: { year, complianceIds, tasksCreated: createdTasks.count },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      entityId,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      tasksCreated: createdTasks.count,
    }, 'Tasks generated successfully');

    res.status(201).json({
      success: true,
      data: {
        message: `${createdTasks.count} tasks generated successfully`,
        tasksCreated: createdTasks.count,
      },
    });
  }

  async addChecklistItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { title, description } = req.body;

    // Verify task exists and belongs to tenant
    const task = await prisma.task.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Get next order number
    const lastChecklist = await prisma.taskChecklist.findFirst({
      where: { taskId: id },
      orderBy: { order: 'desc' },
    });

    const checklistItem = await prisma.taskChecklist.create({
      data: {
        taskId: id,
        title,
        description,
        order: (lastChecklist?.order || 0) + 1,
      },
    });

    res.status(201).json({
      success: true,
      data: { checklistItem },
    });
  }

  async addComment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { content, mentions = [] } = req.body;

    // Verify task exists and belongs to tenant
    const task = await prisma.task.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: req.user.id,
        content,
        mentions,
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
    });

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: mentions },
          tenantId: req.user.tenantId,
          isActive: true,
        },
        select: {
          email: true,
          firstName: true,
        },
      });

      for (const user of mentionedUsers) {
        await notificationService.sendTaskMention(
          user.email,
          task.title,
          content,
          `${req.user.firstName} ${req.user.lastName}`
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { comment },
    });
  }

  async assignTask(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const { assigneeId } = req.body;

    // Verify task exists and belongs to tenant
    const task = await prisma.task.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify assignee exists and belongs to tenant
    const assignee = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        tenantId: req.user.tenantId,
        isActive: true,
      },
    });

    if (!assignee) {
      throw new ValidationError('Assignee not found');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { assigneeId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to new assignee
    await notificationService.sendTaskAssignment(
      assignee.email,
      task.title,
      task.dueDate,
      task.client?.name
    );

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'TASK_ASSIGNED',
      entityType: 'task',
      entityId: id,
      newValues: { assigneeId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { task: updatedTask },
    });
  }
}
