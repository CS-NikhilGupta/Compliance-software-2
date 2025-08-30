import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './tenantContext';
import { AuthorizationError } from './errorHandler';

// Permission constants
export const PERMISSIONS = {
  // Tenant Management
  TENANT_READ: 'tenant:read',
  TENANT_WRITE: 'tenant:write',
  TENANT_DELETE: 'tenant:delete',
  
  // User Management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_INVITE: 'user:invite',
  
  // Client Management
  CLIENT_READ: 'client:read',
  CLIENT_WRITE: 'client:write',
  CLIENT_DELETE: 'client:delete',
  
  // Entity Management
  ENTITY_READ: 'entity:read',
  ENTITY_WRITE: 'entity:write',
  ENTITY_DELETE: 'entity:delete',
  
  // Task Management
  TASK_READ: 'task:read',
  TASK_WRITE: 'task:write',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  TASK_APPROVE: 'task:approve',
  
  // Document Management
  DOCUMENT_READ: 'document:read',
  DOCUMENT_WRITE: 'document:write',
  DOCUMENT_DELETE: 'document:delete',
  
  // Compliance Management
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_WRITE: 'compliance:write',
  
  // Notification Management
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_WRITE: 'notification:write',
  NOTIFICATION_DELETE: 'notification:delete',
  
  // Report Access
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',
  
  // Audit Access
  AUDIT_READ: 'audit:read',
  
  // System Administration
  SYSTEM_ADMIN: 'system:admin',
} as const;

// Role definitions with permissions
export const ROLE_PERMISSIONS = {
  OWNER: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_WRITE,
    PERMISSIONS.TENANT_DELETE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_WRITE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.ENTITY_WRITE,
    PERMISSIONS.ENTITY_DELETE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_WRITE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_WRITE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.AUDIT_READ,
  ],
  ADMIN: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_WRITE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.ENTITY_WRITE,
    PERMISSIONS.ENTITY_DELETE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_WRITE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_WRITE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.AUDIT_READ,
  ],
  MANAGER: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_WRITE,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.ENTITY_WRITE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_WRITE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_WRITE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],
  STAFF: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_WRITE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.REPORT_READ,
  ],
  CLIENT: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  AUDITOR: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.AUDIT_READ,
  ],
};

// Get user permissions based on roles
export const getUserPermissions = (userRoles: string[], userPermissions?: string[]): string[] => {
  const permissions = new Set<string>();
  
  // Check if user has wildcard permission
  if (userPermissions?.includes('*')) {
    return ['*'];
  }
  
  // Add permissions from database
  if (userPermissions) {
    userPermissions.forEach(permission => permissions.add(permission));
  }
  
  // Add permissions from predefined roles
  userRoles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role.toUpperCase() as keyof typeof ROLE_PERMISSIONS];
    if (rolePermissions) {
      rolePermissions.forEach(permission => permissions.add(permission));
    }
  });
  
  return Array.from(permissions);
};

// Check if user has permission
export const hasPermission = (userRoles: string[], requiredPermission: string, userPermissions?: string[]): boolean => {
  const permissions = getUserPermissions(userRoles, userPermissions);
  
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }
  
  return permissions.includes(requiredPermission);
};

// Check if user has any of the required permissions
export const hasAnyPermission = (userRoles: string[], requiredPermissions: string[], userPermissions?: string[]): boolean => {
  const permissions = getUserPermissions(userRoles, userPermissions);
  
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }
  
  return requiredPermissions.some(permission => permissions.includes(permission));
};

// Check if user has all required permissions
export const hasAllPermissions = (userRoles: string[], requiredPermissions: string[], userPermissions?: string[]): boolean => {
  const permissions = getUserPermissions(userRoles, userPermissions);
  
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }
  
  return requiredPermissions.every(permission => permissions.includes(permission));
};

// Middleware to require specific permission
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(req.user.roles, permission, req.user.permissions)) {
      throw new AuthorizationError(`Permission required: ${permission}`);
    }

    next();
  };
};

// Middleware to require any of the specified permissions
export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasAnyPermission(req.user.roles, permissions)) {
      throw new AuthorizationError(`One of these permissions required: ${permissions.join(', ')}`);
    }

    next();
  };
};

// Middleware to require all specified permissions
export const requireAllPermissions = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasAllPermissions(req.user.roles, permissions)) {
      throw new AuthorizationError(`All these permissions required: ${permissions.join(', ')}`);
    }

    next();
  };
};

// Middleware to require specific role
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!req.user.roles.includes(role)) {
      throw new AuthorizationError(`Role required: ${role}`);
    }

    next();
  };
};

// Middleware to require any of the specified roles
export const requireAnyRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!roles.some(role => req.user!.roles.includes(role))) {
      throw new AuthorizationError(`One of these roles required: ${roles.join(', ')}`);
    }

    next();
  };
};

// Middleware to check if user is admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  if (!req.user.isAdmin) {
    throw new AuthorizationError('Admin access required');
  }

  next();
};
