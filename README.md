# Health App

A modern full-stack health application with a NestJS backend API and Next.js frontend. This application provides a complete user management system with secure authentication, featuring a responsive web interface and robust REST API for managing health-related data and user information.

## 🏗️ Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) v11.1.8 - Progressive Node.js framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) 15 - Production-ready relational database
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) v0.44.7 - TypeScript-first ORM with excellent developer experience
- **Validation**: [Zod](https://zod.dev/) v4.1.12 - TypeScript-first schema validation with nestjs-zod integration
- **Authentication**: 
  - [Passport](https://www.passportjs.org/) v0.7.0 - Authentication middleware
  - [NestJS JWT](https://docs.nestjs.com/security/authentication) v11.0.1 - JWT token management
  - [NestJS Passport](https://docs.nestjs.com/recipes/passport) v11.0.5 - Passport integration
  - [Argon2](https://github.com/ranisalt/node-argon2) v0.44.0 - Secure password hashing

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) v16.0.3 - React-based full-stack framework with App Router
- **React**: [React](https://react.dev/) v19.2.0 - Modern React with latest features
- **UI Components**: 
  - [Shadcn-ui](https://ui.shadcn.com) - UI library
  - [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
  - [Lucide React](https://lucide.dev/) - Beautiful & consistent icon toolkit
- **Forms**: [TanStack Form](https://tanstack.com/form) v1.25.0 - Powerful form state management
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) v2.0.7 - Toast notifications
- **Theming**: [Next Themes](https://github.com/pacocoursey/next-themes) v0.4.6 - Theme switching

### Development & Infrastructure
- **Runtime**: [Node.js](https://nodejs.org/) - JavaScript runtime environment
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Containerization**: [Docker](https://www.docker.com/) - PostgreSQL database containerization
- **API Testing**: REST Client files for comprehensive endpoint testing

## ✨ Current Status & Features

### ✅ Backend Features (NestJS API)
- **User Management**: Complete CRUD operations for user entities with UUID identification
- **Authentication & Authorization**: Full JWT-based auth system with dual-token strategy
  - JWT Access & Refresh token implementation with automatic rotation
  - Multiple Passport strategies (Local, JWT Access, JWT Refresh)
  - Protected routes with role-based guards
- **Database Integration**: PostgreSQL with Drizzle ORM and type-safe queries
- **Security Implementation**: 
  - Argon2 password hashing with salt generation
  - CORS configuration with credentials suppor
  - Session tracking with user agent and IP address logging
- **Input Validation**: Comprehensive validation with Zod schemas and nestjs-zod integration
- **API Documentation**: REST client files with comprehensive endpoint testing
- **Development Tools**: Hot reload, TypeScript support, database migrations

### ✅ Frontend Features (Next.js Web App)
- **Modern UI/UX**: Responsive design with Tailwind CSS and Radix UI components
- **Authentication Forms**: 
  - Sign up form with validation (email, password, name fields)
  - Sign in form with error handling and success notifications
  - Form validation with real-time error messages
- **User Interface Components**: 
  - Accessible form components with proper labeling
  - Toast notifications for user feedback
  - Card-based layout with consistent styling
- **API Integration**: 
  - API proxy routes for backend communication
  - Cookie-based authentication flow (httpony cookie)
- **Developer Experience**:
  - TypeScript throughout with strict type checking
  - Hot module replacement for fast development
  - ESLint configuration for code quality

### ✅ Full-Stack Integration
- **Seamless Authentication**: Frontend forms integrate with backend JWT system
- **Type Safety**: End-to-end TypeScript from database to UI components
- **Development Environment**: Docker-composed database with hot reload on both ends
- **Security**: HTTP-only cookies, CORS configuration, and secure token handling
- **Testing Infrastructure**: Comprehensive test setup with Jest for backend

### 🚧 Upcoming Features
- **Health Data Models**: Patient records, medical history, health metrics tracking
- **Dashboard Interface**: Health analytics, charts, and progress visualization
- **API Enhancements**: Rate limiting, API versioning, Swagger documentation
- **Advanced Security**: 2FA, password reset, email verification
- **File Management**: Profile pictures, document uploads, medical reports
- **Notifications**: Email alerts, push notifications, appointment reminders
- **Mobile Optimization**: Progressive Web App (PWA) capabilities

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) 
- [Docker](https://www.docker.com/) and Docker Compose

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kisstamasj/health-app.git
   cd health-app
   ```

2. **Start the database**
   ```bash
   docker-compose up -d
   ```
   This will start a PostgreSQL database on port `5433`.

3. **Backend Setup**
   ```bash
   cd backend
   pnpm install
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   pnpm install
   ```

5. **Environment Configuration**
   
   **Backend** - Create `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db
   
   # JWT Configuration
   JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here-min-32-chars
   JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here-min-32-chars
   JWT_ACCESS_TOKEN_EXPIRATION_TIME=900    # 15 minutes in seconds
   JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800 # 7 days in seconds
   
   # Application Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Frontend** - Create `.env.local` file in the `frontend` directory:
   ```env
   # Backend API Configuration
   BACKEND_API_URL=http://localhost:5000
   
   # Application Configuration
   NODE_ENV=development
   ```

6. **Database Setup**
   ```bash
   cd backend
   pnpm drizzle:push
   ```

7. **Start Development Servers**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   pnpm start:dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   pnpm dev
   ```

   - **Backend API**: `http://localhost:5000`
   - **Frontend Web App**: `http://localhost:3000`

> **Note**: The development server runs with `--no-deprecation` flag to suppress Node.js deprecation warnings for a cleaner development experience.

## 📁 Project Structure

```
health-app/
├── docker-compose.yaml     # PostgreSQL container configuration
├── README.md              # Project documentation (this file)
├── backend/               # NestJS backend application
│   ├── src/
│   │   ├── main.ts         # Application entry point with CORS & cookie configuration
│   │   ├── app.module.ts   # Root module with global configuration
│   │   ├── database/       # Drizzle database configuration & service
│   │   │   ├── drizzle.module.ts
│   │   │   └── drizzle.service.ts
│   │   ├── auth/           # Authentication module (JWT + Passport)
│   │   │   ├── auth.controller.ts     # Auth REST API endpoints  
│   │   │   ├── auth.service.ts        # Authentication business logic
│   │   │   ├── auth.module.ts         # Auth module configuration
│   │   │   ├── auth.schema.ts         # Auth database schema & Zod validation
│   │   │   ├── dto/                   # Auth data transfer objects
│   │   │   │   └── signup.dto.ts
│   │   │   └── strategies/            # Passport authentication strategies
│   │   │       ├── local.strategy.ts   # Email/password login strategy
│   │   │       ├── jwt-access.strategy.ts # JWT access token strategy
│   │   │       └── jwt-refresh.strategy.ts # JWT refresh token strategy
│   │   └── users/          # User management module
│   │       ├── users.controller.ts    # REST API endpoints
│   │       ├── users.service.ts       # Business logic with Argon2 hashing
│   │       ├── users.module.ts        # Module configuration
│   │       ├── users.schema.ts        # Database schema & validation
│   │       └── dto/                   # Data transfer objects
│   │           ├── create-user.dto.ts
│   │           └── update-user.dto.ts
│   ├── drizzle/            # Database migrations & metadata
│   │   ├── 0000_stiff_mantis.sql      # User table migration
│   │   ├── 0001_dizzy_shen.sql        # Auth tokens table migration
│   │   ├── 0002_solid_killraven.sql   # Schema updates
│   │   ├── 0003_chilly_maginty.sql    # Additional migrations
│   │   ├── 0004_rich_madame_hydra.sql # Latest schema changes
│   │   └── meta/                      # Migration metadata
│   ├── test/               # E2E tests with Jest
│   ├── drizzle.config.ts   # Drizzle ORM configuration
│   └── package.json        # Backend dependencies and scripts
├── frontend/              # Next.js frontend application
│   ├── app/
│   │   ├── globals.css     # Global styles with Tailwind CSS
│   │   ├── layout.tsx      # Root layout component
│   │   ├── page.tsx        # Home page component
│   │   ├── (auth)/         # Auth route group
│   │   │   └── auth/
│   │   │       ├── sign-in/page.tsx   # Sign in page
│   │   │       └── sign-up/page.tsx   # Sign up page
│   │   └── api/            # Next.js API routes
│   │       ├── auth/       # Authentication proxy endpoints
│   │       │   └── sign-in/route.ts   # Sign-in API proxy with cookies
│   │       └── [...path]/  # Dynamic API proxy to backend
│   │           └── route.ts # Universal API proxy with token handling
│   ├── components/         # React UI components
│   │   ├── profile.tsx     # User profile component
│   │   ├── sign-in-form.tsx # Sign-in form with validation
│   │   ├── sign-up-form.tsx # Sign-up form with validation
│   │   └── ui/             # Reusable UI components (Radix + Tailwind)
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── field.tsx   # Form field components
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       └── sonner.tsx  # Toast notifications
│   ├── lib/                # Utility libraries
│   │   ├── utils.ts        # Utility functions
│   │   ├── config.ts       # Configuration constants
│   │   ├── token.ts        # Token management utilities
│   │   └── apiClient.ts    # Axios HTTP client configuration
│   ├── public/             # Static assets
│   ├── components.json     # Shadcn/UI configuration
│   ├── next.config.ts      # Next.js configuration
│   ├── tailwind.config.mjs # Tailwind CSS configuration
│   └── package.json        # Frontend dependencies and scripts
└── rest-client/           # API testing files
    ├── auth.http          # Authentication endpoint tests
    └── users.http         # User management endpoint tests
```

## 🛠️ Available Scripts

### Backend Scripts (in `backend/` directory)

#### Development
- `pnpm start:dev` - Start development server with hot reload (no deprecation warnings)
- `pnpm start:debug` - Start with debug mode enabled
- `pnpm start:prod` - Start production server

#### Building & Production
- `pnpm build` - Build the NestJS application
- `pnpm start` - Start built application

#### Database Operations
- `pnpm drizzle:generate` - Generate new migrations from schema changes
- `pnpm drizzle:push` - Push schema changes directly to database (development only)
- `pnpm drizzle:migrate` - Run pending migrations (production recommended)
- `pnpm drizzle:status` - Check migration status
- `pnpm drizzle:studio` - Open Drizzle Studio for database management

#### Testing
- `pnpm test` - Run unit tests with Jest
- `pnpm test:watch` - Run tests in watch mode for development
- `pnpm test:cov` - Run tests with coverage report
- `pnpm test:e2e` - Run end-to-end integration tests

#### Code Quality
- `pnpm lint` - ESLint with automatic fixes
- `pnpm format` - Format code with Prettier

### Frontend Scripts (in `frontend/` directory)

#### Development
- `pnpm dev` - Start Next.js development server with hot reload
- `pnpm build` - Build the Next.js application for production
- `pnpm start` - Start the production build locally

#### Code Quality
- `pnpm lint` - ESLint with Next.js configuration

### Full-Stack Development Workflow

1. **Start Database**: `docker-compose up -d` (from root)
2. **Backend**: `cd backend && pnpm start:dev`
3. **Frontend**: `cd frontend && pnpm dev`
4. **Access**: 
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - Database: `localhost:5433` (PostgreSQL)

## 🗄️ Database

The application uses PostgreSQL 15 as the primary database, managed through Docker Compose. The database configuration:

- **Host**: localhost
- **Port**: 5433 (mapped from container port 5432)
- **Database**: health_app_db
- **Username**: postgres
- **Password**: password
- **Container**: health-app-postgres

### Database Schema

Current database includes:
- **Users Table**: Complete user management with email, names, password (Argon2 hashed), timestamps
  - UUID primary key with auto-generation
  - Unique email constraint
  - Password hashing with Argon2
  - Created/Updated timestamps
- **Tokens Table**: JWT refresh token management and session tracking
  - User association with foreign key
  - Refresh token storage with rotation support
  - User agent and IP address tracking for security
  - Automatic cleanup and token rotation

### Database Management

This project uses Drizzle ORM for database operations:
- **Schema Definition**: Located in `src/**/*.schema.ts` files with Zod validation
- **Migrations**: Stored in the `drizzle/` directory with metadata tracking
- **Type Safety**: Full TypeScript inference for database operations
- **Validation**: Schema validation using Zod for runtime type checking

## 🔧 Development

### Adding New Backend Features

1. **Create NestJS modules** using the CLI:
   ```bash
   cd backend
   nest generate module feature-name
   nest generate controller feature-name
   nest generate service feature-name
   ```

2. **Define database schemas** using Drizzle ORM in `src/*/**.schema.ts` files with Zod validation

3. **Generate and run migrations**:
   ```bash
   pnpm drizzle:generate  # Generate migration files
   pnpm drizzle:push      # Apply to development database
   ```

### Adding New Frontend Features

1. **Create React components** in `components/` directory:
   ```bash
   cd frontend
   # Add new components, pages, or UI elements
   ```

2. **Add new routes** in the `app/` directory using Next.js App Router

3. **Create reusable UI components** following the existing pattern with Radix UI and Tailwind CSS

### Environment Configuration

**Backend** (`.env` in `backend/` directory):
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db

# JWT Configuration - IMPORTANT: Use strong, unique secrets in production!
JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here-min-32-chars
JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here-min-32-chars
JWT_ACCESS_TOKEN_EXPIRATION_TIME=900     # 15 minutes in seconds
JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800 # 7 days in seconds

# Application Configuration  
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Security Note: Generate strong secrets using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Frontend** (`.env.local` in `frontend/` directory):
```env
# Backend API Configuration
BACKEND_API_URL=http://localhost:5000

# Application Configuration
NODE_ENV=development
```

### Development Tools & Configuration

- **Backend**: NestJS Config module with environment validation and type safety
- **Frontend**: Next.js with TypeScript, ESLint, and Tailwind CSS configuration
- **Database**: Drizzle Studio available via `pnpm drizzle:studio` for visual database management
- **API Testing**: Use REST client files in `rest-client/` for comprehensive endpoint testing
- **Type Safety**: Full TypeScript coverage from database schemas to UI components

## 🔐 Authentication & Security

### JWT Token Strategy

The application implements a dual-token JWT authentication system:

- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Cookie Storage**: HTTP-only cookies prevent XSS attacks
- **Token Rotation**: Automatic refresh token rotation on each use

### Security Configuration

- **CORS**: Configured with credentials support for cookie-based auth
- **Cookie Security**: HTTP-only, Secure (production), SameSite strict
- **Password Hashing**: Argon2 with automatic salt generation
- **Token Secrets**: Environment-based JWT secrets (min 32 characters)
- **Route Protection**: Passport guards on protected endpoints

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /auth/signin (email, password)
    API->>DB: Validate user credentials
    DB-->>API: User data (if valid)
    API->>DB: Store refresh token
    API-->>Client: Set HTTP-only cookies (access + refresh)
    
    Client->>API: GET /auth/profile (with cookies)
    API->>API: Validate access token
    API-->>Client: User profile data
    
    Note over Client,API: Access token expires
    Client->>API: POST /auth/refresh (with refresh cookie)
    API->>DB: Validate & rotate refresh token
    API-->>Client: New tokens via cookies
```

## 🧪 Testing

The project includes comprehensive testing setup with Jest v30:

- **Unit Tests**: Jest-based unit tests for services and controllers
- **E2E Tests**: Integration tests using Supertest v7
- **Test Coverage**: Coverage reports available with `pnpm test:cov`
- **Watch Mode**: Development-friendly test watching with `pnpm test:watch`
- **Debug Mode**: Test debugging support for complex scenarios

### Test Configuration
- **Framework**: Jest 30.2.0 with TypeScript support
- **Test Files**: `*.spec.ts` pattern for unit tests
- **E2E Tests**: Separate configuration in `test/jest-e2e.json`
- **Coverage**: Detailed coverage reports in `coverage/` directory

## 📝 API Documentation

The API follows RESTful conventions with comprehensive validation, type safety, and JWT-based authentication.

### Authentication API Endpoints

| Method | Endpoint | Description | Request Body | Authentication |
|--------|----------|-------------|--------------|---------------|
| `POST` | `/auth/signup` | Register new user | `SignUpDto` | None |
| `POST` | `/auth/signin` | Login user | `{ email, password }` | None |
| `POST` | `/auth/refresh` | Refresh access token | None | Refresh Token |
| `GET` | `/auth/profile` | Get current user profile | None | Access Token |
| `POST` | `/auth/logout` | Logout user | None | Access Token |

### Users API Endpoints

| Method | Endpoint | Description | Request Body | Authentication |
|--------|----------|-------------|--------------|---------------|
| `GET` | `/users` | Get all users | None | Access Token |
| `POST` | `/users` | Create new user | `CreateUserDto` | Access Token |
| `GET` | `/users/:id` | Get user by UUID | None | Access Token |
| `PATCH` | `/users/:id` | Update user | `UpdateUserDto` | Access Token |
| `DELETE` | `/users/:id` | Delete user | None | Access Token |

### Request/Response Models

**SignUpDto:**
```typescript
{
  email: string (email format, max 255 chars)
  firstName: string (1-100 chars)
  lastName: string (1-100 chars) 
  password: string (4-100 chars)
}
```

**CreateUserDto:** Same as SignUpDto

**UpdateUserDto:** All fields optional from CreateUserDto

**Login Request:**
```typescript
{
  email: string
  password: string
}
```

**User Response:** All user fields except password (secure by default)

### Authentication Flow

1. **Registration**: `POST /auth/signup` with user details
2. **Login**: `POST /auth/signin` returns user data + sets HTTP-only cookies
3. **Protected Routes**: Access token automatically sent via cookies
4. **Token Refresh**: Automatic refresh when access token expires
5. **Logout**: `POST /auth/logout` clears cookies and invalidates refresh token

### Security Features
- ✅ **Authentication**: Complete JWT-based authentication system
- ✅ **Authorization**: Route-level protection with Passport guards  
- ✅ **Token Management**: Access + Refresh token rotation strategy
- ✅ **Cookie Security**: HTTP-only, Secure, SameSite strict cookies
- ✅ **Password Security**: Argon2 hashing with salt
- ✅ **Session Tracking**: User agent and IP tracking for security
- ✅ **CORS Protection**: Configurable CORS with credentials support
- ✅ **Input Validation**: Comprehensive validation with Zod schemas
- ✅ **Type Safety**: End-to-end TypeScript type safety
- ✅ **UUID Identification**: UUID-based user identification
- ✅ **Email Uniqueness**: Database-level email constraint
- ✅ **Error Handling**: Secure error responses without data leaks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED license.

## 🔗 Useful Links

### Backend Documentation
- [NestJS Documentation](https://docs.nestjs.com/) - Backend framework and architecture
- [NestJS Authentication](https://docs.nestjs.com/security/authentication) - JWT & Passport integration
- [Passport.js Documentation](https://www.passportjs.org/docs/) - Authentication strategies
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Database ORM and queries
- [Zod Documentation](https://zod.dev/) - Schema validation and type inference
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database features and SQL

### Frontend Documentation
- [Next.js Documentation](https://nextjs.org/docs) - Full-stack React framework
- [React Documentation](https://react.dev/) - React 19 features and patterns
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Radix UI Documentation](https://www.radix-ui.com/primitives) - Accessible UI components
- [TanStack Form](https://tanstack.com/form) - Powerful form state management
- [Axios Documentation](https://axios-http.com/docs/) - HTTP client library

### Development Tools & Infrastructure
- [Docker Documentation](https://docs.docker.com/) - Containerization and database setup
- [pnpm Documentation](https://pnpm.io/) - Fast and efficient package manager
- [Jest Documentation](https://jestjs.io/) - Testing framework and utilities
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) - Database migrations and studio
- [NestJS CLI](https://docs.nestjs.com/cli/overview) - Code generation and project scaffolding
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Language reference and features

### Security & Authentication
- [Argon2 Documentation](https://github.com/ranisalt/node-argon2) - Password hashing algorithm
- [JWT.io](https://jwt.io/) - JSON Web Token standards and debugging
- [OWASP Security Guidelines](https://owasp.org/) - Web application security best practices