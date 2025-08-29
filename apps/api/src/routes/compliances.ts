import { Router } from 'express';
import { ComplianceController } from '@/controllers/complianceController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateComplianceSchema, UpdateComplianceSchema, PaginationSchema } from '@/types';

const router = Router();
const complianceController = new ComplianceController();

/**
 * @swagger
 * /api/compliances:
 *   get:
 *     summary: Get all compliances from catalog
 *     tags: [Compliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or act name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by applicable entity type
 *       - in: query
 *         name: periodicity
 *         schema:
 *           type: string
 *         description: Filter by periodicity
 *     responses:
 *       200:
 *         description: Compliances retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.COMPLIANCE_READ), validateQuery(PaginationSchema), asyncHandler(complianceController.getCompliances));

/**
 * @swagger
 * /api/compliances/{id}:
 *   get:
 *     summary: Get compliance by ID
 *     tags: [Compliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Compliance ID
 *     responses:
 *       200:
 *         description: Compliance retrieved successfully
 *       404:
 *         description: Compliance not found
 */
router.get('/:id', requirePermission(PERMISSIONS.COMPLIANCE_READ), asyncHandler(complianceController.getComplianceById));

/**
 * @swagger
 * /api/compliances:
 *   post:
 *     summary: Create a new compliance (Admin only)
 *     tags: [Compliances]
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
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               actName:
 *                 type: string
 *               entityTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               periodicity:
 *                 type: string
 *               dueDateRule:
 *                 type: object
 *     responses:
 *       201:
 *         description: Compliance created successfully
 */
router.post('/', requirePermission(PERMISSIONS.COMPLIANCE_WRITE), validateRequest(CreateComplianceSchema), asyncHandler(complianceController.createCompliance));

/**
 * @swagger
 * /api/compliances/{id}:
 *   patch:
 *     summary: Update compliance (Admin only)
 *     tags: [Compliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Compliance ID
 *     responses:
 *       200:
 *         description: Compliance updated successfully
 *       404:
 *         description: Compliance not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.COMPLIANCE_WRITE), validateRequest(UpdateComplianceSchema), asyncHandler(complianceController.updateCompliance));

/**
 * @swagger
 * /api/compliances/categories:
 *   get:
 *     summary: Get all compliance categories
 *     tags: [Compliances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', requirePermission(PERMISSIONS.COMPLIANCE_READ), asyncHandler(complianceController.getCategories));

/**
 * @swagger
 * /api/compliances/applicable/{entityId}:
 *   get:
 *     summary: Get applicable compliances for an entity
 *     tags: [Compliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Applicable compliances retrieved successfully
 */
router.get('/applicable/:entityId', requirePermission(PERMISSIONS.COMPLIANCE_READ), asyncHandler(complianceController.getApplicableCompliances));

export { router as complianceRoutes };
