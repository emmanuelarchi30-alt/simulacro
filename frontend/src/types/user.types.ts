/**
 * Roles soportados por el backend (enum `users_role_enum` en PostgreSQL).
 * Se modela como unión literal para poder hacer narrowing exhaustivo.
 */
export type UserRole = 'admin' | 'user';

/**
 * Usuario tal como lo devuelve la API (`UserResponseDto`).
 * La contraseña nunca llega al frontend.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** URL de la foto de perfil (opcional; null si no tiene). */
  avatar: string | null;
  createdAt: string;
}

/** Cuerpo de PATCH /users/me: ambos campos opcionales. */
export interface UpdateProfilePayload {
  name?: string;
  /** URL de la imagen; enviar null para quitar la foto. */
  avatar?: string | null;
}
