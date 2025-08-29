import { Router } from 'express';
import { EntityController } from '@/controllers/entityController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateEntitySchema, UpdateEntitySchema, PaginationSchema } from '@/types';

const router = Router();
const entityController = new EntityController();

/**
 * @swagger
 * /api/entities:
 *   get:
 *     summary: Get all entities
 *     tags: [Entities]
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
 *         description: Search by legal name or trade name
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *     responses:
 *       200:
 *         description: Entities retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.ENTITY_READ), validateQuery(PaginationSchema), asyncHandler(entityController.getEntities));

/**
 * @swagger
 * /api/entities/{id}:
 *   get:
 *     summary: Get entity by ID
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity retrieved successfully
 *       404:
 *         description: Entity not found
 */
router.get('/:id', requirePermission(PERMISSIONS.ENTITY_READ), asyncHandler(entityController.getEntityById));

/**
 * @swagger
 * /api/entities:
 *   post:
 *     summary: Create a new entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               legalName:
 *                 type: string
 *               tradeName:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 enum: [PROPRIETORSHIP, PARTNERSHIP, LLP, PRIVATE_LIMITED, PUBLIC_LIMITED, OPC, TRUST, SOCIETY, COOPERATIVE, HUF, BRANCH_OFFICE, LIAISON_OFFICE, PROJECT_OFFICE]
 *               cinNumber:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               tanNumber:
 *                 type: string
 *               incorporationDate:
 *                 type: string
 *                 format: date-time
 *               registeredAddress:
 *                 type: object
 *               businessAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Entity created successfully
 */
router.post('/', requirePermission(PERMISSIONS.ENTITY_WRITE), validateRequest(CreateEntitySchema), asyncHandler(entityController.createEntity));

/**
 * @swagger
 * /api/entities/{id}:
 *   patch:
 *     summary: Update entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity updated successfully
 *       404:
 *         description: Entity not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.ENTITY_WRITE), validateRequest(UpdateEntitySchema), asyncHandler(entityController.updateEntity));

/**
 * @swagger
 * /api/entities/{id}:
 *   delete:
 *     summary: Delete entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity deleted successfully
 *       404:
 *         description: Entity not found
 */
router.delete('/:id', requirePermission(PERMISSIONS.ENTITY_DELETE), asyncHandler(entityController.deleteEntity));

/**
 * @swagger
 * /api/entities/{id}/compliances:
 *   get:
 *     summary: Get entity compliances
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity compliances retrieved successfully
 */
router.get('/:id/compliances', requirePermission(PERMISSIONS.COMPLIANCE_READ), asyncHandler(entityController.getEntityCompliances));

/**
 * @swagger
 * /api/entities/{id}/tasks:
 *   get:
 *     summary: Get entity tasks
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity tasks retrieved successfully
 */
router.get('/:id/tasks', requirePermission(PERMISSIONS.TASK_READ), asyncHandler(entityController.getEntityTasks));

export { router as entityRoutes };
