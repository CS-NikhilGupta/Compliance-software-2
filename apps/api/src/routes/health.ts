import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'compliance-management-api',
    version: '1.0.0',
  });
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'compliance-management-api',
    version: '1.0.0',
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      redis: { status: 'unknown', responseTime: 0 },
      memory: { status: 'unknown', usage: 0, limit: 0 },
      uptime: process.uptime(),
    },
  };

  // Check database connection
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
  }

  // Check Redis connection
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const start = Date.now();
    await redis.ping();
    health.checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
    redis.disconnect();
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.redis = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB limit
  health.checks.memory = {
    status: memUsage.heapUsed < memLimit ? 'healthy' : 'warning',
    usage: memUsage.heapUsed,
    limit: memLimit,
    percentage: Math.round((memUsage.heapUsed / memLimit) * 100),
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/liveness', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
