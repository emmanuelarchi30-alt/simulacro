# Product Management API

REST API for managing products, categories and favorites, with JWT authentication and role-based access control (RBAC). Built with [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) and PostgreSQL (compatible with [Supabase](https://supabase.com/)).

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Available scripts](#available-scripts)
- [Interactive documentation (Swagger)](#interactive-documentation-swagger)
- [Authentication and roles](#authentication-and-roles)
- [Main modules and endpoints](#main-modules-and-endpoints)
- [Tests](#tests)
- [Migrations](#migrations)

## Tech stack

| Category | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL (TypeORM) |
| Authentication | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Validation | `class-validator` / `class-transformer` |
| API documentation | Swagger (`@nestjs/swagger`) |
| Testing | Jest + Supertest |

## Project structure

```
src/
├── common/               # Cross-cutting guards and decorators (JWT, roles)
├── modules/
│   ├── auth/              # Register, login, logout, JWT strategy
│   ├── users/              # Authenticated user profile, password change
│   ├── categories/         # Categories CRUD (creation restricted to admin)
│   ├── products/           # Products CRUD, search, filters, pagination
│   └── favorites/          # Favorite products per user
├── migrations/            # TypeORM migrations (single source of truth for the schema)
├── data-source.ts         # Connection configuration used by the TypeORM CLI
├── app.module.ts
└── main.ts                # Bootstrap: CORS, global ValidationPipe, Swagger
```

Every module follows the same internal convention: `*.controller.ts` (routes), `*.service.ts` (business logic), `dto/` (input validation) and `entities/` (data model/TypeORM).

## Prerequisites

- Node.js 20 or higher
- An accessible PostgreSQL database (a [Supabase](https://supabase.com/) project is recommended — free, no need to install Postgres locally)

## Installation and setup

```bash
git clone <repository-url>
cd gestion-productos-api
npm install
```

Create your environment file from the example:

```bash
cp .env.example .env
```

Fill in `.env` with your own values:

| Variable | Description |
|---|---|
| `PORT` | Port the API runs on (defaults to `3000`). |
| `DATABASE_URL` | Connection string for your PostgreSQL database. On Supabase: **Project Settings → Database → Connection string** (use the *Session pooler*, port `5432`). |
| `JWT_SECRET` | Secret key used to sign JWT tokens. Use a long random value, never the one from `.env.example`. |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1d`, `12h`). |

With the database configured, apply the migrations to create the schema:

```bash
npm run migration:run
```

This creates all tables and **automatically seeds an admin account** (see [Authentication and roles](#authentication-and-roles)) — no need to create it manually.

Start the server in development mode:

```bash
npm run start:dev
```

The API is now available at `http://localhost:3000`.

## Available scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Starts the server with hot reload. |
| `npm run start:prod` | Runs the production build (requires `npm run build` first). |
| `npm run build` | Compiles the project to `dist/`. |
| `npm run lint` | Runs ESLint with autofix. |
| `npm run test` | Runs unit tests. |
| `npm run test:e2e` | Runs end-to-end tests. |
| `npm run migration:run` | Applies pending migrations. |
| `npm run migration:revert` | Reverts the last applied migration. |
| `npm run migration:generate` | Generates a migration from entity changes. |

## Interactive documentation (Swagger)

With the server running, the full API documentation is available at:

```
http://localhost:3000/api/docs
```

There you can view every endpoint, its expected request/response body, and try it directly by authenticating with the **Authorize** button (paste the `accessToken` returned by `/auth/login`).

## Authentication and roles

The API uses JWT with two roles: `admin` and `user`.

1. The user registers (`POST /auth/register`) or signs in (`POST /auth/login`).
2. The API responds with an `accessToken` that includes the user's `id`, `email` and `role`.
3. That token must be sent with every request to a protected route:

```
Authorization: Bearer <accessToken>
```

- The token expires according to `JWT_EXPIRES_IN`. If it is expired or invalid, the API responds `401 Unauthorized`.
- Since the JWT is *stateless*, the server does not actively invalidate tokens: `POST /auth/logout` only acknowledges the action; whoever actually ends the session is the client, by discarding the stored token.

**Admin account seeded by the migration** (for development/testing only — change the password if you expose the API outside a controlled environment):

- Email: `admin@examen.com`
- Password: `Admin123!`

Any other account registered through `/auth/register` gets the default `user` role.

### Error format

All error responses follow this shape:

```json
{ "statusCode": 400, "message": "Error description", "error": "Bad Request" }
```

For validation errors, `message` is an array with one string per invalid field.

| Code | Meaning |
|---|---|
| `400` | Invalid data (body fails validation rules). |
| `401` | Missing, invalid or expired token. |
| `403` | The user is authenticated but lacks the required role. |
| `404` | The requested resource does not exist. |
| `409` | Conflict (e.g. duplicate email or name). |

## Main modules and endpoints

| Method | Route | Auth | Role |
|---|---|---|---|
| `POST` | `/auth/register` | No | — |
| `POST` | `/auth/login` | No | — |
| `POST` | `/auth/logout` | Yes | any |
| `GET` | `/users/me` | Yes | any |
| `PATCH` | `/users/me/password` | Yes | any |
| `GET` | `/categories` | No | — |
| `GET` | `/categories/:id` | No | — |
| `POST` | `/categories` | Yes | `admin` |
| `PATCH` | `/categories/:id` | Yes | `admin` |
| `DELETE` | `/categories/:id` | Yes | `admin` |
| `GET` | `/products` | No | — (supports `search`, `categoryId`, `page`, `limit`) |
| `GET` | `/products/:id` | No | — |
| `POST` | `/products` | Yes | any |
| `PATCH` | `/products/:id` | Yes | any |
| `DELETE` | `/products/:id` | Yes | any |
| `GET` | `/favorites` | Yes | any |
| `POST` | `/favorites/:productId` | Yes | any |
| `DELETE` | `/favorites/:productId` | Yes | any |

Full details for every request/response (schemas, examples, error codes) in [Swagger](#interactive-documentation-swagger).

## Tests

```bash
npm run test        # unit tests
npm run test:e2e    # end-to-end
npm run test:cov    # with coverage report
```

## Migrations

The database schema is managed exclusively through TypeORM migrations (`synchronize: false`). If you modify an entity, generate the corresponding migration before applying the change:

```bash
npm run migration:generate src/migrations/NameOfTheChange
npm run migration:run
```

Do not modify a migration that has already been applied to a shared database; create a new one instead.
