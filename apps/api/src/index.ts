import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestId } from '@/middleware/requestId';
import { tenantContext } from '@/middleware/tenantContext';
import { authRoutes } from '@/routes/auth';
import { tenantRoutes } from '@/routes/tenants';
import { userRoutes } from '@/routes/users';
import { clientRoutes } from '@/routes/clients';
import { entityRoutes } from '@/routes/entities';
import { complianceRoutes } from '@/routes/compliances';
import { taskRoutes } from '@/routes/tasks';
import { documentRoutes } from '@/routes/documents';
import { notificationRoutes } from '@/routes/notifications';
import { reportRoutes } from '@/routes/reports';
import { healthRoutes } from '@/routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Compliance Management SaaS API',
      version: '1.0.0',
      description: 'Multi-tenant SaaS platform for Indian CS/CA SME firms to manage compliance tasks',
      contact: {
        name: 'Compliance Management Team',
        email: 'support@compliance-saas.com',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
}));

// Request ID middleware
app.use(requestId);

// Rate limiting
app.use('/api/', limiter);

// Tenant context middleware (applied after auth)
app.use('/api/', tenantContext);

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Compliance SaaS API Documentation',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/compliances', complianceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Compliance Management SaaS API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    docs: '/docs',
    health: '/api/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

export default app;
