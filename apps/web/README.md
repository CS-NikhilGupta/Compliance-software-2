# Compliance Management SaaS - Frontend

A modern React-based frontend application for the Compliance Management SaaS platform, built specifically for Indian CS/CA SME firms.

## 🚀 Features

- **Modern UI/UX**: Built with React 18, TypeScript, and Tailwind CSS
- **Authentication**: JWT-based authentication with role-based access control
- **Dashboard**: Comprehensive overview with charts, statistics, and recent activity
- **Client Management**: Manage client organizations and their details
- **Entity Management**: Handle different types of business entities
- **Task Management**: Create, assign, and track compliance tasks
- **Compliance Catalog**: Browse Indian compliance requirements
- **Document Management**: Upload, organize, and manage compliance documents
- **Notifications**: Real-time notifications and alerts
- **Reports & Analytics**: Generate insights and performance reports
- **User Management**: Invite and manage team members (Admin only)
- **Settings**: Profile management and preferences

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```
   VITE_API_URL=http://localhost:3001
   NODE_ENV=development
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── clients/         # Client management components
│   ├── compliance/      # Compliance catalog components
│   ├── dashboard/       # Dashboard components
│   ├── documents/       # Document management components
│   ├── entities/        # Entity management components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── notifications/   # Notification components
│   ├── reports/         # Reports and analytics components
│   ├── tasks/           # Task management components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   └── users/           # User management components
├── lib/                 # Utility libraries
│   ├── api.ts           # API client and endpoints
│   └── utils.ts         # Utility functions
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── clients/         # Client pages
│   ├── compliance/      # Compliance pages
│   ├── dashboard/       # Dashboard page
│   ├── documents/       # Document pages
│   ├── entities/        # Entity pages
│   ├── notifications/   # Notification pages
│   ├── reports/         # Report pages
│   ├── settings/        # Settings pages
│   ├── tasks/           # Task pages
│   └── users/           # User management pages
├── stores/              # Zustand stores
│   └── authStore.ts     # Authentication state management
├── App.tsx              # Main app component with routing
├── main.tsx             # App entry point
└── index.css            # Global styles
```

## 🎨 Design System

The application uses a consistent design system with:

- **Colors**: Primary blue theme with semantic colors for status indicators
- **Typography**: Inter font family with consistent sizing scale
- **Components**: Reusable UI components with consistent styling
- **Layout**: Responsive design with mobile-first approach
- **Icons**: Heroicons for consistent iconography

## 🔐 Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User)
- Protected routes with automatic redirects
- Session persistence with localStorage

## 📊 State Management

- **Zustand**: Lightweight state management for authentication
- **React Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation

## 🌐 API Integration

The frontend integrates with the backend API through:

- **Axios client**: Configured with interceptors for error handling
- **Request/Response interceptors**: Automatic token attachment and error handling
- **Type-safe endpoints**: TypeScript interfaces for all API responses
- **Error handling**: Centralized error handling with toast notifications

## 🎯 Key Features

### Dashboard
- Overview statistics and KPIs
- Task status and priority distributions
- Recent activity feed
- Upcoming tasks widget
- Interactive charts and visualizations

### Task Management
- Create and assign tasks
- Task filtering and search
- Status updates and progress tracking
- Due date management
- Task comments and checklists

### Client & Entity Management
- Client onboarding and management
- Entity type support (Pvt Ltd, LLP, etc.)
- GST and PAN number validation
- Relationship mapping

### Document Management
- File upload with drag-and-drop
- Document categorization
- Search and filtering
- Download and preview capabilities
- Task and entity associations

### Compliance Catalog
- Indian compliance requirements
- Category-based organization
- Frequency and penalty information
- Entity type applicability

### Reports & Analytics
- Task performance reports
- Client analytics
- Compliance tracking
- Team performance metrics
- Exportable reports

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting (configured in editor)
- **Husky**: Git hooks for pre-commit checks (if configured)

## 🔧 Configuration

### Vite Configuration
- React plugin for JSX support
- Path aliases for clean imports
- Proxy configuration for API calls
- Build optimizations

### Tailwind Configuration
- Custom color palette
- Extended theme with brand colors
- Custom utilities and components
- Responsive breakpoints

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions
- Optimized navigation for mobile devices

## 🔒 Security

- XSS protection through React's built-in sanitization
- CSRF protection via API tokens
- Secure token storage
- Input validation and sanitization
- Role-based UI restrictions

## 🌟 Performance

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Efficient re-rendering with React Query
- Memoization where appropriate

## 📈 Monitoring & Analytics

Ready for integration with:
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring
- User behavior tracking

## 🤝 Contributing

1. Follow the established code style and patterns
2. Use TypeScript for all new code
3. Add proper error handling
4. Include loading states for async operations
5. Ensure responsive design
6. Add appropriate accessibility attributes

## 📄 License

This project is part of the Compliance Management SaaS platform.
