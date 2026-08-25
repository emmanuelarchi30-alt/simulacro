# Gestión de Productos — Frontend (React + TypeScript)

Frontend de la aplicación de gestión de productos para la **prueba de desempeño**.
Consume una API REST real (NestJS + PostgreSQL) incluida en la carpeta `backend/`,
con autenticación JWT, roles (`admin` / `user`), categorías, productos y favoritos.

```
prueba-desempeno/
├── backend/    → API NestJS (repositorio oficial + ajustes documentados abajo)
└── frontend/   → App React + TypeScript (este proyecto)
```

---

## 1. Cómo correr el proyecto localmente

### Backend (API)

```bash
cd backend
npm install
npm run migration:run   # crea el esquema y siembra el usuario admin
npm run start:dev       # http://localhost:4000
```

Crea `backend/.env` a partir de `backend/.env.example`:

```env
PORT=4000
DATABASE_URL=postgresql://usuario:password@host:5432/postgres
DATABASE_SSL=true        # ← solo si tu Postgres exige SSL (p. ej. Supabase)
JWT_SECRET=un-string-largo-y-aleatorio
JWT_EXPIRES_IN=1d
```

> **Ajuste al repositorio original:** el proyecto venía con SSL de Postgres
> hardcodeado (pensado para Supabase). Se hizo condicional con `DATABASE_SSL`
> en `src/data-source.ts` y `src/app.module.ts` para permitir también una base
> local sin SSL. Con Supabase basta poner `DATABASE_SSL=true`.

Este entorno de prueba usa un **PostgreSQL 16 local** en el puerto `5544`
(carpeta `pgdata/`, no requiere Docker ni Supabase). Si prefieres Supabase,
copia el connection string de *Session pooler* en `DATABASE_URL`.

**Swagger:** <http://localhost:4000/api/docs>

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Variables (archivo `frontend/.env`, ya incluido):

```env
VITE_API_URL=http://localhost:4000
```

Otros comandos útiles:

```bash
npm run test          # pruebas (Vitest + React Testing Library)
npm run lint          # oxlint
npm run typecheck     # tsc --build en modo estricto
npm run build         # build de producción
```

### Credenciales de prueba

| Rol   | Email               | Contraseña  |
| ----- | ------------------- | ----------- |
| admin | `emmanuel@gmail.com`| (la definida al registrarse) |
| user  | `usuario@examen.com`| `User123!`  |
| user  | `admin@examen.com`  | `Admin123!` |

> Nota: la cuenta con permisos de administrador (crear/editar/eliminar
> productos y categorías, ver todas las órdenes) es `emmanuel@gmail.com`.
> La cuenta `admin@examen.com` fue degradada a usuario normal.

La base viene sembrada además con categorías (Electrónica, Hogar, Deportes,
Libros) y productos de ejemplo.

---

## 2. ¿Dónde se guarda el token y por qué? (`localStorage` vs `sessionStorage`)

**Decisión: `localStorage`**, bajo la clave `gp.accessToken`
(ver `src/lib/tokenStorage.ts`).

**Justificación:**

- La API entrega un JWT de acceso con vigencia de 1 día y **no existe flujo de
  refresh token**; no hay nada que "rotar" entre pestañas ni al cerrar sesión.
- Con `localStorage` la sesión sobrevive recargas y pestañas nuevas durante toda
  la vigencia del token, lo que da una experiencia coherente con el criterio
  "al recargar la página, la sesión persiste mientras el token siga vigente".
- El riesgo clásico de `localStorage` es el robo por XSS. Se mitiga a nivel de
  app: nunca se interpolan datos de la API como HTML, React escapa todo el
  contenido por defecto y el token **no se expone** en URLs ni en logs.
- `sessionStorage` habría sido preferible si el requisito fuera que la sesión
  muera al cerrar la pestaña (p. ej. equipos compartidos); ese no es el caso de
  un catálogo de productos.

El token **nunca** viaja en cookies y siempre se envía explícitamente como
`Authorization: Bearer <token>` desde el interceptor.

---

## 3. Librería HTTP y resolución del interceptor

**Elección: Axios** (frente a `fetch`).

- **Interceptores nativos**: axios permite colgar lógica de request/response en
  un solo lugar; con `fetch` habría que escribir un wrapper manual con
  `try/finally` para reconstruir headers en cada llamada o envolver cada
  petición en funciones de orden superior.
- **Lanza excepción automáticamente** en códigos 4xx/5xx, lo que encaja con el
  manejo estructurado `try/catch/finally` exigido en toda la app.
- Serialización/deserialización JSON y query params (`params:`) integrados.
- Tipado cómodo: `http.request<T>()` devuelve directamente `T`.

