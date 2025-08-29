import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false, // true for 465, false for other ports
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@compliance-saas.com',
      to: email,
      subject: 'Your OTP for Compliance SaaS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Your One-Time Password (OTP) for Compliance SaaS is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Compliance Management SaaS. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info({ email }, 'OTP email sent successfully');
  }

  async sendWelcomeEmail(email: string, firstName: string, tenantName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@compliance-saas.com',
      to: email,
      subject: 'Welcome to Compliance SaaS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Compliance SaaS, ${firstName}!</h2>
          <p>Thank you for registering your organization "${tenantName}" with Compliance Management SaaS.</p>
          <p>You can now:</p>
          <ul>
            <li>Manage your clients and their entities</li>
            <li>Track compliance tasks and deadlines</li>
            <li>Upload and organize documents</li>
            <li>Generate reports and insights</li>
            <li>Collaborate with your team</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Get Started
            </a>
          </div>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Compliance Management SaaS.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info({ email, tenantName }, 'Welcome email sent successfully');
  }

  async sendTaskReminder(email: string, taskTitle: string, dueDate: Date, clientName?: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@compliance-saas.com',
      to: email,
      subject: `Task Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Task Reminder</h2>
          <p>This is a reminder for the following task:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${taskTitle}</h3>
            ${clientName ? `<p style="margin: 5px 0;"><strong>Client:</strong> ${clientName}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-IN')}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL}/tasks" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated reminder from Compliance Management SaaS.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info({ email, taskTitle }, 'Task reminder email sent successfully');
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@compliance-saas.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for Compliance SaaS.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Compliance Management SaaS. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info({ email }, 'Password reset email sent successfully');
  }

  async sendInvitation(email: string, inviterName: string, tenantName: string, inviteToken: string): Promise<void> {
    const inviteUrl = `${process.env.BASE_URL}/invite/accept?token=${inviteToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@compliance-saas.com',
      to: email,
      subject: `Invitation to join ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited!</h2>
          <p>${inviterName} has invited you to join "${tenantName}" on Compliance Management SaaS.</p>
          <p>Compliance SaaS helps CS/CA firms manage their compliance tasks, client relationships, and regulatory deadlines efficiently.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation will expire in 7 days.</p>
          <p>If you don't want to join this organization, you can safely ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Compliance Management SaaS.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info({ email, tenantName }, 'Invitation email sent successfully');
  }
}
