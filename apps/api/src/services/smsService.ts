import twilio from 'twilio';
import { logger } from '@/utils/logger';

export class SMSService {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
      return;
    }
    
    this.client = twilio(accountSid, authToken);
  }

  async sendOTP(phone: string, otp: string): Promise<void> {
    if (!this.client) {
      throw new Error('SMS service not configured');
    }

    const message = `Your OTP for Compliance SaaS is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      logger.info({ phone, messageSid: result.sid }, 'OTP SMS sent successfully');
    } catch (error) {
      logger.error({ error, phone }, 'Failed to send OTP SMS');
      throw error;
    }
  }

  async sendTaskReminder(phone: string, taskTitle: string, dueDate: Date, clientName?: string): Promise<void> {
    if (!this.client) {
      throw new Error('SMS service not configured');
    }

    const message = `Task Reminder: ${taskTitle}${clientName ? ` for ${clientName}` : ''} is due on ${dueDate.toLocaleDateString('en-IN')}. Check your dashboard for details.`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      logger.info({ phone, messageSid: result.sid, taskTitle }, 'Task reminder SMS sent successfully');
    } catch (error) {
      logger.error({ error, phone, taskTitle }, 'Failed to send task reminder SMS');
      throw error;
    }
  }

  async sendOverdueAlert(phone: string, taskTitle: string, clientName?: string): Promise<void> {
    if (!this.client) {
      throw new Error('SMS service not configured');
    }

    const message = `OVERDUE ALERT: ${taskTitle}${clientName ? ` for ${clientName}` : ''} is overdue. Please take immediate action.`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      logger.info({ phone, messageSid: result.sid, taskTitle }, 'Overdue alert SMS sent successfully');
    } catch (error) {
      logger.error({ error, phone, taskTitle }, 'Failed to send overdue alert SMS');
      throw error;
    }
  }

  async sendStatusUpdate(phone: string, taskTitle: string, newStatus: string, clientName?: string): Promise<void> {
    if (!this.client) {
      throw new Error('SMS service not configured');
    }

    const message = `Status Update: ${taskTitle}${clientName ? ` for ${clientName}` : ''} is now ${newStatus.toLowerCase().replace('_', ' ')}.`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      logger.info({ phone, messageSid: result.sid, taskTitle, newStatus }, 'Status update SMS sent successfully');
    } catch (error) {
      logger.error({ error, phone, taskTitle, newStatus }, 'Failed to send status update SMS');
      throw error;
    }
  }
}
