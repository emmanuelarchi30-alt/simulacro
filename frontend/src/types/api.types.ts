/** Envoltura estándar de respuestas paginadas del backend. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Query params que acepta GET /products. */
export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

/**
 * Cuerpo de error de NestJS (ValidationPipe + HttpException).
 * `message` puede llegar como string o como lista de mensajes de validación.
 */
export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
}
