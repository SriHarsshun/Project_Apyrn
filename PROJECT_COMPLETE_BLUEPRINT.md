# PROJECT_COMPLETE_BLUEPRINT

## 1. Overview

This repository is a NestJS backend for a multi-company inventory and auth API built on Fastify, TypeScript, Prisma, PostgreSQL, Redis, and Docker. The application exposes authenticated item-management endpoints under a versioned `/v1` API prefix, enforces role-based access, writes audit events for quantity adjustments, and caches inventory summaries in Redis. The project is organized as a folder-per-feature NestJS app with Prisma schema-driven persistence, Dockerized local services, Jest-based tests, CI checks, and runtime-safe configuration patterns suitable for future scaffolding and onboarding.

This document merges the original architecture blueprint with the runtime-hardening work completed during validation so it acts as a single authoritative source of truth for engineers and AI scaffolding agents.

---

## 2. Tech Stack

| Tool | Purpose | Version |
| --- | --- | --- |
| NestJS | Backend framework | `@nestjs/core` `^12.0.1`, `@nestjs/common` `^12.0.1`, `@nestjs/platform-fastify` `^12.0.1` |
| Fastify | HTTP server adapter used by NestJS | `@nestjs/platform-fastify` `^12.0.1` |
| TypeScript | Application language and build target | `typescript` `^5.9.3` |
| Prisma ORM | Database schema, migrations, generated client, queries | `prisma` `7.10.0`, `@prisma/client` `^7.10.0`, `@prisma/adapter-pg` `^7.10.0` |
| PostgreSQL | Primary relational database | `postgres:16` in Docker, `pg` `^8.23.0` |
| Redis | Caching, queue back-end, health checks | `redis:7` in Docker, `ioredis` `^6.0.0`, `bullmq` `^6.3.6` |
| Node.js | Runtime | `node:20-alpine` in Docker; CI uses `node-version: 20`; package manager `pnpm@10.12.4` |
| pnpm | Package manager and lockfile standard | `10.12.4` |
| JWT auth | User authentication and authorization | `@nestjs/jwt` `^12.0.1`, `passport-jwt` `^4.0.1`, `passport` `^0.7.0` |
| Validation | DTO validation and transformation | `class-validator` `^0.15.1`, `class-transformer` `^0.5.1` |
| Environment validation | Strong config schema enforcement | `zod` `^4.5.4` |
| Swagger/OpenAPI | API docs | `@nestjs/swagger` `^12.0.1` |
| Logging | Structured request logging | `nestjs-pino` `^5.1.0`, `pino-http` `^11.0.0` |
| Testing | Unit, integration, E2E test runner | `jest` `^30.5.1`, `ts-jest` `^29.4.12`, `supertest` `^7.2.2`, `@nestjs/testing` `^12.0.3` |
| Linting/formatting | Static analysis and formatting | `eslint` `^10.11.0`, `@eslint/js` `^10.0.1`, `prettier` `^3.9.8` |
| Docker | Local app and dependency orchestration | `docker-compose.yml`, `Dockerfile` |
| CI/CD | GitHub Actions pipeline | `.github/workflows/ci.yml` |
| Config | Root env loading | `dotenv` `^17.4.2` |
| Security / hashing | Password hashing | `bcrypt` `^6.0.0` |

### Dependency groups

Framework and runtime:
- `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/platform-fastify`, `@nestjs/swagger`
- `@fastify/static`, `rxjs`, `reflect-metadata`, `passport`, `passport-jwt`

ORM and database:
- `@prisma/client`, `@prisma/adapter-pg`, `prisma`, `pg`

Caching and queueing:
- `bullmq`, `ioredis`

Validation and config:
- `class-validator`, `class-transformer`, `zod`, `dotenv`

Testing:
- `jest`, `ts-jest`, `supertest`, `@types/jest`, `@types/supertest`, `@nestjs/testing`, `cross-env`

