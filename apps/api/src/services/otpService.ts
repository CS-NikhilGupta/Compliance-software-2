import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { EmailService } from './emailService';
import { SMSService } from './smsService';

// In-memory OTP storage (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const storeOTP = (identifier: string, otp: string, expiryMinutes: number = 10): void => {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  otpStore.set(identifier, { otp, expiresAt, attempts: 0 });
  
  // Auto cleanup expired OTP
  setTimeout(() => {
    otpStore.delete(identifier);
  }, expiryMinutes * 60 * 1000);
};

export const verifyOTP = (identifier: string, providedOTP: string): boolean => {
  const stored = otpStore.get(identifier);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expiresAt < new Date()) {
    otpStore.delete(identifier);
    return false;
  }
  
  stored.attempts++;
  
  if (stored.attempts > 3) {
    otpStore.delete(identifier);
    return false;
  }
  
  if (stored.otp === providedOTP) {
    otpStore.delete(identifier);
    return true;
  }
  
  return false;
};

export const sendOTP = async (email: string, otp: string): Promise<void> => {
  try {
    storeOTP(email, otp);
    
    const emailService = new EmailService();
    await emailService.sendOTP(email, otp);
    
    logger.info({ email }, 'OTP sent via email');
  } catch (error) {
    logger.error({ error, email }, 'Failed to send OTP');
    throw error;
  }
};

export const sendSMSOTP = async (phone: string, otp: string): Promise<void> => {
  try {
    storeOTP(phone, otp);
    
    const smsService = new SMSService();
    await smsService.sendOTP(phone, otp);
    
    logger.info({ phone }, 'OTP sent via SMS');
  } catch (error) {
    logger.error({ error, phone }, 'Failed to send SMS OTP');
    throw error;
  }
};
