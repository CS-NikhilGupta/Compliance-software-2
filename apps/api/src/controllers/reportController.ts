import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { NotFoundError } from '@/middleware/errorHandler';
import { ReportFilterInput } from '@/types';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class ReportController {
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const tenantId = req.user.tenantId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [
      totalClients,
      totalEntities,
      totalTasks,
      pendingTasks,
      overdueTasks,
      completedTasksThisMonth,
      upcomingTasks,
      totalDocuments,
      recentActivities,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({
        where: { tenantId, isActive: true },
      }),

      // Total entities
      prisma.entity.count({
        where: { tenantId },
      }),

      // Total tasks
      prisma.task.count({
        where: { tenantId },
      }),

      // Pending tasks
      prisma.task.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),

      // Completed tasks this month
      prisma.task.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      }),

      // Upcoming tasks (next 7 days)
      prisma.task.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total documents
      prisma.document.count({
        where: { tenantId },
      }),

      // Recent activities (audit logs)
      prisma.auditLog.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Task status distribution
    const taskStatusDistribution = await prisma.task.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });

    // Task priority distribution
    const taskPriorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      where: { tenantId },
      _count: { priority: true },
    });

    // Monthly task completion trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const completed = await prisma.task.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          completedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        completed,
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalClients,
          totalEntities,
          totalTasks,
          pendingTasks,
          overdueTasks,
          completedTasksThisMonth,
          upcomingTasks,
          totalDocuments,
        },
        taskStatusDistribution: taskStatusDistribution.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        taskPriorityDistribution: taskPriorityDistribution.map(item => ({
          priority: item.priority,
          count: item._count.priority,
        })),
        monthlyTrend,
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          action: activity.action,
          entityType: activity.entityType,
          user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
          createdAt: activity.createdAt,
        })),
      },
    });
  }

  async getTaskReports(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const filters: ReportFilterInput = req.query as any;
    const tenantId = req.user.tenantId;

    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;

    const [
      tasksByStatus,
      tasksByPriority,
      tasksByAssignee,
      tasksByClient,
      tasksByCompliance,
      overdueTasks,
      avgCompletionTime,
    ] = await Promise.all([
      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),

      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),

      // Tasks by assignee
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { ...where, assigneeId: { not: null } },
        _count: { assigneeId: true },
        orderBy: { _count: { assigneeId: 'desc' } },
        take: 10,
      }),

      // Tasks by client
      prisma.task.groupBy({
        by: ['clientId'],
        where: { ...where, clientId: { not: null } },
        _count: { clientId: true },
        orderBy: { _count: { clientId: 'desc' } },
        take: 10,
      }),

      // Tasks by compliance
      prisma.task.groupBy({
        by: ['complianceId'],
        where: { ...where, complianceId: { not: null } },
        _count: { complianceId: true },
        orderBy: { _count: { complianceId: 'desc' } },
        take: 10,
      }),

      // Overdue tasks
      prisma.task.findMany({
        where: {
          ...where,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
        include: {
          client: { select: { name: true } },
          assignee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),

      // Average completion time
      prisma.task.aggregate({
        where: {
          ...where,
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        _avg: {
          // This would need a computed field for completion time
        },
      }),
    ]);

    // Get user names for assignee report
    const assigneeIds = tasksByAssignee.map(item => item.assigneeId).filter(Boolean);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, firstName: true, lastName: true },
    });

    // Get client names for client report
    const clientIds = tasksByClient.map(item => item.clientId).filter(Boolean);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds as string[] } },
      select: { id: true, name: true },
    });

    // Get compliance names for compliance report
    const complianceIds = tasksByCompliance.map(item => item.complianceId).filter(Boolean);
    const compliances = await prisma.compliance.findMany({
      where: { id: { in: complianceIds as string[] } },
      select: { id: true, name: true },
    });

    res.json({
      success: true,
      data: {
        tasksByStatus: tasksByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        tasksByPriority: tasksByPriority.map(item => ({
          priority: item.priority,
          count: item._count.priority,
        })),
        tasksByAssignee: tasksByAssignee.map(item => {
          const assignee = assignees.find(a => a.id === item.assigneeId);
          return {
            assigneeId: item.assigneeId,
            assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unknown',
            count: item._count.assigneeId,
          };
        }),
        tasksByClient: tasksByClient.map(item => {
          const client = clients.find(c => c.id === item.clientId);
          return {
            clientId: item.clientId,
            clientName: client?.name || 'Unknown',
            count: item._count.clientId,
          };
        }),
        tasksByCompliance: tasksByCompliance.map(item => {
          const compliance = compliances.find(c => c.id === item.complianceId);
          return {
            complianceId: item.complianceId,
            complianceName: compliance?.name || 'Unknown',
            count: item._count.complianceId,
          };
        }),
        overdueTasks: overdueTasks.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          client: task.client?.name,
          assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
          daysPastDue: Math.floor((Date.now() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      },
    });
  }

  async getComplianceReports(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const filters: ReportFilterInput = req.query as any;
    const tenantId = req.user.tenantId;

    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.category) {
      where.compliance = { category: filters.category };
    }

    const [
      complianceByCategory,
      complianceByStatus,
      topCompliances,
      complianceCalendar,
    ] = await Promise.all([
      // Compliance tasks by category
      prisma.task.groupBy({
        by: ['complianceId'],
        where: { ...where, complianceId: { not: null } },
        _count: { complianceId: true },
      }),

      // Compliance tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: { ...where, complianceId: { not: null } },
        _count: { status: true },
      }),

      // Top compliances by task count
      prisma.task.groupBy({
        by: ['complianceId'],
        where: { ...where, complianceId: { not: null } },
        _count: { complianceId: true },
        orderBy: { _count: { complianceId: 'desc' } },
        take: 10,
      }),

      // Upcoming compliance deadlines
      prisma.task.findMany({
        where: {
          tenantId,
          complianceId: { not: null },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
        include: {
          compliance: { select: { name: true, category: true } },
          client: { select: { name: true } },
          entity: { select: { legalName: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    // Get compliance details for category grouping
    const complianceIds = complianceByCategory.map(item => item.complianceId).filter(Boolean);
    const compliances = await prisma.compliance.findMany({
      where: { id: { in: complianceIds as string[] } },
      select: { id: true, name: true, category: true },
    });

    // Group by category
    const categoryMap = new Map();
    complianceByCategory.forEach(item => {
      const compliance = compliances.find(c => c.id === item.complianceId);
      if (compliance) {
        const category = compliance.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, 0);
        }
        categoryMap.set(category, categoryMap.get(category) + item._count.complianceId);
      }
    });

    res.json({
      success: true,
      data: {
        complianceByCategory: Array.from(categoryMap.entries()).map(([category, count]) => ({
          category,
          count,
        })),
        complianceByStatus: complianceByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        topCompliances: topCompliances.map(item => {
          const compliance = compliances.find(c => c.id === item.complianceId);
          return {
            complianceId: item.complianceId,
            complianceName: compliance?.name || 'Unknown',
            category: compliance?.category || 'Unknown',
            count: item._count.complianceId,
          };
        }),
        upcomingDeadlines: complianceCalendar.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          compliance: task.compliance?.name,
          category: task.compliance?.category,
          client: task.client?.name,
          entity: task.entity?.legalName,
          daysUntilDue: Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
      },
    });
  }

  async getClientReports(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const filters: ReportFilterInput = req.query as any;
    const tenantId = req.user.tenantId;

    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [
      clientsByType,
      topClientsByTasks,
      topClientsByDocuments,
      clientActivity,
    ] = await Promise.all([
      // Clients by type
      prisma.client.groupBy({
        by: ['type'],
        where: { tenantId, isActive: true },
        _count: { type: true },
      }),

      // Top clients by task count
      prisma.task.groupBy({
        by: ['clientId'],
        where: { ...where, clientId: { not: null } },
        _count: { clientId: true },
        orderBy: { _count: { clientId: 'desc' } },
        take: 10,
      }),

      // Top clients by document count
      prisma.document.groupBy({
        by: ['clientId'],
        where: { ...where, clientId: { not: null } },
        _count: { clientId: true },
        orderBy: { _count: { clientId: 'desc' } },
        take: 10,
      }),

      // Recent client activity
      prisma.auditLog.findMany({
        where: {
          tenantId,
          entityType: 'client',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Get client names
    const taskClientIds = topClientsByTasks.map(item => item.clientId).filter(Boolean);
    const docClientIds = topClientsByDocuments.map(item => item.clientId).filter(Boolean);
    const allClientIds = [...new Set([...taskClientIds, ...docClientIds])];

    const clients = await prisma.client.findMany({
      where: { id: { in: allClientIds as string[] } },
      select: { id: true, name: true, type: true },
    });

    res.json({
      success: true,
      data: {
        clientsByType: clientsByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        topClientsByTasks: topClientsByTasks.map(item => {
          const client = clients.find(c => c.id === item.clientId);
          return {
            clientId: item.clientId,
            clientName: client?.name || 'Unknown',
            clientType: client?.type || 'Unknown',
            taskCount: item._count.clientId,
          };
        }),
        topClientsByDocuments: topClientsByDocuments.map(item => {
          const client = clients.find(c => c.id === item.clientId);
          return {
            clientId: item.clientId,
            clientName: client?.name || 'Unknown',
            clientType: client?.type || 'Unknown',
            documentCount: item._count.clientId,
          };
        }),
        recentActivity: clientActivity.map(activity => ({
          id: activity.id,
          action: activity.action,
          entityId: activity.entityId,
          user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
          createdAt: activity.createdAt,
        })),
      },
    });
  }

  async getPerformanceReports(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const filters: ReportFilterInput = req.query as any;
    const tenantId = req.user.tenantId;

    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.completedAt = {};
      if (filters.startDate) where.completedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.completedAt.lte = new Date(filters.endDate);
    }

    const [
      userPerformance,
      teamProductivity,
      taskCompletionTrend,
    ] = await Promise.all([
      // User performance metrics
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { ...where, assigneeId: { not: null }, status: 'COMPLETED' },
        _count: { assigneeId: true },
        orderBy: { _count: { assigneeId: 'desc' } },
      }),

      // Team productivity over time
      prisma.task.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),

      // Task completion trend (last 30 days)
      prisma.task.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          completedAt: true,
        },
      }),
    ]);

    // Get user details
    const userIds = userPerformance.map(item => item.assigneeId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // Calculate daily completion trend
    const dailyCompletions = new Map();
    taskCompletionTrend.forEach(task => {
      if (task.completedAt) {
        const date = task.completedAt.toISOString().split('T')[0];
        dailyCompletions.set(date, (dailyCompletions.get(date) || 0) + 1);
      }
    });

    const completionTrend = Array.from(dailyCompletions.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    res.json({
      success: true,
      data: {
        userPerformance: userPerformance.map(item => {
          const user = users.find(u => u.id === item.assigneeId);
          return {
            userId: item.assigneeId,
            userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            email: user?.email,
            completedTasks: item._count.assigneeId,
          };
        }),
        teamProductivity: teamProductivity.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        completionTrend,
      },
    });
  }
}
