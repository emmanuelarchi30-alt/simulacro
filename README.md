# Product Management — Frontend (React + TypeScript)

Frontend of the product management application for the **performance exam**.
It consumes a real REST API (NestJS + PostgreSQL) included in the `backend/` folder,
with JWT authentication, roles (`admin` / `user`), categories, products and favorites.

```
prueba-desempeno/
├── backend/    → NestJS API (official repo + adjustments documented below)
└── frontend/   → React + TypeScript app (this project)
```

---

## 1. How to run the project locally

### Backend (API)

```bash
cd backend
npm install
npm run migration:run   # creates the schema and seeds the admin user
npm run start:dev       # http://localhost:4000
```

Create `backend/.env` from `backend/.env.example`:

```env
PORT=4000
DATABASE_URL=postgresql://usuario:password@host:5432/postgres
DATABASE_SSL=true        # ← only if your Postgres requires SSL (e.g. Supabase)
JWT_SECRET=a-long-random-string
JWT_EXPIRES_IN=1d
```

> **Adjustment to the original repository:** the project shipped with Postgres SSL
> hardcoded (meant for Supabase). It was made conditional via `DATABASE_SSL`
> in `src/data-source.ts` and `src/app.module.ts` to also allow a local
> database without SSL. With Supabase just set `DATABASE_SSL=true`.

This test environment uses a **local PostgreSQL 16** on port `5544`
(`pgdata/` folder, no Docker or Supabase required). If you prefer Supabase,
copy the *Session pooler* connection string into `DATABASE_URL`.

**Swagger:** <http://localhost:4000/api/docs>

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Variables (`frontend/.env`, already included):

```env
VITE_API_URL=http://localhost:4000
```

Other useful commands:

```bash
npm run test          # tests (Vitest + React Testing Library)
npm run lint          # oxlint
npm run typecheck     # tsc --build in strict mode
npm run build         # production build
```

### Test credentials

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| admin | `emmanuel@gmail.com`| (the one defined at sign-up) |
| user  | `usuario@examen.com`| `User123!`  |
| user  | `admin@examen.com`  | `Admin123!` |

> Note: the account with administrator permissions (create/edit/delete
> products and categories, view all orders) is `emmanuel@gmail.com`.
> The `admin@examen.com` account was downgraded to a regular user.

The database is also seeded with categories (Electronics, Home, Sports,
Books) and sample products.

---

## 2. Where is the token stored and why? (`localStorage` vs `sessionStorage`)

**Decision: `localStorage`**, under the key `gp.accessToken`
(see `src/lib/tokenStorage.ts`).

**Rationale:**

- The API issues an access JWT valid for 1 day and **there is no refresh token flow**;
  there is nothing to "rotate" across tabs or on logout.
- With `localStorage` the session survives reloads and new tabs for the whole
  token lifetime, which gives an experience consistent with the requirement
  "after reloading the page, the session persists while the token is still valid".
- The classic `localStorage` risk is theft via XSS. It is mitigated at the app level:
  API data is never interpolated as HTML, React escapes all content by default,
  and the token **is never exposed** in URLs or logs.
- `sessionStorage` would have been preferable if the requirement were for the
  session to die when closing the tab (e.g. shared computers); that is not the case
  for a product catalog.

The token **never** travels in cookies and is always sent explicitly as
`Authorization: Bearer <token>` from the interceptor.

---

## 3. HTTP library and interceptor solution

**Choice: Axios** (over `fetch`).

- **Native interceptors**: axios allows attaching request/response logic in one place;
  with `fetch` you would have to write a manual wrapper with `try/finally`
  to rebuild headers on every call or wrap each request in higher-order functions.
- **Automatically throws** on 4xx/5xx codes, which fits the structured
  `try/catch/finally` handling required throughout the app.
- JSON serialization/deserialization and query params (`params:`) built in.
- Comfortable typing: `http.request<T>()` returns `T` directly.

Implementation in `src/lib/http.ts`:

