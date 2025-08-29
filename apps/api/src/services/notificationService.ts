import { EmailService } from './emailService';
import { SmsService } from './smsService';
import { logger } from '@/utils/logger';

export class NotificationService {
  private emailService: EmailService;
  private smsService: SmsService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SmsService();
  }

  async sendTaskAssignment(
    email: string,
    taskTitle: string,
    dueDate: Date,
    clientName?: string
  ): Promise<void> {
    try {
      const subject = `New Task Assigned: ${taskTitle}`;
      const context = {
        taskTitle,
        dueDate: dueDate.toLocaleDateString('en-IN'),
        clientName: clientName || 'N/A',
      };

      await this.emailService.sendTaskReminder(email, subject, context);
      
      logger.info({
        email,
        taskTitle,
        dueDate,
        clientName,
      }, 'Task assignment notification sent');
    } catch (error) {
      logger.error({
        email,
        taskTitle,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send task assignment notification');
    }
  }

  async sendTaskStatusUpdate(
    email: string,
    taskTitle: string,
    newStatus: string,
    clientName?: string
  ): Promise<void> {
    try {
      const subject = `Task Status Updated: ${taskTitle}`;
      const context = {
        taskTitle,
        status: newStatus,
        clientName: clientName || 'N/A',
      };

      await this.emailService.sendTaskReminder(email, subject, context);
      
      logger.info({
        email,
        taskTitle,
        newStatus,
        clientName,
      }, 'Task status update notification sent');
    } catch (error) {
      logger.error({
        email,
        taskTitle,
        newStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send task status update notification');
    }
  }

  async sendTaskMention(
    email: string,
    taskTitle: string,
    comment: string,
    mentionedBy: string
  ): Promise<void> {
    try {
      const subject = `You were mentioned in: ${taskTitle}`;
      const context = {
        taskTitle,
        comment,
        mentionedBy,
      };

      await this.emailService.sendTaskReminder(email, subject, context);
      
      logger.info({
        email,
        taskTitle,
        mentionedBy,
      }, 'Task mention notification sent');
    } catch (error) {
      logger.error({
        email,
        taskTitle,
        mentionedBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send task mention notification');
    }
  }

  async sendTaskReminder(
    email: string,
    phone: string | null,
    taskTitle: string,
    dueDate: Date,
    clientName?: string
  ): Promise<void> {
    try {
      // Send email reminder
      const subject = `Task Reminder: ${taskTitle}`;
      const context = {
        taskTitle,
        dueDate: dueDate.toLocaleDateString('en-IN'),
        clientName: clientName || 'N/A',
      };

      await this.emailService.sendTaskReminder(email, subject, context);

      // Send SMS reminder if phone number is available
      if (phone) {
        const message = `Reminder: Task "${taskTitle}" is due on ${dueDate.toLocaleDateString('en-IN')}${clientName ? ` for ${clientName}` : ''}`;
        await this.smsService.sendTaskReminder(phone, taskTitle, dueDate, clientName);
      }
      
      logger.info({
        email,
        phone,
        taskTitle,
        dueDate,
        clientName,
      }, 'Task reminder notification sent');
    } catch (error) {
      logger.error({
        email,
        phone,
        taskTitle,
        dueDate,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send task reminder notification');
    }
  }

  async sendOverdueAlert(
    email: string,
    phone: string | null,
    taskTitle: string,
    dueDate: Date,
    daysPastDue: number,
    clientName?: string
  ): Promise<void> {
    try {
      // Send email alert
      const subject = `OVERDUE: Task "${taskTitle}" - ${daysPastDue} days past due`;
      const context = {
        taskTitle,
        dueDate: dueDate.toLocaleDateString('en-IN'),
        daysPastDue,
        clientName: clientName || 'N/A',
      };

      await this.emailService.sendTaskReminder(email, subject, context);

      // Send SMS alert if phone number is available
      if (phone) {
        await this.smsService.sendOverdueAlert(phone, taskTitle, daysPastDue, clientName);
      }
      
      logger.info({
        email,
        phone,
        taskTitle,
        dueDate,
        daysPastDue,
        clientName,
      }, 'Overdue alert notification sent');
    } catch (error) {
      logger.error({
        email,
        phone,
        taskTitle,
        dueDate,
        daysPastDue,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send overdue alert notification');
    }
  }

  async sendDigestNotification(
    email: string,
    digestType: 'daily' | 'weekly',
    data: {
      pendingTasks: number;
      overdueTasks: number;
      completedTasks: number;
      upcomingTasks: number;
    }
  ): Promise<void> {
    try {
      const subject = `${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Task Digest`;
      const context = {
        digestType,
        ...data,
      };

      await this.emailService.sendTaskReminder(email, subject, context);
      
      logger.info({
        email,
        digestType,
        data,
      }, 'Digest notification sent');
    } catch (error) {
      logger.error({
        email,
        digestType,
        data,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to send digest notification');
    }
  }
}