Implementación en `src/lib/http.ts`:

```ts
// Request: inyecta el token en TODAS las peticiones si hay sesión
http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: reacciona a 401 con sesión activa → logout automático
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (status === 401 && !isAuthEndpoint && hadToken) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT)); // AuthProvider cierra sesión
    }
    return Promise.reject(error);
  },
);
```

Detalles importantes del interceptor de response:

- **No dispara logout** cuando el 401 viene de `/auth/login` o `/auth/register`
  (credenciales incorrectas de un invitado ≠ sesión vencida).
- Comunica el cierre vía un evento global (`gp:unauthorized`) que escucha el
  `AuthProvider`, evitando imports circulares entre la capa HTTP y React.

Encima de axios vive una capa genérica tipada:

```ts
export async function httpRequest<T>(config: AxiosRequestConfig): Promise<T>
```

y los servicios de dominio (`src/services/index.service.ts`) la especializan:
`authService.login()`, `productsService.list()`, `favoritesService.add()`, etc.

---

## Arquitectura del frontend

Separación por capas con ES Modules (barrels en `types/` y `hooks/`):

```
frontend/src/
├── types/            # Tipos del dominio (Product, Category, User, AuthResponse…)
│                     # y tipos de API (PaginatedResponse<T>, ApiErrorResponse)
├── lib/              # Infraestructura pura, sin React
│   ├── http.ts       # Instancia axios + interceptores + httpRequest<T>
│   ├── errors.ts     # Clase AppError + toAppError() + mapeo a errores de campo
│   └── tokenStorage.ts
├── services/         # Servicios por recurso sobre httpRequest<T>
├── context/          # Estado global: AuthContext, FavoritesContext, ToastContext
├── hooks/            # useFetch<T>, useForm<T>, useDebouncedValue, useAuth…
├── components/
│   ├── common/       # RouteGuards, ErrorBoundary, ProductCard, Pagination…
│   ├── forms/        # LoginForm, RegisterForm, CategoryForm, ProductForm
│   └── layout/       # Navbar + Layout
├── pages/            # Una página por ruta (composición de lo anterior)
├── utils/            # formatPrice y helpers puros
└── styles/global.css # Design system propio (tokens CSS)
```

Puntos clave por módulo de la prueba:

### Módulo 1 — Tipado del dominio
- `Product`, `Category`, `User`, `UserRole`, `AuthResponse`,
  `PaginatedResponse<T>`, payloads de create/update (`Partial<>`).
- **Genéricos reales**: `httpRequest<T>`, `useFetch<T>(fetcher, deps)` (dispara
  en `useEffect`, ignora respuestas canceladas y expone `refetch`),
  `useForm<T extends Record<string, unknown>>`.
- **Clase justificada**: `AppError` clasifica `network | validation |
  unauthorized | forbidden | not_found | conflict | server | unknown`; con
  `instanceof` + `toAppError()` toda llamada termina en `try/catch/finally` con
  feedback visible. Si el backend está caído, la UI muestra una alerta de red
  con botón **Reintentar** (nunca pantalla en blanco).
- Cero `any`: `strict: true` en tsconfig.

### Módulo 2 — Autenticación, sesión y RBAC
- Formularios controlados de login/registro; errores 400 (por campo), 401 y
  409 del servidor se muestran dentro del formulario.
- `AuthProvider` valida el token persistido contra `GET /users/me` al arrancar.
- Rutas protegidas en dos niveles (`RouteGuards.tsx`):
  - `RequireAuth`: favoritos, crear/editar/eliminar producto.
  - `RequireRole roles={['admin']}`: crear categoría. Un usuario `user` que
    entra por URL directa es **redirigido al inicio con aviso visible**
    (verificado con prueba de integración).
- Logout limpia storage **y** llama `POST /auth/logout` (en `finally`).

### Módulos 3–5 — Categorías, Productos, Favoritos
- Categorías públicas; creación solo admin; detalle con sus productos
  paginados y botón "Agregar producto" para autenticados.
- Productos: búsqueda con debounce + filtro por categoría + paginación
  sincronizados con la URL (`useSearchParams`); formulario **único**
  (`ProductForm`) usado en `/products/new`, `/categories/:id/products/new`
  (select precargado y deshabilitado) y edición; imágenes como URLs con vista
  previa y placeholder tolerante a URLs rotas (`SafeImage`).
- Favoritos: toggle optimista en contexto global; **409** ("ya estaba") y
  **404** ("ya no estaba") se reconcilian sin romper la UI; la lista "Mis
  favoritos" se actualiza sin recargar.