Docs and logging:
- `@nestjs/swagger`, `nestjs-pino`, `pino-http`

CI/CD and tooling:
- `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `@nestjs/cli`, `ts-node`

---

## 3. Folder Structure

```text
.
├── .agents/                    # Agent/editor customization metadata; contains task scaffolding files
├── .claude/                    # Claude-specific project automation files
├── .windsurf/                  # Windsurf-specific project automation files
├── .github/                    # GitHub automation and repo metadata
│   ├── CODEOWNERS              # Ownership rules for source paths
│   └── workflows/
│       └── ci.yml              # Lint, test, build, Docker checks
├── coverage/                   # Generated Jest coverage reports and HTML output
├── prisma/                     # Prisma schema and migrations
│   ├── schema.prisma           # Canonical DB schema for Company, User, Item, AuditLog
│   └── migrations/             # Timestamped SQL migration history
├── src/                        # Application source code
│   ├── app.module.ts           # Root module; global config, logging, Prisma, Redis, modules assembly
│   ├── app.controller.ts       # Basic root controller (minimal app shell)
│   ├── app.service.ts          # Basic root service (minimal app shell)
│   ├── main.ts                 # Bootstraps NestJS + Fastify + validation + Swagger + filters
│   ├── generated/prisma/       # Generated Prisma client code
│   ├── auth/                   # Auth feature module
│   │   ├── decorators/         # JWT and role decorators
│   │   ├── dto/                # Login and registration DTOs
│   │   ├── guards/             # JWT and role guards
│   │   ├── strategies/         # Passport strategies
│   │   ├── auth.controller.ts  # Register/login HTTP endpoints
│   │   ├── auth.module.ts      # Auth module registration
│   │   └── auth.service.ts     # Registration/login logic; JWT issuance; audit logging
│   ├── common/                 # Shared cross-cutting code
│   │   ├── context/            # AsyncLocalStorage request context metadata
│   │   ├── exceptions/         # Custom app exceptions
│   │   ├── filters/            # Global exception handling
│   │   ├── guards/             # Shared guards (example: CompanyContextGuard)
│   │   ├── interceptors/       # Logging interceptor
│   │   ├── middleware/         # Request context middleware
│   │   ├── prisma/             # Global Prisma module and service
│   │   ├── queues/             # BullMQ queue and worker definitions
│   │   └── redis/              # Global Redis module and service
│   ├── config/                 # Environment validation schema
│   │   └── env.schema.ts       # Zod validation for DATABASE_URL and JWT_SECRET
│   ├── health/                 # Health/readiness module
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── items/                  # Feature module for inventory items
│   │   ├── dto/                # Create/update/query/response DTOs
│   │   ├── items.controller.ts # REST endpoints for items
│   │   ├── items.module.ts     # Module wiring for repository/service provider
│   │   ├── items.repository.ts # Repository interface contract
│   │   ├── items.service.ts    # Business logic + Redis invalidation + queueing
│   │   └── prisma-items.repository.ts # Prisma-backed implementation
│   └── users/                  # Example user feature scaffold
│       ├── dto/
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── test/                       # Automated tests
│   ├── factories/              # Test data builders
│   │   └── item.factory.ts
│   ├── items/                  # Integration and E2E specs
│   │   ├── items.spec.ts       # End-to-end API test
│   │   └── prisma.repository.int.spec.ts
│   └── setup-env.js            # Loads .env.test for tests
├── .dockerignore               # Docker ignore rules
├── .env                        # Local runtime environment for compose/app
├── .env.example                # Template env file
├── .env.test                   # Test database config for Jest
├── .gitignore                  # Excludes node_modules, dist, coverage, generated Prisma, env files
├── docker-compose.yml          # Local app + Postgres + Redis orchestration
├── docker-compose.test.yml     # Test-only Postgres service for local DB integration checks
├── Dockerfile                  # Multi-stage Node 20 image, Prisma generate, build, run
├── eslint.config.mjs           # ESLint config
├── jest.config.js              # Jest config and coverage constraints
├── package.json                # Scripts and dependency manifest
├── pnpm-lock.yaml              # Locked dependency graph
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── prisma7.config.ts           # Prisma config file
├── skills-lock.json            # Local lock for AI/skill metadata
├── tsconfig.json               # Base TypeScript config
├── tsconfig.spec.json          # TypeScript config for tests
├── PROJECT_BLUEPRINT.md        # Architecture blueprint
├── PROJECT_FINAL_BLUEPRINT.md  # Runtime validation and fix log
├── PROJECT_COMPLETE_BLUEPRINT.md # This consolidated master file
└── README.md                   # Not present in this repo; no readme was checked in
```

---

## 4. Core Processes

### 4.1 Feature module and folder-per-feature conventions

The project organizes code by domain feature under `src/` and keeps shared code under `src/common/`. The naming pattern is:

- `*.module.ts` for module registration
- `*.controller.ts` for HTTP endpoints
- `*.service.ts` for business logic
- `*.repository.ts` for repository contracts
- `prisma-*.repository.ts` for Prisma implementation
- `dto/` for request and response validation objects
- `guards/`, `strategies/`, `decorators/`, `middleware/`, `interceptors/` for shared concerns

Example:

```ts
@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}
}
```

How to replicate:
1. Create a feature folder under `src/`.
2. Add a module, controller, service, and DTO folder.
3. Place shared concerns in `src/common/`.

### 4.2 Database and Prisma workflow

The DB schema is declared in `prisma/schema.prisma` and uses PostgreSQL. The schema includes:

- `Company`, `User`, `Item`, `AuditLog`
- enum `Role` with `ADMIN`, `MANAGER`, `VIEWER`
- enum `ItemStatus` with `ACTIVE`, `INACTIVE`
- `deletedAt` soft-deletion on `Item`
- JSON `details` field on `AuditLog`

Prisma generation is configured in the schema:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

The app uses a custom `PrismaService` that extends the generated client and initializes a Prisma PG adapter:

```ts
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }
}
```

The workflow is:
1. Define schema in `prisma/schema.prisma`
2. Run `pnpm prisma generate`
3. Run migrations with `pnpm prisma migrate dev` locally or `pnpm prisma migrate deploy` in CI/production
4. Keep migration SQL in `prisma/migrations/`

There is no explicit `prisma seed` script in the repo; tests create their own data directly.

### 4.3 API design conventions

The app uses a versioned REST API with a global prefix:

```ts
app.setGlobalPrefix("v1");
```

Observed routes:
- Auth: `POST /v1/auth/register`, `POST /v1/auth/login`
- Items: `GET /v1/items`, `GET /v1/items/:id`, `POST /v1/items`, `PATCH /v1/items/:id`, `DELETE /v1/items/:id`
- Quantity action: `PATCH /v1/items/:id/adjust-quantity`
- Health: `GET /v1/health`, `GET /v1/ready`

DTO validation is enforced globally:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);
```

