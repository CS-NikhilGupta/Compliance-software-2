import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/tenantContext';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError, 
  NotFoundError 
} from '@/middleware/errorHandler';
import { 
  LoginInput, 
  RegisterInput, 
  OTPVerifyInput 
} from '@/types';
import { logger } from '@/utils/logger';
import { generateOTP, sendOTP } from '@/services/otpService';
import { AuditService } from '@/services/auditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName, tenantName, phone }: RegisterInput = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create tenant slug from name
    const slug = tenantName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictError('Organization name already taken');
    }

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
          email,
          phone,
          planType: 'STARTER',
          isActive: true,
        },
      });

      // Get default roles
      const ownerRole = await tx.role.findUnique({
        where: { name: 'OWNER' },
      });

      if (!ownerRole) {
        throw new Error('Default roles not found. Please run database seed.');
      }

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          isActive: true,
        },
      });

      // Assign owner role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      return { tenant, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log audit event
    await auditService.log({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email,
    }, 'User registered successfully');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
          },
        },
        token,
      },
    });
  }

  async login(req: Request, res: Response) {
    const { email, password }: LoginInput = req.body;

    // Find user with tenant and roles
    const user = await prisma.user.findUnique({
      where: { email },
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
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockDuration = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new AuthenticationError(`Account is locked. Try again in ${lockDuration} minutes.`);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Check if tenant is active
    if (!user.tenant.isActive) {
      throw new AuthenticationError('Organization account is suspended');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30');
      
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Log failed login attempt
      await auditService.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log successful login
    await auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      userId: user.id,
      tenantId: user.tenantId,
      email,
    }, 'User logged in successfully');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map(ur => ur.role.name),
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
          },
        },
        token,
      },
    });
  }

  async sendOTP(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otp = generateOTP();
    
    // Store OTP in cache/database (implement based on your preference)
    // For now, we'll store it in a simple in-memory cache
    // In production, use Redis or database
    
    await sendOTP(email, otp);

    logger.info({ email }, 'OTP sent successfully');

    res.json({
      success: true,
      data: {
        message: 'OTP sent successfully',
      },
    });
  }

  async verifyOTP(req: Request, res: Response) {
    const { email, otp }: OTPVerifyInput = req.body;

    // Verify OTP (implement based on your storage mechanism)
    // This is a placeholder implementation
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    logger.info({ email }, 'OTP verified successfully');

    res.json({
      success: true,
      data: {
        message: 'OTP verified successfully',
      },
    });
  }

  async refreshToken(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Generate new token
    const token = jwt.sign(
      { 
        userId: req.user.id,
        tenantId: req.user.tenantId,
        email: req.user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: { token },
    });
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Log logout event
    await auditService.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info({
      userId: req.user.id,
      tenantId: req.user.tenantId,
    }, 'User logged out');

    res.json({
      success: true,
      data: {
        message: 'Logout successful',
      },
    });
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          designation: user.designation,
          department: user.department,
          employeeId: user.employeeId,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          lastLoginAt: user.lastLoginAt,
          roles: user.roles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
          })),
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            planType: user.tenant.planType,
          },
        },
      },
    });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      res.json({
        success: true,
        data: {
          message: 'If an account with this email exists, a password reset link has been sent.',
        },
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Send password reset email (implement email service)
    // await emailService.sendPasswordReset(email, resetToken);

    logger.info({ email }, 'Password reset requested');

    res.json({
      success: true,
      data: {
        message: 'If an account with this email exists, a password reset link has been sent.',
      },
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new ValidationError('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { 
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      logger.info({ userId: decoded.userId }, 'Password reset successfully');

      res.json({
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      });
    } catch (error) {
      throw new ValidationError('Invalid or expired reset token');
    }
  }
}
