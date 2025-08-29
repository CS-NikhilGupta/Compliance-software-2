import { Router } from 'express';
import { TaskController } from '@/controllers/taskController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateTaskSchema, UpdateTaskSchema, TaskFilterSchema, PaginationSchema } from '@/types';

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with filters
 *     tags: [Tasks]
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter by assignee
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by entity
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.TASK_READ), validateQuery(TaskFilterSchema), asyncHandler(taskController.getTasks));

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       404:
 *         description: Task not found
 */
router.get('/:id', requirePermission(PERMISSIONS.TASK_READ), asyncHandler(taskController.getTaskById));

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *               clientId:
 *                 type: string
 *               entityId:
 *                 type: string
 *               complianceId:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', requirePermission(PERMISSIONS.TASK_WRITE), validateRequest(CreateTaskSchema), asyncHandler(taskController.createTask));

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.TASK_WRITE), validateRequest(UpdateTaskSchema), asyncHandler(taskController.updateTask));

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
router.delete('/:id', requirePermission(PERMISSIONS.TASK_DELETE), asyncHandler(taskController.deleteTask));

/**
 * @swagger
 * /api/tasks/generate:
 *   post:
 *     summary: Generate tasks from compliance catalog for entity
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityId:
 *                 type: string
 *               year:
 *                 type: integer
 *               complianceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tasks generated successfully
 */
router.post('/generate', requirePermission(PERMISSIONS.TASK_WRITE), asyncHandler(taskController.generateTasks));

/**
 * @swagger
 * /api/tasks/{id}/checklist:
 *   post:
 *     summary: Add checklist item to task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Checklist item added successfully
 */
router.post('/:id/checklist', requirePermission(PERMISSIONS.TASK_WRITE), asyncHandler(taskController.addChecklistItem));

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add comment to task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post('/:id/comments', requirePermission(PERMISSIONS.TASK_WRITE), asyncHandler(taskController.addComment));

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   patch:
 *     summary: Assign task to user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task assigned successfully
 */
router.patch('/:id/assign', requirePermission(PERMISSIONS.TASK_ASSIGN), asyncHandler(taskController.assignTask));

export { router as taskRoutes };