Swagger is enabled via `DocumentBuilder` and `SwaggerModule.setup("api", app, document)`.

### 4.4 Error handling and logging conventions

Global exception handling is centralized in `src/common/filters/global-exception.filter.ts`.

The filter standardizes the payload with:
- `statusCode`
- `errorCode`
- `message`
- `requestId`
- `timestamp`
- `path`

Logging is configured in `src/app.module.ts` with `LoggerModule.forRoot(...)` and `nestjs-pino`. Sensitive fields are redacted using `redact`.

The project also uses a request-scoped context with `AsyncLocalStorage` for request IDs, user IDs, and company IDs.

### 4.5 Caching strategy and Redis usage

Redis is used for:
- inventory summary cache
- queue backend for BullMQ jobs
- health readiness checks

Example cache pattern:

```ts
const cacheKey = `inventory-summary:company:${companyId}`;
const cached = await this.redisService.get(cacheKey);
if (cached) return JSON.parse(cached);

const summary = await this.itemsRepository.getInventorySummary(companyId);
await this.redisService.set(cacheKey, JSON.stringify(summary), 60);
```

Write operations invalidate the cache:

```ts
await this.redisService.del(`inventory-summary:company:${companyId}`);
```

BullMQ is configured with a Redis-backed queue and worker for low-stock job processing.

