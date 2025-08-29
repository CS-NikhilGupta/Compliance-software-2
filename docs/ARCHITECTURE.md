# Solution Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COMPLIANCE MANAGEMENT SAAS                         │
│                                  (Multi-Tenant)                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Web App       │  │   Mobile PWA    │  │  Client Portal  │                │
│  │ (React + Vite)  │  │  (Responsive)   │  │   (External)    │                │
│  │                 │  │                 │  │                 │                │
│  │ • Dashboard     │  │ • Task View     │  │ • Doc Upload    │                │
│  │ • Calendar      │  │ • Notifications │  │ • Status Track  │                │
│  │ • Task Mgmt     │  │ • Quick Actions │  │ • Approvals     │                │
│  │ • Client CRM    │  │                 │  │                 │                │
│  │ • Reports       │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                 HTTPS/WSS
                                     │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Express.js API Server                               │ │
│  │                                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │    Auth     │ │   Tenant    │ │    RBAC     │ │   Rate      │          │ │
│  │  │ Middleware  │ │ Isolation   │ │ Middleware  │ │ Limiting    │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │                                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   Input     │ │  Request    │ │   Error     │ │   Audit     │          │ │
│  │  │ Validation  │ │   Logger    │ │  Handler    │ │   Logger    │          │ │
│  │  │   (Zod)     │ │   (Pino)    │ │             │ │             │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Auth Service  │  │  Tenant Service │  │  Client Service │                │
│  │                 │  │                 │  │                 │                │
│  │ • JWT Tokens    │  │ • Multi-tenancy │  │ • CRM Functions │                │
│  │ • OTP Verify    │  │ • Org Settings  │  │ • Entity Mgmt   │                │
│  │ • Role Mgmt     │  │ • User Invites  │  │ • Contact Mgmt  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │Compliance Engine│  │  Task Service   │  │Document Service │                │
│  │                 │  │                 │  │                 │                │
│  │ • Catalog Mgmt  │  │ • Auto Generate │  │ • Upload/Store  │                │
│  │ • Due Date Calc │  │ • Workflow Mgmt │  │ • Version Ctrl  │                │
│  │ • Rule Engine   │  │ • Assignment    │  │ • Preview/Tags  │                │
│  │ • Holiday Mgmt  │  │ • Status Track  │  │ • Access Ctrl   │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │Notification Svc │  │  Report Service │  │  Audit Service  │                │
│  │                 │  │                 │  │                 │                │
│  │ • Email (SMTP)  │  │ • Dashboard     │  │ • Activity Log  │                │
│  │ • SMS (Twilio)  │  │ • Export CSV    │  │ • Security Log  │                │
│  │ • Template Mgmt │  │ • Charts/Stats  │  │ • Compliance    │                │
│  │ • Queue Mgmt    │  │ • Filters       │  │ • Data Privacy  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA ACCESS LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Prisma ORM                                       │ │
│  │                                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   Query     │ │  Migration  │ │   Schema    │ │   Client    │          │ │
│  │  │  Builder    │ │   Runner    │ │  Generator  │ │  Generator  │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │                                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   Type      │ │  Connection │ │    Query    │ │   Result    │          │ │
│  │  │  Safety     │ │   Pooling   │ │ Optimization│ │   Caching   │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               PERSISTENCE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   PostgreSQL    │  │      Redis      │  │  File Storage   │                │
│  │   (Primary DB)  │  │   (Cache/Queue) │  │    (Local)      │                │
│  │                 │  │                 │  │                 │                │
│  │ • Multi-tenant  │  │ • BullMQ Jobs   │  │ • Documents     │                │
│  │ • Row Level Sec │  │ • Session Cache │  │ • Images        │                │
│  │ • ACID Trans    │  │ • Rate Limiting │  │ • Attachments   │                │
│  │ • Backup/Restore│  │ • Pub/Sub       │  │ • Versioning    │                │
│  │ • Partitioning  │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKGROUND SERVICES                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Job Queue     │  │   Scheduler     │  │   Monitoring    │                │
│  │   (BullMQ)      │  │   (Cron Jobs)   │  │   (Health)      │                │
│  │                 │  │                 │  │                 │                │
│  │ • Email Queue   │  │ • Due Date Calc │  │ • Health Checks │                │
│  │ • SMS Queue     │  │ • Task Generate │  │ • Metrics       │                │
│  │ • File Process  │  │ • Reminder Send │  │ • Error Track   │                │
│  │ • Report Gen    │  │ • Data Cleanup  │  │ • Performance   │                │
│  │ • Retry Logic   │  │ • Backup Jobs   │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL INTEGRATIONS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │     Twilio      │  │   Email SMTP    │  │   Future APIs   │                │
│  │   (SMS/Voice)   │  │   (MailHog)     │  │   (Phase 2/3)   │                │
│  │                 │  │                 │  │                 │                │
│  │ • SMS Delivery  │  │ • Email Send    │  │ • WhatsApp BSP  │                │
│  │ • OTP Service   │  │ • Templates     │  │ • Digital Sign  │                │
│  │ • Delivery Rcpt │  │ • Bounce Handle │  │ • Accounting    │                │
│  │                 │  │                 │  │ • Payment GW    │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### Multi-Tenancy Strategy
- **Row-Level Security (RLS)**: Every table includes `tenant_id` with PostgreSQL RLS policies
- **Service-Layer Guards**: Middleware ensures tenant isolation at API level
- **Shared Database**: Single database with logical separation (cost-effective for SMEs)
- **Tenant Context**: Request context carries tenant information throughout the stack

