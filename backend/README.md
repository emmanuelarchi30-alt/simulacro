# Gestión de Productos API

API REST para la administración de productos, categorías y favoritos, con autenticación por JWT y control de acceso basado en roles (RBAC). Construida con [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) y PostgreSQL (compatible con [Supabase](https://supabase.com/)).

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y configuración](#instalación-y-configuración)
- [Scripts disponibles](#scripts-disponibles)
- [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
- [Autenticación y roles](#autenticación-y-roles)
- [Módulos y endpoints principales](#módulos-y-endpoints-principales)
- [Pruebas](#pruebas)
- [Migraciones](#migraciones)

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | NestJS 11 |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (TypeORM) |
| Autenticación | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Validación | `class-validator` / `class-transformer` |
| Documentación de API | Swagger (`@nestjs/swagger`) |
| Testing | Jest + Supertest |

## Estructura del proyecto

```
src/
├── common/               # Guards y decoradores transversales (JWT, roles)
├── modules/
│   ├── auth/              # Registro, login, logout, estrategia JWT
│   ├── users/              # Perfil del usuario autenticado, cambio de contraseña
│   ├── categories/         # CRUD de categorías (creación restringida a admin)
│   ├── products/           # CRUD de productos, búsqueda, filtros, paginación
│   └── favorites/          # Productos favoritos por usuario
├── migrations/            # Migraciones de TypeORM (fuente de verdad del esquema)
├── data-source.ts         # Configuración de conexión usada por la CLI de TypeORM
├── app.module.ts
└── main.ts                # Bootstrap: CORS, ValidationPipe global, Swagger
```

Cada módulo sigue la misma convención interna: `*.controller.ts` (rutas), `*.service.ts` (lógica de negocio), `dto/` (validación de entrada) y `entities/` (modelo de datos/TypeORM).

## Requisitos previos

- Node.js 20 o superior
- Una base de datos PostgreSQL accesible (se recomienda un proyecto de [Supabase](https://supabase.com/), gratuito y sin necesidad de instalar Postgres localmente)

## Instalación y configuración

```bash
git clone <url-del-repositorio>
cd gestion-productos-api
npm install
```

Crea tu archivo de variables de entorno a partir del ejemplo:

```bash
cp .env.example .env
```

Completa `.env` con tus propios valores:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto en el que corre la API (por defecto `3000`). |
| `DATABASE_URL` | Cadena de conexión a tu base de datos PostgreSQL. En Supabase: **Project Settings → Database → Connection string** (usa el *Session pooler*, puerto `5432`). |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT. Usa un valor largo y aleatorio, nunca el del `.env.example`. |
| `JWT_EXPIRES_IN` | Vigencia del token (ej. `1d`, `12h`). |

Con la base de datos ya configurada, aplica las migraciones para crear el esquema:

```bash
npm run migration:run
```

Esto crea todas las tablas y **siembra automáticamente una cuenta administradora** (ver [Autenticación y roles](#autenticación-y-roles)) — no hace falta crearla a mano.

Levanta el servidor en modo desarrollo:

```bash
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Levanta el servidor con recarga automática. |
| `npm run start:prod` | Corre la build de producción (requiere `npm run build` antes). |
| `npm run build` | Compila el proyecto a `dist/`. |
| `npm run lint` | Corre ESLint con autofix. |
| `npm run test` | Corre los tests unitarios. |
| `npm run test:e2e` | Corre los tests end-to-end. |
| `npm run migration:run` | Aplica las migraciones pendientes. |
| `npm run migration:revert` | Revierte la última migración aplicada. |
| `npm run migration:generate` | Genera una migración a partir de cambios en las entidades. |

## Documentación interactiva (Swagger)

Con el servidor corriendo, la documentación completa de la API está disponible en:

```
http://localhost:3000/api/docs
```

Ahí puedes ver cada endpoint, su cuerpo de petición/respuesta esperado, y probarlo directamente autenticándote con el botón **Authorize** (pega el `accessToken` que devuelve `/auth/login`).

## Autenticación y roles

La API usa JWT con dos roles: `admin` y `user`.

1. El usuario se registra (`POST /auth/register`) o inicia sesión (`POST /auth/login`).
2. La API responde con un `accessToken` que incluye el `id`, `email` y `role` del usuario.
3. Ese token debe enviarse en cada petición a una ruta protegida:

```
Authorization: Bearer <accessToken>
```

- El token expira según `JWT_EXPIRES_IN`. Si expira o es inválido, la API responde `401 Unauthorized`.
- Como el JWT es *stateless*, el servidor no invalida tokens activamente: `POST /auth/logout` solo confirma la acción; quien cierra la sesión realmente es el cliente, descartando el token guardado.

**Cuenta admin sembrada por la migración** (solo para desarrollo/pruebas — cambia la contraseña si vas a exponer la API fuera de un entorno controlado):

- Email: `admin@examen.com`
- Password: `Admin123!`

Cualquier otra cuenta registrada desde `/auth/register` recibe el rol `user` por defecto.

### Formato de errores

Todas las respuestas de error siguen esta forma:

```json
{ "statusCode": 400, "message": "Descripción del error", "error": "Bad Request" }
```

En errores de validación, `message` es un arreglo con un string por cada campo inválido.

| Código | Significado |
|---|---|
| `400` | Datos inválidos (body no cumple las reglas de validación). |
| `401` | Falta el token, es inválido o expiró. |
| `403` | El usuario está autenticado pero no tiene el rol requerido. |
| `404` | El recurso solicitado no existe. |
| `409` | Conflicto (ej. correo o nombre duplicado). |

## Módulos y endpoints principales

| Método | Ruta | Auth | Rol |
|---|---|---|---|
| `POST` | `/auth/register` | No | — |
| `POST` | `/auth/login` | No | — |
| `POST` | `/auth/logout` | Sí | cualquiera |
| `GET` | `/users/me` | Sí | cualquiera |
| `PATCH` | `/users/me/password` | Sí | cualquiera |
| `GET` | `/categories` | No | — |
| `GET` | `/categories/:id` | No | — |
| `POST` | `/categories` | Sí | `admin` |
| `PATCH` | `/categories/:id` | Sí | `admin` |
| `DELETE` | `/categories/:id` | Sí | `admin` |
| `GET` | `/products` | No | — (soporta `search`, `categoryId`, `page`, `limit`) |
| `GET` | `/products/:id` | No | — |
| `POST` | `/products` | Sí | cualquiera |
| `PATCH` | `/products/:id` | Sí | cualquiera |
| `DELETE` | `/products/:id` | Sí | cualquiera |
| `GET` | `/favorites` | Sí | cualquiera |
| `POST` | `/favorites/:productId` | Sí | cualquiera |
| `DELETE` | `/favorites/:productId` | Sí | cualquiera |

Detalle completo de cada request/response (schemas, ejemplos, códigos de error) en [Swagger](#documentación-interactiva-swagger).

## Pruebas

```bash
npm run test        # unitarias
npm run test:e2e    # end-to-end
npm run test:cov    # con reporte de cobertura
```

## Migraciones

El esquema de base de datos se gestiona exclusivamente por migraciones de TypeORM (`synchronize: false`). Si modificas una entidad, genera la migración correspondiente antes de aplicar el cambio:

```bash
npm run migration:generate src/migrations/NombreDelCambio
npm run migration:run
```

No modifiques una migración ya aplicada en una base compartida; crea una nueva.