### 4.6 Testing conventions

Jest configuration is defined in `jest.config.js` and includes:
- `testEnvironment: "node"`
- `roots: ["<rootDir>/src", "<rootDir>/test"]`
- `testRegex: ".*\.spec\.ts$"`
- coverage enforced for `src/items/items.service.ts`

Coverage threshold:
- branches 80%
- functions 80%
- lines 80%
- statements 80%

Test structure:
- `src/items/items.service.spec.ts` = unit tests
- `test/items/prisma.repository.int.spec.ts` = integration tests against Postgres
- `test/items/items.spec.ts` = E2E API tests
- `test/factories/item.factory.ts` = test data builder

### 4.7 Environment and config management

The app validates env variables with a Zod schema in `src/config/env.schema.ts`:

```ts
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});
```

Local runtime env files include:
- `.env.example`
- `.env`
- `.env.test`

The runtime validation process also identified that Redis must be environment-aware; the final hardened setup includes:

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

and for local tests:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 4.8 Git workflow and repository conventions

No full branch policy or PR template was checked into the repo, but there is a `.github/CODEOWNERS` file:

```text
/src/auth/ @backend-team
/src/items/ @backend-team
```

This indicates ownership conventions for backend code paths, but no explicit Day 14 review checklist or commit policy is present in repository files.

### 4.9 CI/CD workflow

GitHub Actions workflow in `.github/workflows/ci.yml` triggers on:
- `push`
- `pull_request` to `main`

Pipeline stages:
- `lint` job
- `unit-test` job
- `integration-test` job with Postgres and Redis services
- `build` job with TypeScript validation
- `e2e` job
- `docker-build` job

### 4.10 Containerization and local runtime

`Dockerfile` builds the app in two stages:
- install dependencies and generate Prisma client
- compile TypeScript
- copy only runtime output to final image
- expose port `3000`
- run health check on `/v1/health`

`docker-compose.yml` defines:
- `app`
- `postgres`
- `redis`

`docker-compose.test.yml` defines a dedicated test Postgres service for database-backed Jests.

---

## 5. Setup & Run Instructions

### Install dependencies

```bash
corepack enable
pnpm install
```

### Configure environment

```bash
cp .env.example .env
```

Example env values:

```env
DATABASE_URL="postgresql://postgres:your_database_password@postgres:5432/day5db"
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
```

For tests, use `.env.test`.

### Start local services

```bash
docker compose up -d postgres redis
```

### Generating Prisma client and migrating the DB

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

For CI or deployment-like DB setup:

```bash
pnpm prisma migrate deploy
```

### Start dev server

```bash
pnpm start:dev
```

### Build the app

```bash
pnpm build
```

### Run tests

Unit tests:

```bash
pnpm test -- --runInBand src/items/items.service.spec.ts
```

Integration tests:

```bash
docker compose -f docker-compose.test.yml up -d postgres-test
pnpm test -- --runInBand test/items/prisma.repository.int.spec.ts
```

E2E tests:

```bash
pnpm test -- --runInBand test/items/items.spec.ts
```

Full suite:

```bash
pnpm test -- --runInBand
```

Coverage:

```bash
pnpm test:coverage
```

---

## 6. Runtime issues discovered and fixed during validation

During the full validation pass, the project surfaced several real environment/runtime issues. These were corrected so the application works reliably in both Docker and local test scenarios.