### Security Architecture
- **Authentication**: JWT tokens with refresh mechanism + OTP verification
- **Authorization**: Role-Based Access Control (RBAC) with hierarchical permissions
- **Data Protection**: Encryption at rest and in transit, audit logging
- **Input Validation**: Zod schemas for all API endpoints and forms
- **Rate Limiting**: Per-tenant and per-user rate limits with Redis

### Scalability Design
- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Database Optimization**: Connection pooling, query optimization, indexing
- **Caching Strategy**: Redis for sessions, frequently accessed data, and job queues
- **Background Processing**: Async job processing with BullMQ for heavy operations

### Reliability & Monitoring
- **Health Checks**: Comprehensive health endpoints for all services
- **Error Handling**: Structured error responses with proper HTTP status codes
- **Logging**: Structured JSON logging with request correlation IDs
- **Backup Strategy**: Automated database backups with point-in-time recovery

## Data Flow

### User Request Flow
1. **Frontend** → API Gateway (Auth + Tenant + RBAC middleware)
2. **API Gateway** → Business Service (with tenant context)
3. **Business Service** → Data Access Layer (Prisma with RLS)
4. **Data Access** → PostgreSQL (tenant-isolated queries)
5. **Response** ← Back through the stack with proper error handling

### Background Job Flow
1. **Trigger Event** (due date, user action, schedule)
2. **Job Enqueue** → Redis/BullMQ
3. **Worker Process** → Execute job with tenant context
4. **External API** → Send notification (Twilio/SMTP)
5. **Update Status** → Database with delivery confirmation

### File Upload Flow
1. **Frontend** → Signed upload URL request
2. **API** → Generate signed URL with tenant prefix
3. **Frontend** → Direct upload to local storage
4. **Webhook** → Process file (virus scan, metadata extraction)
5. **Database** → Update document record with file info

## Technology Rationale

### Backend Stack
- **Node.js + TypeScript**: Type safety, excellent ecosystem, fast development
- **Express.js**: Mature, flexible, extensive middleware ecosystem
- **Prisma**: Type-safe ORM, excellent PostgreSQL support, migration management
- **Zod**: Runtime type validation, schema-first development

### Frontend Stack
- **React + TypeScript**: Component-based, type-safe, large community
- **Vite**: Fast build tool, excellent dev experience, modern bundling
- **Tailwind CSS**: Utility-first, consistent design system, small bundle
- **shadcn/ui**: High-quality components, accessible, customizable

### Database Choice
- **PostgreSQL**: ACID compliance, JSON support, excellent RLS, mature ecosystem
- **Redis**: High-performance caching, job queues, session storage

### Deployment Strategy
- **Docker**: Consistent environments, easy deployment, scalability
- **GitHub Actions**: Integrated CI/CD, free for public repos, good ecosystem
- **AWS**: Mature cloud platform, extensive services, good pricing for startups
