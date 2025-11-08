# Health App

A modern health application built with NestJS, PostgreSQL, and Drizzle ORM. This application provides a robust backend API for managing health-related data and user information.

## 🏗️ Tech Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) v11.1.8 - A progressive Node.js framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) 15 - Reliable and powerful database
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) v0.44.7 - TypeScript-first ORM with excellent developer experience
- **Validation**: [Zod](https://zod.dev/) v4.1.12 - TypeScript-first schema validation
- **Authentication**: [Argon2](https://github.com/ranisalt/node-argon2) v0.44.0 - Secure password hashing
- **Runtime**: [Node.js](https://nodejs.org/) - JavaScript runtime
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Containerization**: [Docker](https://www.docker.com/) - For easy development and deployment
- **Configuration**: [NestJS Config](https://docs.nestjs.com/techniques/configuration) - Environment-based configuration

## ✨ Current Status & Features

### ✅ Implemented Features
- **User Management**: Full CRUD operations for user entities
- **Database Schema**: PostgreSQL with Drizzle ORM integration
- **Validation**: Comprehensive input validation with Zod schemas
- **Security**: Argon2 password hashing for secure authentication
- **Type Safety**: End-to-end TypeScript with database type inference
- **Testing**: Unit and E2E test setup with Jest
- **Development**: Hot reload development server with clean output
- **Docker**: PostgreSQL containerization for easy development

### 🚧 Upcoming Features
- Authentication & Authorization (JWT/Sessions)
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
   DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db
   ```

5. **Run database migrations**
   ```bash
   pnpm drizzle:push
   ```

6. **Start the development server**
   ```bash
   pnpm start:dev
   ```

The API will be available at `http://localhost:3000`.

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

# Application Configuration  
NODE_ENV=development
PORT=3000

# Add other environment-specific variables here as the project grows
```

The application uses NestJS Config module for environment management with validation and type safety.

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

The API follows RESTful conventions with comprehensive validation and type safety.

### Users API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/users` | Get all users | None |
| `POST` | `/users` | Create new user | `CreateUserDto` |
| `GET` | `/users/:id` | Get user by UUID | None |
| `PATCH` | `/users/:id` | Update user | `UpdateUserDto` |
| `DELETE` | `/users/:id` | Delete user | None |

### Request/Response Models

**CreateUserDto:**
```typescript
{
  email: string (email format, max 255 chars)
  firstName: string (1-100 chars)
  lastName: string (1-100 chars) 
  password: string (4-100 chars)
}
```

**UpdateUserDto:** All fields optional from CreateUserDto

**User Response:** All user fields except password (secure by default)

### Features
- ✅ UUID-based user identification
- ✅ Email uniqueness validation
- ✅ Secure password hashing with Argon2
- ✅ Input validation with Zod schemas
- ✅ Type-safe database operations
- ✅ Comprehensive error handling
- ✅ Automatic timestamps (created/updated)

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