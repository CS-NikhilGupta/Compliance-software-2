import { Router } from 'express';
import { TenantController } from '@/controllers/tenantController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateTenantSchema, UpdateTenantSchema, PaginationSchema } from '@/types';

const router = Router();
const tenantController = new TenantController();

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get tenant information
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant information retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.TENANT_READ), asyncHandler(tenantController.getTenant));

/**
 * @swagger
 * /api/tenants:
 *   patch:
 *     summary: Update tenant information
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               gstNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 */
router.patch('/', requirePermission(PERMISSIONS.TENANT_WRITE), validateRequest(UpdateTenantSchema), asyncHandler(tenantController.updateTenant));

/**
 * @swagger
 * /api/tenants/settings:
 *   get:
 *     summary: Get tenant settings
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant settings retrieved successfully
 */
router.get('/settings', requirePermission(PERMISSIONS.TENANT_READ), asyncHandler(tenantController.getSettings));

/**
 * @swagger
 * /api/tenants/settings:
 *   patch:
 *     summary: Update tenant settings
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone:
 *                 type: string
 *               currency:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.patch('/settings', requirePermission(PERMISSIONS.TENANT_WRITE), asyncHandler(tenantController.updateSettings));

/**
 * @swagger
 * /api/tenants/usage:
 *   get:
 *     summary: Get tenant usage statistics
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/usage', requirePermission(PERMISSIONS.TENANT_READ), asyncHandler(tenantController.getUsage));

export { router as tenantRoutes };
