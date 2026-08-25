import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

/** Evento global disparado cuando la API responde 401 con una sesión activa. */
export const UNAUTHORIZED_EVENT = 'gp:unauthorized';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/* --------------------------- Interceptor de request -------------------------- */
/* Inyecta `Authorization: Bearer <token>` en toda petición si hay sesión.       */
http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* --------------------------- Interceptor de response ------------------------- */
/* Reacciona a 401: si había token guardado (sesión vencida/revocada), lo elimina
   y avisa a la app mediante un evento para que el AuthContext cierre la sesión. */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint = requestUrl.startsWith('/auth/login') || requestUrl.startsWith('/auth/register');

    if (status === 401 && !isAuthEndpoint && Boolean(tokenStorage.get())) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  },
);

/**
 * Capa de fetch tipada: cada llamada declara qué espera recibir.
 * Los servicios de dominio se construyen encima de esta función genérica.
 */
export async function httpRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config);
  return response.data;
}