### 6.1 Redis host hard-code issue

Problem:
- The app assumed Redis was reachable at `redis` in all contexts.

Fix:
- Added `src/common/redis/redis.config.ts`
- Host resolution now prefers explicit env values and then resolves to:
  - `127.0.0.1` under test
  - `redis` under Docker

### 6.2 Prisma DB URL assumption

Problem:
- Some test runs used a host that was not available in local or CI runtime.

Fix:
- Added fallback handling in `src/common/prisma/prisma.service.ts`
- Test execution uses the dedicated DB host for local verification.

### 6.3 Fastify middleware incompatibility

Problem:
- The request context middleware used `req.headers.set()`, which is invalid for Fastify request objects.

Fix:
- Middleware now safely copies headers and stores the request ID in a valid shape.

### 6.4 Fastify exception filter compatibility

Problem:
- The exception handler assumed `response.status()` always existed.

Fix:
- Added fallback handling to `response.code()` and `response.send()`.

### 6.5 Environment file gaps

Problem:
- `.env` and `.env.test` were missing Redis values and thus runtime configuration was inconsistent.

Fix:
- Updated `.env`, `.env.example`, and `.env.test` with `REDIS_HOST` and `REDIS_PORT`.

### 6.6 Orphan Docker state

Problem:
- Old compose state caused network or container conflicts during startup.

Fix:
- Cleaned with `docker compose down --remove-orphans` and restarted services.

### 6.7 Open handles and timing issues

Problem:
- Worker/queue operations and background async tasks were leaving the test environment active.

Fix:
- Added safer queue close behavior and verified with `--detectOpenHandles`.

---

## 7. Verification Results

The final validation set completed successfully:

```bash
pnpm build
pnpm test -- --runInBand
```

Result:
- Test Suites: 3 passed, 3 total
- Tests: 41 passed, 41 total

This is the final evidence that the project is stable in the current workspace environment after the runtime fixes.

---

## 8. Conventions Checklist

- All feature modules live under `src/` and are named with `*.module.ts`.
- Controllers live in `*.controller.ts` and route HTTP actions for each domain.
- Services live in `*.service.ts` and hold business logic.
- Repositories live in `*.repository.ts` and `prisma-*.repository.ts`.
- All DTOs live in a `dto/` folder and are validated with `class-validator`.
- Global request validation is enabled with `ValidationPipe`.
- API routes are versioned with a global `/v1` prefix.
- Swagger metadata is added with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiProperty`.
- Prisma schema is the source of truth and lives in `prisma/schema.prisma`.
- Database changes are shipped via migrations in `prisma/migrations/`.
- Generated Prisma client code is kept under `src/generated/prisma` and is not manually edited.
- Environment variables are validated via Zod schema and kept out of source control.
- Sensitive logs are redacted with `nestjs-pino` rules.
- Request correlation IDs are stored in AsyncLocalStorage and logged with request metadata.
- Cache invalidation is required after mutating item operations.
- Redis cache keys follow explicit resource-based patterns.
- Queue jobs use BullMQ over Redis and specify retry settings.
- Tests use `.spec.ts` naming and are split between unit, integration, and E2E.
- Integration and E2E tests use `.env.test` and real Postgres state.
- Coverage thresholds are enforced at the file level and must remain at 80% or above for the target service.
- CI checks run lint, tests, build, and Docker validation.
- Local container orchestration uses `docker-compose.yml` for app + Postgres + Redis.
- Docker images run the compiled app on port `3000` and expose a health check endpoint.
- Use environment-aware host resolution for Redis and Postgres; do not hard-code Docker-only hostnames into code meant to run locally.

---

## 9. Final recommendation

This consolidated blueprint is the single master document to use for future onboarding, scaffolding, or AI-based code generation. It includes both the original architecture and the final validated hardening changes, and it reflects the actual project as it currently exists in the workspace after verification.
