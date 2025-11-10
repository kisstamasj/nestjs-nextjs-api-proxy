# Health App

A modern health application built with NestJS, PostgreSQL, and Drizzle ORM. This application provides a robust backend API for managing health-related data and user information.

## 🏗️ Tech Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) v11.1.8 - A progressive Node.js framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) 15 - Reliable and powerful database
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) v0.44.7 - TypeScript-first ORM with excellent developer experience
- **Validation**: [Zod](https://zod.dev/) v4.1.12 - TypeScript-first schema validation
- **Authentication**: 
  - [Passport](https://www.passportjs.org/) v0.7.0 - Authentication middleware
  - [NestJS JWT](https://docs.nestjs.com/security/authentication) v11.0.1 - JWT token management
  - [NestJS Passport](https://docs.nestjs.com/recipes/passport) v11.0.5 - Passport integration
  - [Argon2](https://github.com/ranisalt/node-argon2) v0.44.0 - Secure password hashing
  - [Cookie Parser](https://github.com/expressjs/cookie-parser) v1.4.7 - Cookie parsing middleware
- **Runtime**: [Node.js](https://nodejs.org/) - JavaScript runtime
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Containerization**: [Docker](https://www.docker.com/) - For easy development and deployment
- **Configuration**: [NestJS Config](https://docs.nestjs.com/techniques/configuration) - Environment-based configuration

## ✨ Current Status & Features

### ✅ Implemented Features
- **User Management**: Full CRUD operations for user entities
- **Authentication & Authorization**: Complete JWT-based auth system with refresh tokens
  - JWT Access & Refresh token strategy
  - Cookie-based token storage with security headers
  - Token rotation and automatic refresh
  - Local strategy for login with email/password
  - Protected routes with Passport guards
- **Database Schema**: PostgreSQL with Drizzle ORM integration
- **Validation**: Comprehensive input validation with Zod schemas
- **Security**: 
  - Argon2 password hashing for secure authentication
  - CORS configuration with credentials support
  - HTTP-only cookies for token storage
  - Secure cookie settings for production
- **Type Safety**: End-to-end TypeScript with database type inference
- **Testing**: Unit and E2E test setup with Jest
- **Development**: Hot reload development server with clean output
- **Docker**: PostgreSQL containerization for easy development

### 🚧 Upcoming Features
- Health data models and tracking
- API rate limiting and security middleware
- Swagger/OpenAPI documentation
- Health metrics and analytics
- File upload capabilities
- Email notification system

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

3. **Install backend dependencies**
   ```bash
   cd backend
   pnpm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db
   
   # JWT Configuration
   JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here
   JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here
   JWT_ACCESS_TOKEN_EXPIRATION_TIME=900    # 15 minutes in seconds
   JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800 # 7 days in seconds
   
   # Application Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   pnpm drizzle:push
   ```

6. **Start the development server**
   ```bash
   pnpm start:dev
   ```

The API will be available at `http://localhost:5000`.

> **Note**: The development server runs with `--no-deprecation` flag to suppress Node.js deprecation warnings for a cleaner development experience.

## 📁 Project Structure

```
health-app/
├── docker-compose.yaml     # PostgreSQL container configuration
├── README.md              # Project documentation (this file)
└── backend/               # NestJS backend application
    ├── src/
    │   ├── main.ts         # Application entry point
    │   ├── app.module.ts   # Root module
    │   ├── database/       # Drizzle database configuration & service
    │   │   ├── drizzle.module.ts
    │   │   └── drizzle.service.ts
    │   ├── auth/           # Authentication module
    │   │   ├── auth.controller.ts     # Auth REST API endpoints  
    │   │   ├── auth.service.ts        # Authentication business logic
    │   │   ├── auth.module.ts         # Auth module configuration
    │   │   ├── auth.schema.ts         # Auth database schema & validation
    │   │   ├── dto/                   # Auth data transfer objects
    │   │   │   └── signup.dto.ts
    │   │   └── strategies/            # Passport authentication strategies
    │   │       ├── local.strategy.ts   # Email/password login strategy
    │   │       ├── jwt-access.strategy.ts # JWT access token strategy
    │   │       └── jwt-refresh.strategy.ts # JWT refresh token strategy
    │   └── users/          # User management module
    │       ├── users.controller.ts    # REST API endpoints
    │       ├── users.service.ts       # Business logic
    │       ├── users.module.ts        # Module configuration
    │       ├── users.schema.ts        # Database schema & validation
    │       └── dto/                   # Data transfer objects
    │           ├── create-user.dto.ts
    │           └── update-user.dto.ts
    ├── drizzle/            # Database migrations & metadata
    │   ├── 0000_stiff_mantis.sql
    │   └── meta/
    ├── test/               # E2E tests
    ├── drizzle.config.ts   # Drizzle ORM configuration
    └── package.json        # Dependencies and scripts
```

## 🛠️ Available Scripts

Navigate to the `backend` directory and run:

### Development
- `pnpm start:dev` - Start development server with hot reload
- `pnpm start:debug` - Start with debug mode enabled

### Building & Production
- `pnpm build` - Build the application
- `pnpm start:prod` - Start production server

### Database Operations
- `pnpm drizzle:generate` - Generate new migrations from schema changes
- `pnpm drizzle:push` - Push schema changes directly to database (dev only)
- `pnpm drizzle:migrate` - Run pending migrations (production)
- `pnpm drizzle:status` - Check migration status
- `pnpm drizzle:reset` - Reset database (⚠️ destructive operation)

### Testing
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests

### Code Quality
- `pnpm lint` - Lint and fix code issues
- `pnpm format` - Format code with Prettier

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

### Adding New Features

1. Create new modules using NestJS CLI:
   ```bash
   nest generate module feature-name
   nest generate controller feature-name
   nest generate service feature-name
   ```

2. Define database schemas using Drizzle ORM in `*.schema.ts` files

3. Generate and run migrations:
   ```bash
   pnpm drizzle:generate
   pnpm drizzle:push
   ```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

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

The application uses NestJS Config module for environment management with validation and type safety.

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

### Framework Documentation
- [NestJS Documentation](https://docs.nestjs.com/) - Backend framework
- [NestJS Authentication](https://docs.nestjs.com/security/authentication) - JWT & Passport integration
- [Passport.js Documentation](https://www.passportjs.org/docs/) - Authentication strategies
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Database ORM
- [Zod Documentation](https://zod.dev/) - Schema validation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database

### Tools & Development
- [Docker Documentation](https://docs.docker.com/) - Containerization
- [pnpm Documentation](https://pnpm.io/) - Package manager
- [Jest Documentation](https://jestjs.io/) - Testing framework
- [Argon2 Documentation](https://github.com/ranisalt/node-argon2) - Password hashing

### Development Tools
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) - Database migrations
- [NestJS CLI](https://docs.nestjs.com/cli/overview) - Code generation
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Language reference