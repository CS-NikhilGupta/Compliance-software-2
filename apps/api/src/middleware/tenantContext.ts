import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticationError, TenantError } from './errorHandler';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    roles: string[];
    permissions: string[];
    isAdmin: boolean;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
}

export const tenantContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth for public routes
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user with tenant and roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid token');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    if (!user.tenant.isActive) {
      throw new TenantError('Tenant account is suspended');
    }

    // Check if user is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    // Get all permissions from user roles
    const allPermissions = new Set<string>();
    user.roles.forEach(ur => {
      if (ur.role.permissions) {
        ur.role.permissions.forEach(permission => allPermissions.add(permission));
      }
    });

    // Set user context
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
      permissions: Array.from(allPermissions),
      isAdmin: user.roles.some(ur => ur.role.name === 'admin' || ur.role.name === 'OWNER'),
    };

    // Set tenant context
    req.tenant = {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      isActive: user.tenant.isActive,
    };

    // Set tenant context in database session for RLS
    await prisma.$executeRaw`SELECT set_tenant_context(${user.tenantId}, ${req.user.isAdmin})`;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info({
      userId: user.id,
      tenantId: user.tenantId,
      roles: req.user.roles,
    }, 'User authenticated');

    next();
  } catch (error) {
    logger.error({ error: error.message }, 'Authentication failed');
    next(error);
  }
};
