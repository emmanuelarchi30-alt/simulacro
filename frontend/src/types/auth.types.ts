import type { User } from './user.types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/** Respuesta de /auth/login y /auth/register. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
