# Health App

A modern health application built with NestJS, PostgreSQL, and Drizzle ORM. This application provides a robust backend API for managing health-related data and user information.

## 🏗️ Tech Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Reliable and powerful database
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - TypeScript-first ORM with excellent developer experience
- **Runtime**: [Node.js](https://nodejs.org/) - JavaScript runtime
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- **Containerization**: [Docker](https://www.docker.com/) - For easy development and deployment

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

## 📁 Project Structure

```
health-app/
├── docker-compose.yaml     # Database container configuration
├── README.md              # Project documentation
└── backend/               # NestJS backend application
    ├── src/
    │   ├── main.ts         # Application entry point
    │   ├── app.module.ts   # Root module
    │   ├── database/       # Database configuration
    │   └── users/          # User management module
    ├── drizzle/            # Database migrations
    ├── test/               # E2E tests
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
- `pnpm drizzle:generate` - Generate new migrations
- `pnpm drizzle:push` - Push schema changes to database
- `pnpm drizzle:migrate` - Run pending migrations
- `pnpm drizzle:status` - Check migration status

### Testing
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests

### Code Quality
- `pnpm lint` - Lint and fix code issues
- `pnpm format` - Format code with Prettier

## 🗄️ Database

The application uses PostgreSQL as the primary database, managed through Docker Compose. The database configuration:

- **Host**: localhost
- **Port**: 5433
- **Database**: health_app_db
- **Username**: postgres
- **Password**: password

### Database Management

This project uses Drizzle ORM for database operations. Schema files are located in `src/**/*.schema.ts` and migrations are stored in the `drizzle/` directory.

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
DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db
# Add other environment-specific variables here
```

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest-based unit tests for services and controllers
- **E2E Tests**: Integration tests using Supertest
- **Test Coverage**: Coverage reports available with `pnpm test:cov`

## 📝 API Documentation

The API follows RESTful conventions. Currently implemented endpoints include:

- **Users Module**: User management and authentication endpoints

*API documentation will be expanded as more features are added.*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED license.

## 🔗 Useful Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)