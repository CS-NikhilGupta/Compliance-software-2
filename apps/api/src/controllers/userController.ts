import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  AuthorizationError 
} from '@/middleware/errorHandler';
import { 
  CreateUserInput, 
  UpdateUserInput, 
  InviteUserInput,
  PaginationInput 
} from '@/types';
import { logger } from '@/utils/logger';
import { AuditService } from '@/services/auditService';
import { EmailService } from '@/services/emailService';

const prisma = new PrismaClient();
const auditService = new AuditService();
const emailService = new EmailService();

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { page, limit, sortBy, sortOrder } = req.query as any;
    const { search, role, isActive } = req.query as any;

    const where: any = {
      tenantId: req.user.tenantId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      designation: user.designation,
      department: user.department,
      employeeId: user.employeeId,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.roles.map(ur => ur.role),
    }));

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getUserById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      designation: user.designation,
      department: user.department,
      employeeId: user.employeeId,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(ur => ur.role),
    };

    res.json({
      success: true,
      data: { user: sanitizedUser },
    });
  }

  async createUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const userData: CreateUserInput = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate roles exist
    const roles = await prisma.role.findMany({
      where: {
        id: { in: userData.roleIds },
      },
    });

    if (roles.length !== userData.roleIds.length) {
      throw new ValidationError('One or more roles not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: req.user!.tenantId,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          designation: userData.designation,
          department: userData.department,
          employeeId: userData.employeeId,
          isActive: true,
        },
      });

      // Assign roles
      await tx.userRole.createMany({
        data: userData.roleIds.map(roleId => ({
          userId: user.id,
          roleId,
        })),
      });

      return user;
    });

    // Send welcome email with temporary password
    try {
      // In production, send a password setup link instead of temp password
      logger.info({ 
        userId: result.id, 
        email: userData.email,
        tempPassword 
      }, 'User created with temporary password');
    } catch (error) {
      logger.error({ error }, 'Failed to send welcome email');
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: result.id,
      newValues: { ...userData, password: '[REDACTED]' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          tempPassword, // In production, don't return this
        },
        message: 'User created successfully. Temporary password provided.',
      },
    });
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;
    const updateData: UpdateUserInput = req.body;

    // Get current user data
    const currentUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
      include: {
        roles: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Prevent self-deactivation
    if (id === req.user.id && updateData.hasOwnProperty('isActive') && !updateData.isActive) {
      throw new ValidationError('Cannot deactivate your own account');
    }

    // Update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phone: updateData.phone,
          designation: updateData.designation,
          department: updateData.department,
          employeeId: updateData.employeeId,
          isActive: updateData.isActive,
        },
      });

      // Update roles if provided
      if (updateData.roleIds) {
        // Validate roles exist
        const roles = await tx.role.findMany({
          where: {
            id: { in: updateData.roleIds },
          },
        });

        if (roles.length !== updateData.roleIds.length) {
          throw new ValidationError('One or more roles not found');
        }

        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        await tx.userRole.createMany({
          data: updateData.roleIds.map(roleId => ({
            userId: id,
            roleId,
          })),
        });
      }

      return user;
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: id,
      oldValues: currentUser,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { user: result },
    });
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      throw new ValidationError('Cannot delete your own account');
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: id,
      oldValues: user,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  }

  async inviteUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !req.tenant) {
      throw new NotFoundError('User or tenant not found');
    }

    const { email, roleId }: InviteUserInput = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        tenantId: req.user.tenantId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new ConflictError('Invitation already sent to this email');
    }

    // Validate role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ValidationError('Role not found');
    }

    // Generate invitation token
    const token = jwt.sign(
      { 
        email,
        tenantId: req.user.tenantId,
        roleId,
        type: 'invitation' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: req.user.tenantId,
        email,
        roleId,
        invitedBy: req.user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invitation email
    try {
      const inviterName = `${req.user.firstName} ${req.user.lastName}`;
      await emailService.sendInvitation(email, inviterName, req.tenant.name, token);
    } catch (error) {
      logger.error({ error }, 'Failed to send invitation email');
    }

    // Log audit event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'USER_INVITED',
      entityType: 'invitation',
      entityId: invitation.id,
      newValues: { email, roleId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
        },
      },
    });
  }

  async getRoles(req: AuthenticatedRequest, res: Response) {
    const roles = await prisma.role.findMany({
      where: {
        isSystem: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: { roles },
    });
  }
}
