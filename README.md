# News API

A REST API for a news platform built with NestJS. It supports user registration, JWT authentication, role-based access (readers and authors), article publishing with search and pagination, read tracking, daily analytics aggregation, and an author performance dashboard.

## Technology choices

| Technology | Why |
|------------|-----|
| **[NestJS](https://nestjs.com/)** | Structured modules, dependency injection, guards, interceptors, and first-class TypeScript support for a maintainable API. |
| **[MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)** | Flexible document model fits articles, users, read logs, and daily analytics. `@nestjs/mongoose` integrates cleanly with NestJS. |
| **[Passport](https://www.passportjs.org/) + JWT** | Stateless authentication; readers and authors share the same login flow with role claims validated on each request. |
| **[class-validator](https://github.com/typestack/class-validator)** | Declarative DTO validation on incoming requests via NestJS `ValidationPipe`. |
| **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** | Secure password hashing before documents are stored. |
| **[BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)** | Background job queue for daily read aggregation without blocking HTTP requests. |
| **[Jest](https://jestjs.io/) + [Supertest](https://github.com/visionmedia/supertest)** | E2E HTTP tests with mocked Mongoose models (no live database required for `test:e2e`). |

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** 9+
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (required for the analytics job queue; local or cloud)

## Local setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd news-api
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

See [Environment variables](#environment-variables) below.

### 3. Start MongoDB and Redis

**MongoDB** (example with Docker):

```bash
docker run -d --name news-mongo -p 27017:27017 mongo:7
```

**Redis** (example with Docker):

```bash
docker run -d --name news-redis -p 6379:6379 redis:7
```

### 4. Run the API

```bash
# development (watch mode)
npm run start:dev
```

The server listens on **http://localhost:3000** by default (override with `PORT`).

### 5. Production build (optional)

```bash
npm run build
npm run start:prod
```

## Environment variables

Create a `.env` file in the project root. Variables used by the application:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/news-api` |
| `JWT_SECRET` | Yes | Secret key for signing JWT access tokens | `your-long-random-secret` |
| `JWT_EXPIRES` | No | Token expiry (passed to `@nestjs/jwt`) | `3d`, `1h` (default: `1h`) |
| `REDIS_HOST` | No | Redis host for BullMQ analytics queue | `127.0.0.1` (default) |
| `REDIS_PORT` | No | Redis port | `6379` (default) |
| `PORT` | No | HTTP port for the API | `3000` (default) |

Example `.env`:

```env
MONGO_URI=mongodb://localhost:27017/news-api
JWT_SECRET=change-me-in-production
JWT_EXPIRES=1d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

> **Note:** `MONGO_URI` is the variable name used in this project (not `DATABASE_URL`). Atlas users can paste their connection string directly into `MONGO_URI`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled production build |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E HTTP tests (mocked database) |
| `npm run test:cov` | Test coverage report |

## API overview

All successful responses are wrapped as:

```json
{ "success": true, "data": { ... } }
```

Passwords are stripped from responses automatically. Deleted articles return:

```json
{ "success": false, "message": "News article no longer available" }
```

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/users` | No | Register a user (`reader` or `author`) |
| `GET` | `/users` | No | List users |
| `GET` | `/users/:id` | No | Get user by ID |
| `PATCH` | `/users/:id` | No | Update user |
| `DELETE` | `/users/:id` | No | Delete user |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login; returns `{ access_token }` |

Use the token as: `Authorization: Bearer <access_token>`

### Articles

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/articles` | No | — | List published articles (paginated; `category`, `author`, `q`, `page`, `size`) |
| `GET` | `/articles/:id` | Optional | — | Read article; logs guest or authenticated read |
| `GET` | `/articles/me` | Yes | Author | Author’s articles (drafts + published; `includeDeleted`) |
| `POST` | `/articles` | Yes | Author | Create article |
| `PATCH` | `/articles/:id` | Yes | Author | Update own article |
| `DELETE` | `/articles/:id` | Yes | Author | Soft-delete own article |

### Author dashboard

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/author/dashboard` | Yes | Author | Paginated articles with `title`, `createdAt`, `totalViews` |

### Roles

- **reader** — Can browse and read published articles.
- **author** — Can create, update, delete articles; view `/articles/me` and `/author/dashboard`.

## Analytics

- Each successful `GET /articles/:id` creates a **ReadLog** (guest or authenticated reader).
- A **cron job** runs daily at **00:05 GMT** and enqueues a BullMQ job to aggregate reads into **DailyAnalytics** (per article, per GMT date).
- **Redis must be running** for the queue worker to process jobs.

## Project structure

```
src/
├── auth/           # JWT login, guards, strategies
├── user/           # User registration and management
├── article/        # Articles CRUD, search, read tracking
├── log/            # ReadLog persistence
├── analytics/      # Daily aggregation (BullMQ + scheduler)
├── author/         # Author dashboard
└── common/         # Filters, interceptors, shared utilities
test/
├── http.e2e-spec.ts    # E2E tests (mocked DB)
└── helpers/            # Test app factory and fixtures
```