### Módulo 6 — Errores en la interfaz
- Toda petición fallida muestra alerta/toast según su tipo (incluye banner
  específico de red caída).
- `ErrorBoundary` (class component, único caso donde React las exige aún)
  envuelve toda la app. Demo en vivo: ruta **`/demo-crash`** lanza un error de
  renderizado intencional y el boundary captura con fallback + recargar.

### Módulo 7 — Pruebas
```bash
cd frontend && npm run test
```
- Unitarias: `formatPrice` y clasificación de errores (`toAppError`).
- Integración (RTL): login completo contra servicio simulado (éxito navega +
  guarda token; 401 muestra el error visible), y RBAC: usuario `user` es
  redirigido desde `/categories/new`.
- Solo se mockea la capa de servicios; providers, guards y formularios son
  reales.

---

## Notas del entorno usado en esta máquina

- **Ubicación actual del proyecto:** `/home/ruta_ts/Escritorio/prueba-desempeno/`
- Puertos elegidos por conflictos con procesos existentes: **API en 4000**
  (el 3000 estaba ocupado) y Postgres propio en **5544**
  (`pgdata/` + `pgsock/`, iniciado con
  `/usr/lib/postgresql/16/bin/pg_ctl -D pgdata -o "-p 5544 -k $PWD/pgsock"`).
- La API está conectada a **Supabase** (`DATABASE_SSL=true`); el Postgres local
  de `pgdata/` queda como respaldo.
- Para volver a levantar la BD local tras reiniciar el equipo:
  ```bash
  /usr/lib/postgresql/16/bin/pg_ctl -D pgdata \
    -l ../pg.log -o "-p 5544 -k $(pwd)/../pgsock" start
  ```

### Modo oscuro y estilo *liquid glass*

- Toggle 🌙/☀️ en la navbar; la preferencia se guarda en `localStorage`
  (`gp.theme`) y, si no existe, se respeta `prefers-color-scheme` del sistema.
- Un script inline en `index.html` aplica `data-theme` antes de que cargue
  React para evitar destello de tema incorrecto (FOUC).
- El estilo imita el *liquid glass* de iOS: relleno con brillo especular,
  **canto refractado** (borde pintado en dos capas `padding-box`/`border-box`),
  `backdrop-filter` con blur alto y saturación, aurora animada de tres blobs
  detrás del vidrio y barrido de luz al pasar el mouse por las tarjetas.
  (Se desactiva la animación con `prefers-reduced-motion`.)

### Foto de perfil

- El backend se extendió con una migración (`AddUserAvatar`: columna
  `users.avatar`) y el endpoint **`PATCH /users/me`**
  (`UpdateProfileDto`: `name?`, `avatar?: string | null`; `null` quita la foto).
  Misma filosofía del examen para imágenes: **URL**, no subida de archivos.
- En el frontend: página `/profile` con vista previa en vivo del avatar,
  edición de nombre y URL de foto; el avatar (imagen o iniciales) aparece en la
  navbar como acceso directo al perfil. El usuario actualizado se propaga por
  `AuthContext.updateProfile()` a toda la app.

### Compras (extensión propia, acordada con el usuario)

- Migración `CreateOrdersAndFixCatalog`: tabla **`orders`** (usuario, producto,
  cantidad, precio unitario y total congelados al comprar, estado) y catálogo
  ampliado a **16 productos** (4 por categoría). Las imágenes usan el CDN de
  **Unsplash** con enlaces verificados uno a uno (HTTP 200) y que sí coinciden
  con cada producto; el proveedor anterior (LoremFlickr) dejó de responder,
  dejando la galería vacía.
- Endpoints: **`POST /orders`** (compra directa, transaccional: valida stock,
  lo descuenta y registra la orden), **`GET /orders/me`** (historial propio)
  y **`GET /orders`** (todas, solo admin).
- Frontend: selector de cantidad + botón **“Comprar ahora”** en el detalle
  (muestra el total en vivo y refresca el stock tras comprar) y sección
  **“Mis compras”** (`/my-orders`) en la navbar.

### RBAC reforzado

- Crear/editar/eliminar **productos** ahora exige rol **admin**
  (`@Auth(UserRole.ADMIN)` en la API y `RequireRole` en las rutas),
  igual que las categorías. Un usuario autenticado sin permisos recibe 403;
  los botones de edición ni siquiera se le muestran.

### Botones *liquid glass*

- Los tres estilos de botón usan ahora el mismo tratamiento de vidrio que el
  resto de la interfaz: relleno especular + canto refractado
  (`padding-box`/`border-box`), blur y saturación del fondo; los primarios y
  de peligro llevan cristal tintado con su color.
