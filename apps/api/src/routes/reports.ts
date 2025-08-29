import { Router } from 'express';
import { ReportController } from '@/controllers/reportController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { ReportFilterSchema } from '@/types';

const router = Router();
const reportController = new ReportController();

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard', requirePermission(PERMISSIONS.REPORT_READ), asyncHandler(reportController.getDashboardStats));

/**
 * @swagger
 * /api/reports/tasks:
 *   get:
 *     summary: Get task reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter by assignee
 *     responses:
 *       200:
 *         description: Task reports retrieved successfully
 */
router.get('/tasks', requirePermission(PERMISSIONS.REPORT_READ), validateQuery(ReportFilterSchema), asyncHandler(reportController.getTaskReports));

/**
 * @swagger
 * /api/reports/compliance:
 *   get:
 *     summary: Get compliance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by compliance category
 *     responses:
 *       200:
 *         description: Compliance reports retrieved successfully
 */
router.get('/compliance', requirePermission(PERMISSIONS.REPORT_READ), validateQuery(ReportFilterSchema), asyncHandler(reportController.getComplianceReports));

/**
 * @swagger
 * /api/reports/clients:
 *   get:
 *     summary: Get client reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Client reports retrieved successfully
 */
router.get('/clients', requirePermission(PERMISSIONS.REPORT_READ), validateQuery(ReportFilterSchema), asyncHandler(reportController.getClientReports));

/**
 * @swagger
 * /api/reports/performance:
 *   get:
 *     summary: Get team performance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Performance reports retrieved successfully
 */
router.get('/performance', requirePermission(PERMISSIONS.REPORT_READ), validateQuery(ReportFilterSchema), asyncHandler(reportController.getPerformanceReports));

export { router as reportRoutes };
