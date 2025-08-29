import { z } from 'zod';

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  tenantName: z.string().min(1, 'Organization name is required'),
  phone: z.string().optional(),
});

export const OTPVerifySchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// ============================================================================
// TENANT SCHEMAS
// ============================================================================

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export const UpdateTenantSchema = CreateTenantSchema.partial();

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const InviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  roleId: z.string().min(1, 'Role is required'),
});

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  type: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OPC', 'TRUST', 'SOCIETY', 'COOPERATIVE', 'HUF']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  cinNumber: z.string().optional(),
  udyamNumber: z.string().optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

export const CreateEntitySchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  tradeName: z.string().optional(),
  entityType: z.enum(['PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OPC', 'TRUST', 'SOCIETY', 'COOPERATIVE', 'HUF', 'BRANCH_OFFICE', 'LIAISON_OFFICE', 'PROJECT_OFFICE']),
  cinNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  tanNumber: z.string().optional(),
  incorporationDate: z.string().datetime().optional(),
  registeredAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  businessAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

export const UpdateEntitySchema = CreateEntitySchema.partial();

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  type: z.enum(['COMPLIANCE', 'FILING', 'PAYMENT', 'RENEWAL', 'REGISTRATION', 'AUDIT', 'CONSULTATION', 'FOLLOW_UP', 'OTHER']).default('COMPLIANCE'),
  dueDate: z.string().datetime('Invalid due date format'),
  startDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  clientId: z.string().optional(),
  entityId: z.string().optional(),
  complianceId: z.string().optional(),
  assigneeId: z.string().optional(),
  approvalRequired: z.boolean().default(false),
  slaHours: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'FILED', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
});

export const TaskFilterSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'FILED', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigneeId: z.string().optional(),
  clientId: z.string().optional(),
  entityId: z.string().optional(),
  complianceId: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const CreateDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  category: z.enum(['KYC', 'COMPLIANCE', 'FILING', 'CORRESPONDENCE', 'INVOICE', 'RECEIPT', 'AGREEMENT', 'CERTIFICATE', 'RETURN', 'CHALLAN', 'OTHER']),
  description: z.string().optional(),
  clientId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['PRIVATE', 'CLIENT', 'TEAM', 'PUBLIC']).default('PRIVATE'),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

export const DocumentFilterSchema = z.object({
  category: z.enum(['KYC', 'COMPLIANCE', 'FILING', 'CORRESPONDENCE', 'INVOICE', 'RECEIPT', 'AGREEMENT', 'CERTIFICATE', 'RETURN', 'CHALLAN', 'OTHER']).optional(),
  clientId: z.string().optional(),
  entityId: z.string().optional(),
  taskId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['REMINDER', 'OVERDUE', 'STATUS_UPDATE', 'ASSIGNMENT', 'APPROVAL', 'SYSTEM', 'MARKETING']),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  channels: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH'])).default(['IN_APP']),
  metadata: z.record(z.any()).optional(),
});

export const NotificationFilterSchema = z.object({
  type: z.enum(['REMINDER', 'OVERDUE', 'STATUS_UPDATE', 'ASSIGNMENT', 'APPROVAL', 'SYSTEM', 'MARKETING']).optional(),
  isRead: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const NotificationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  type: z.enum(['REMINDER', 'OVERDUE', 'STATUS_UPDATE', 'ASSIGNMENT', 'APPROVAL', 'SYSTEM', 'MARKETING']),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH']),
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
  variables: z.record(z.string()).optional(),
});

// ============================================================================
// COMPLIANCE SCHEMAS
// ============================================================================

export const CreateComplianceSchema = z.object({
  name: z.string().min(1, 'Compliance name is required'),
  description: z.string().optional(),
  category: z.enum(['GST', 'INCOME_TAX', 'TDS_TCS', 'ROC_MCA', 'LABOUR_LAW', 'ENVIRONMENTAL', 'FEMA', 'SEBI', 'RBI', 'CUSTOMS', 'EXCISE', 'SERVICE_TAX', 'PROFESSIONAL_TAX', 'ESI_PF', 'SHOPS_ESTABLISHMENT', 'FIRE_NOC', 'POLLUTION_CONTROL', 'OTHER']),
  subCategory: z.string().optional(),
  actName: z.string().min(1, 'Act name is required'),
  sectionNumber: z.string().optional(),
  formNumber: z.string().optional(),
  entityTypes: z.array(z.enum(['PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OPC', 'TRUST', 'SOCIETY', 'COOPERATIVE', 'HUF', 'BRANCH_OFFICE', 'LIAISON_OFFICE', 'PROJECT_OFFICE'])),
  turnoverThreshold: z.number().optional(),
  employeeThreshold: z.number().int().optional(),
  periodicity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY', 'EVENT_BASED', 'ONE_TIME']),
  dueDateRule: z.record(z.any()),
  penaltyStructure: z.record(z.any()).optional(),
  consequences: z.string().optional(),
  documentsRequired: z.array(z.string()).optional(),
  governmentPortal: z.string().url().optional(),
  helpLinks: z.array(z.string().url()).optional(),
});

export const UpdateComplianceSchema = CreateComplianceSchema.partial();

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const ReportFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientId: z.string().optional(),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
});

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type OTPVerifyInput = z.infer<typeof OTPVerifySchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type NotificationTemplateInput = z.infer<typeof NotificationTemplateSchema>;
export type CreateComplianceInput = z.infer<typeof CreateComplianceSchema>;
export type UpdateComplianceInput = z.infer<typeof UpdateComplianceSchema>;
export type DocumentFilterInput = z.infer<typeof DocumentFilterSchema>;
export type NotificationFilterInput = z.infer<typeof NotificationFilterSchema>;
export type ReportFilterInput = z.infer<typeof ReportFilterSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
