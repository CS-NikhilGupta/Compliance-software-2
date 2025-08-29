import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateUserSchema, UpdateUserSchema, InviteUserSchema, PaginationSchema } from '@/types';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users in tenant
 *     tags: [Users]
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
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.USER_READ), validateQuery(PaginationSchema), asyncHandler(userController.getUsers));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', requirePermission(PERMISSIONS.USER_READ), asyncHandler(userController.getUserById));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: User already exists
 */
router.post('/', requirePermission(PERMISSIONS.USER_WRITE), validateRequest(CreateUserSchema), asyncHandler(userController.createUser));

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.USER_WRITE), validateRequest(UpdateUserSchema), asyncHandler(userController.updateUser));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', requirePermission(PERMISSIONS.USER_DELETE), asyncHandler(userController.deleteUser));

/**
 * @swagger
 * /api/users/invite:
 *   post:
 *     summary: Invite a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *       409:
 *         description: User already exists
 */
router.post('/invite', requirePermission(PERMISSIONS.USER_INVITE), validateRequest(InviteUserSchema), asyncHandler(userController.inviteUser));

/**
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get all available roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/roles', requirePermission(PERMISSIONS.USER_READ), asyncHandler(userController.getRoles));

export { router as userRoutes };
