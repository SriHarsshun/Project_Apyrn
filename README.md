# Project Apyrn

Multi-tenant inventory and workflow management API built with NestJS.

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## Architecture Overview
Project Apyrn is designed as a multi-tenant application where users belong to a `Company`. All inventory items and users are scoped to their respective company to ensure data isolation. The application uses a robust layered architecture: Controller -> Service -> Repository (with Prisma).

## Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables (copy `.env.example` to `.env`)
4. Start infrastructure via Docker Compose:
   ```bash
   docker-compose up postgres redis -d
   ```
5. Apply database migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start the development server:
   ```bash
   pnpm start:dev
   ```

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Application port | 3000 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRATION | JWT expiration time | 1d |
| REDIS_HOST | Redis host address | localhost |
| REDIS_PORT | Redis port | 6379 |
| LOW_STOCK_THRESHOLD | Threshold for low stock | 10 |

## API Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/health/ready` | Readiness check (DB & Redis) |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register company & admin |
| POST | `/api/v1/auth/login` | Authenticate user |

### Users
| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| GET | `/api/v1/users` | List all users | Yes | ADMIN, MANAGER, VIEWER |
| GET | `/api/v1/users/:id` | Get user by ID | Yes | ADMIN, MANAGER, VIEWER |
| POST | `/api/v1/users` | Create user | Yes | ADMIN |
| PATCH | `/api/v1/users/:id` | Update user | Yes | ADMIN |
| DELETE | `/api/v1/users/:id` | Delete user | Yes | ADMIN |

### Items
| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| GET | `/api/v1/items` | List items (w/ filters & pagination) | Yes | ADMIN, MANAGER, VIEWER |
| POST | `/api/v1/items` | Create new item | Yes | ADMIN, MANAGER |
| GET | `/api/v1/items/summary` | Get inventory summary | Yes | ADMIN, MANAGER, VIEWER |
| GET | `/api/v1/items/:id` | Get item by ID | Yes | ADMIN, MANAGER, VIEWER |
| PATCH | `/api/v1/items/:id` | Update item details | Yes | ADMIN, MANAGER |
| DELETE | `/api/v1/items/:id` | Soft delete item | Yes | ADMIN |
| POST | `/api/v1/items/:id/adjust` | Adjust quantity & create audit log | Yes | ADMIN, MANAGER |

## Running Tests
```bash
# Unit tests
pnpm test

# Integration tests (requires test DB via docker-compose.test.yml)
pnpm test:integration

# E2E tests (requires DB and Redis)
pnpm test:e2e
```

## Docker deployment
```bash
docker-compose up -d --build
```

## License
MIT License
