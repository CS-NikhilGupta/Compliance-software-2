# Compliance Management SaaS

A comprehensive multi-tenant compliance management platform built specifically for Indian CS/CA SME firms. This production-ready SaaS solution helps manage compliance requirements, track tasks, organize documents, and ensure regulatory adherence across multiple clients and entities.

## Architecture

This is a monorepo containing:
│   └── workflows/    # CI/CD pipelines
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+

### Local Development

1. **Clone and setup**
```bash
git clone <repo-url>
cd compliance-management-saas
npm install
```

2. **Start services**
```bash
docker-compose up -d  # Starts PostgreSQL, Redis, MailHog
npm run dev           # Starts both API and Web apps
```

3. **Access the application**
- Web App: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/docs
- MailHog: http://localhost:8025

### Default Credentials
- **Username:** admin
- **Password:** test123

## 📋 Features (Phase 1 MVP)

### Core Features
- ✅ Multi-tenant SaaS architecture
- ✅ Role-based access control (Owner/Admin, Manager, Staff, Client, Auditor)
- ✅ Compliance catalog with 200+ Indian regulations
- ✅ Automated task generation and scheduling
- ✅ Document management with versioning
- ✅ Client CRM and entity management
- ✅ Notification system (Email, SMS via Twilio)
- ✅ Comprehensive reporting and dashboard
- ✅ Mobile-responsive PWA

### Security
- JWT-based authentication with OTP
- Row-level security (RLS) for multi-tenancy
- RBAC middleware
- Audit logging
- Input validation with Zod
- HTTPS enforcement

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **Validation:** Zod
- **Queue:** BullMQ + Redis
- **Testing:** Jest
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Routing:** TanStack Router
- **State:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Playwright

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions
- **Cloud:** AWS (Terraform stubs included)

## 📊 Database Schema

The application uses a multi-tenant PostgreSQL database with row-level security. Key entities:

- **Tenants** (Firms)
- **Users** with role-based permissions
- **Clients** and their **Entities** (companies)
- **Compliance Catalog** with rules and templates
- **Tasks** with workflows and assignments
- **Documents** with versioning
- **Notifications** and audit logs

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/compliance_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Twilio (for SMS)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="your-twilio-number"

# Email
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""

# File Storage
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="5242880"  # 5MB
```

## 📈 Development

### Available Scripts

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start both apps in dev mode
npm run dev:api      # Start only API
npm run dev:web      # Start only Web app

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:reset     # Reset and reseed database

# Testing
npm run test         # Run all tests
npm run test:api     # Backend tests
npm run test:web     # Frontend tests
npm run test:e2e     # End-to-end tests

# Build
npm run build        # Build both apps
npm run build:api    # Build API only
npm run build:web    # Build Web only

# Linting
npm run lint         # Lint all code
npm run lint:fix     # Fix linting issues
```

## 📚 Documentation

- [Deployment Guide](./docs/DEPLOY.md)
- [Security Guide](./docs/SECURITY.md)
- [API Documentation](./docs/API.md)
- [Architecture Decisions](./docs/ADR/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
