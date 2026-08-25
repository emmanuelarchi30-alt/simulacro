import type {
  AuthResponse,
  CreateOrderPayload,
  Order,
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  LoginPayload,
  PaginatedResponse,
  Product,
  ProductQueryParams,
  RegisterPayload,
  UpdateCategoryPayload,
  UpdateProfilePayload,
  UpdateProductPayload,
  User,
} from '../types';
import { httpRequest } from '../lib/http';

/* ------------------------------------------------------------------ */
/* Autenticación                                                       */
/* ------------------------------------------------------------------ */

export const authService = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return httpRequest<AuthResponse>({ method: 'POST', url: '/auth/login', data: payload });
  },

  register(payload: RegisterPayload): Promise<AuthResponse> {
    return httpRequest<AuthResponse>({ method: 'POST', url: '/auth/register', data: payload });
  },

  logout(): Promise<{ message: string }> {
    return httpRequest<{ message: string }>({ method: 'POST', url: '/auth/logout' });
  },

  getProfile(): Promise<User> {
    return httpRequest<User>({ method: 'GET', url: '/users/me' });
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return httpRequest<User>({ method: 'PATCH', url: '/users/me', data: payload });
  },
};

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

export const categoriesService = {
  list(): Promise<Category[]> {
    return httpRequest<Category[]>({ method: 'GET', url: '/categories' });
  },

  getById(id: string): Promise<Category> {
    return httpRequest<Category>({ method: 'GET', url: `/categories/${id}` });
  },

  create(payload: CreateCategoryPayload): Promise<Category> {
    return httpRequest<Category>({ method: 'POST', url: '/categories', data: payload });
  },

  update(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    return httpRequest<Category>({ method: 'PATCH', url: `/categories/${id}`, data: payload });
  },

  remove(id: string): Promise<void> {
    return httpRequest<void>({ method: 'DELETE', url: `/categories/${id}` });
  },
};

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

export const productsService = {
  list(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
    return httpRequest<PaginatedResponse<Product>>({
      method: 'GET',
      url: '/products',
      params,
    });
  },

  getById(id: string): Promise<Product> {
    return httpRequest<Product>({ method: 'GET', url: `/products/${id}` });
  },

  create(payload: CreateProductPayload): Promise<Product> {
    return httpRequest<Product>({ method: 'POST', url: '/products', data: payload });
  },

  update(id: string, payload: UpdateProductPayload): Promise<Product> {
    return httpRequest<Product>({ method: 'PATCH', url: `/products/${id}`, data: payload });
  },

  remove(id: string): Promise<void> {
    return httpRequest<void>({ method: 'DELETE', url: `/products/${id}` });
  },
};

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */

/** POST /favorites devuelve la relación; al frontend solo le interesa saber que quedó. */
interface FavoriteRelation {
  id: string;
  userId: string;
  productId: string;
}

export const favoritesService = {
  /** Lista los productos favoritos del usuario autenticado. */
  list(): Promise<Product[]> {
    return httpRequest<Product[]>({ method: 'GET', url: '/favorites' });
  },

  add(productId: string): Promise<FavoriteRelation> {
    return httpRequest<FavoriteRelation>({
      method: 'POST',
      url: `/favorites/${productId}`,
    });
  },

  remove(productId: string): Promise<void> {
    return httpRequest<void>({ method: 'DELETE', url: `/favorites/${productId}` });
  },
};

/* ------------------------------------------------------------------ */
/* Órdenes de compra                                                   */
/* ------------------------------------------------------------------ */

export const ordersService = {
  /** Compra directa: registra la orden y descuenta stock en la API. */
  purchase(payload: CreateOrderPayload): Promise<Order> {
    return httpRequest<Order>({ method: 'POST', url: '/orders', data: payload });
  },

  myOrders(): Promise<Order[]> {
    return httpRequest<Order[]>({ method: 'GET', url: '/orders/me' });
  },
};