```ts
// Request: injects the token into ALL requests if there is a session
http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: reacts to 401 with an active session → automatic logout
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (status === 401 && !isAuthEndpoint && hadToken) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT)); // AuthProvider signs out
    }
    return Promise.reject(error);
  },
);
```

Important details about the response interceptor:

- **Does not trigger logout** when the 401 comes from `/auth/login` or `/auth/register`
  (a guest's wrong credentials ≠ expired session).
- Communicates the sign-out via a global event (`gp:unauthorized`) listened to by
  the `AuthProvider`, avoiding circular imports between the HTTP layer and React.

On top of axios lives a typed generic layer:

```ts
export async function httpRequest<T>(config: AxiosRequestConfig): Promise<T>
```

and the domain services (`src/services/index.service.ts`) specialize it:
`authService.login()`, `productsService.list()`, `favoritesService.add()`, etc.

---

## Frontend architecture

Layered separation with ES Modules (barrels in `types/` and `hooks/`):

```
frontend/src/
├── types/            # Domain types (Product, Category, User, AuthResponse…)
│                     # and API types (PaginatedResponse<T>, ApiErrorResponse)
├── lib/              # Pure infrastructure, no React
│   ├── http.ts       # Axios instance + interceptors + httpRequest<T>
│   ├── errors.ts     # AppError class + toAppError() + field error mapping
│   └── tokenStorage.ts
├── services/         # Per-resource services on top of httpRequest<T>
├── context/          # Global state: AuthContext, FavoritesContext, ToastContext
├── hooks/            # useFetch<T>, useForm<T>, useDebouncedValue, useAuth…
├── components/
│   ├── common/       # RouteGuards, ErrorBoundary, ProductCard, Pagination…
│   ├── forms/        # LoginForm, RegisterForm, CategoryForm, ProductForm
│   └── layout/       # Navbar + Layout
├── pages/            # One page per route (composition of the above)
├── utils/            # formatPrice and pure helpers
└── styles/global.css # Own design system (CSS tokens)
```

Key points per module of the exam:

### Module 1 — Domain typing
- `Product`, `Category`, `User`, `UserRole`, `AuthResponse`,
  `PaginatedResponse<T>`, create/update payloads (`Partial<>`).
- **Real generics**: `httpRequest<T>`, `useFetch<T>(fetcher, deps)` (fires in
  `useEffect`, ignores cancelled responses and exposes `refetch`),
  `useForm<T extends Record<string, unknown>>`.
- **Justified class**: `AppError` classifies `network | validation |
  unauthorized | forbidden | not_found | conflict | server | unknown`; with
  `instanceof` + `toAppError()` every call ends in `try/catch/finally` with
  visible feedback. If the backend is down, the UI shows a network alert
  with a **Retry** button (never a blank screen).
- Zero `any`: `strict: true` in tsconfig.

### Module 2 — Authentication, session and RBAC
- Controlled login/register forms; server-side 400 (per field), 401 and
  409 errors are displayed inside the form.
- Registration **does not sign you in**: after creating the account it only shows the
  confirmation ("User created") and redirects to `/login`; entering the app
  happens only when signing in.
- `AuthProvider` validates the persisted token against `GET /users/me` at startup.
- Protected routes at two levels (`RouteGuards.tsx`):
  - `RequireAuth`: favorites, create/edit/delete product.
  - `RequireRole roles={['admin']}`: create category. A `user` who
    enters via direct URL is **redirected home with a visible notice**
    (verified with an integration test).
- Logout clears storage **and** calls `POST /auth/logout` (in `finally`).

### Modules 3–5 — Categories, Products, Favorites
- Public categories; creation restricted to admin; detail page with its paginated
  products and an "Add product" button for authenticated users.
- Products: debounced search + category filter + pagination
  synchronized with the URL (`useSearchParams`); a **single**
  form (`ProductForm`) used by `/products/new`, `/categories/:id/products/new`
  (preloaded and disabled select) and editing; images as URLs with preview
  and a placeholder tolerant to broken URLs (`SafeImage`).
- Favorites: optimistic toggle in global context; **409** ("already favorited") and
  **404** ("no longer there") are reconciled without breaking the UI; the "My
  favorites" list updates without reloading.

### Module 6 — UI error handling
- Every failed request shows an alert/toast according to its type (includes a
  specific banner for network failures).
- `ErrorBoundary` (class component, the only case where React still requires them)
  wraps the whole app. Live demo: the **`/demo-crash`** route throws an intentional
  render error and the boundary catches it with a fallback + reload.

### Module 7 — Tests
```bash
cd frontend && npm run test
```
- Unit: `formatPrice` and error classification (`toAppError`).
- Integration (RTL): full login against a mocked service (success navigates +
  stores token; 401 shows the visible error), and RBAC: a `user` is
  redirected away from `/categories/new`.
- Only the service layer is mocked; providers, guards and forms are
  real.

---

## Notes about the environment used on this machine

- **Current project location:** `/home/ruta_ts/Escritorio/prueba-desempeno/`
- Ports chosen due to conflicts with existing processes: **API on 4000**
  (3000 was taken) and its own Postgres on **5544**
  (`pgdata/` + `pgsock/`, started with
  `/usr/lib/postgresql/16/bin/pg_ctl -D pgdata -o "-p 5544 -k $PWD/pgsock"`).
- The API is connected to **Supabase** (`DATABASE_SSL=true`); the local Postgres
  in `pgdata/` remains as backup.
- To bring the local DB back up after rebooting the machine:
  ```bash
  /usr/lib/postgresql/16/bin/pg_ctl -D pgdata \
    -l ../pg.log -o "-p 5544 -k $(pwd)/../pgsock" start
  ```

### Dark mode and *liquid glass* styling

- 🌙/☀️ toggle in the navbar; the preference is saved in `localStorage`
  (`gp.theme`) and, if absent, the system's `prefers-color-scheme` is respected.
- An inline script in `index.html` applies `data-theme` before React loads
  to avoid a wrong-theme flash (FOUC).
- The style mimics iOS *liquid glass*: specular highlight fill,
  **refracted rim** (border painted in two `padding-box`/`border-box` layers),
  `backdrop-filter` with heavy blur and saturation, an animated aurora of three blobs
  behind the glass and a light sweep on card hover.
  (The animation is disabled with `prefers-reduced-motion`.)

### Profile photo

- The backend was extended with a migration (`AddUserAvatar`: column
  `users.avatar`) and the **`PATCH /users/me`** endpoint
  (`UpdateProfileDto`: `name?`, `avatar?: string | null`; `null` removes the photo).
  Same philosophy as the exam for images: **URL**, not file upload.
- On the frontend: a `/profile` page with live avatar preview,
  name and photo URL editing; the avatar (image or initials) appears in the
  navbar as a shortcut to the profile. The updated user propagates through
  `AuthContext.updateProfile()` to the whole app.

### Purchases (own extension, agreed with the user)

- Migration `CreateOrdersAndFixCatalog`: an **`orders`** table (user, product,
  quantity, unit price and total frozen at purchase time, status) and a catalog
  expanded to **16 products** (4 per category). Images use the **Unsplash**
  CDN with links verified one by one (HTTP 200) that actually match each
  product; the previous provider (LoremFlickr) stopped responding, leaving
  the gallery empty.
- Endpoints: **`POST /orders`** (direct purchase, transactional: validates stock,
  decrements it and records the order), **`GET /orders/me`** (own history)
  and **`GET /orders`** (all of them, admin only).
- Frontend: quantity selector + **"Buy now"** button on the detail page
  (shows the total live and refreshes stock after purchasing) and a
  **"My purchases"** section (`/my-orders`) in the navbar.

### Hardened RBAC

- Creating/editing/deleting **products** now requires the **admin** role
  (`@Auth(UserRole.ADMIN)` on the API and `RequireRole` on the routes),
  same as categories. An authenticated user without permissions gets 403;
  the edit buttons are not even rendered for them.

### *Liquid glass* buttons

- All three button styles now use the same glass treatment as the
  rest of the interface: specular fill + refracted rim
  (`padding-box`/`border-box`), background blur and saturation; primary and
  danger buttons carry glass tinted with their color.
