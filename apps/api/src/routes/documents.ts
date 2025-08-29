import { Router } from 'express';
import { DocumentController } from '@/controllers/documentController';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest, validateQuery } from '@/middleware/validation';
import { requirePermission, PERMISSIONS } from '@/middleware/rbac';
import { CreateDocumentSchema, UpdateDocumentSchema, DocumentFilterSchema } from '@/types';
import multer from 'multer';
import path from 'path';

const router = Router();
const documentController = new DocumentController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents with filters
 *     tags: [Documents]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by document category
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
 *         description: Search by name or description
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/', requirePermission(PERMISSIONS.DOCUMENT_READ), validateQuery(DocumentFilterSchema), asyncHandler(documentController.getDocuments));

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found
 */
router.get('/:id', requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(documentController.getDocumentById));

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: Document not found
 */
router.get('/:id/download', requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(documentController.downloadDocument));

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               clientId:
 *                 type: string
 *               entityId:
 *                 type: string
 *               taskId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post('/', requirePermission(PERMISSIONS.DOCUMENT_WRITE), upload.single('file'), asyncHandler(documentController.uploadDocument));

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     summary: Update document metadata
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 */
router.patch('/:id', requirePermission(PERMISSIONS.DOCUMENT_WRITE), validateRequest(UpdateDocumentSchema), asyncHandler(documentController.updateDocument));

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.delete('/:id', requirePermission(PERMISSIONS.DOCUMENT_DELETE), asyncHandler(documentController.deleteDocument));

export { router as documentRoutes };
