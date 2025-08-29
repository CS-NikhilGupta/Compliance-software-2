import { Router } from 'express';
import { ClientController } from '@/controllers/clientController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateClientSchema, UpdateClientSchema, PaginationSchema } from '@/types';

const router = Router();
const clientController = new ClientController();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
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
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by client type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.CLIENT_READ), validateQuery(PaginationSchema), asyncHandler(clientController.getClients));

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client retrieved successfully
 *       404:
 *         description: Client not found
 */
router.get('/:id', requirePermission(PERMISSIONS.CLIENT_READ), asyncHandler(clientController.getClientById));

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
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
 *               type:
 *                 type: string
 *                 enum: [INDIVIDUAL, PROPRIETORSHIP, PARTNERSHIP, LLP, PRIVATE_LIMITED, PUBLIC_LIMITED, OPC, TRUST, SOCIETY, COOPERATIVE, HUF]
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               gstNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               cinNumber:
 *                 type: string
 *               udyamNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post('/', requirePermission(PERMISSIONS.CLIENT_WRITE), validateRequest(CreateClientSchema), asyncHandler(clientController.createClient));

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
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
 *         description: Client updated successfully
 *       404:
 *         description: Client not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.CLIENT_WRITE), validateRequest(UpdateClientSchema), asyncHandler(clientController.updateClient));

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *       404:
 *         description: Client not found
 */
router.delete('/:id', requirePermission(PERMISSIONS.CLIENT_DELETE), asyncHandler(clientController.deleteClient));

/**
 * @swagger
 * /api/clients/{id}/entities:
 *   get:
 *     summary: Get client entities
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client entities retrieved successfully
 */
router.get('/:id/entities', requirePermission(PERMISSIONS.ENTITY_READ), asyncHandler(clientController.getClientEntities));

/**
 * @swagger
 * /api/clients/{id}/tasks:
 *   get:
 *     summary: Get client tasks
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client tasks retrieved successfully
 */
router.get('/:id/tasks', requirePermission(PERMISSIONS.TASK_READ), asyncHandler(clientController.getClientTasks));

/**
 * @swagger
 * /api/clients/{id}/documents:
 *   get:
 *     summary: Get client documents
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client documents retrieved successfully
 */
router.get('/:id/documents', requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(clientController.getClientDocuments));

export { router as clientRoutes };
