const TOKEN_KEY = 'gp.accessToken';

/**
 * Acceso al token en `localStorage`.
 * Se eligió localStorage (y no sessionStorage) para que la sesión sobreviva
 * recargas y pestañas nuevas mientras el JWT esté vigente; ver README.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
