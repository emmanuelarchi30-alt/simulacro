/* eslint-disable react/only-export-components -- el token del contexto se exporta junto a su provider (patrón estándar de Context API) */

import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services';
import { UNAUTHORIZED_EVENT } from '../lib/http';
import { tokenStorage } from '../lib/tokenStorage';
import type { LoginPayload, UpdateProfilePayload, User, UserRole } from '../types';

type SessionStatus = 'initializing' | 'authenticated' | 'guest';

export interface AuthContextValue {
  user: User | null;
  /** Rol actual o null si no hay sesión. */
  role: UserRole | null;
  isAuthenticated: boolean;
  /** True mientras se valida un token guardado contra /users/me al arrancar. */
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  /** Actualiza nombre/foto de perfil contra PATCH /users/me y refresca el estado. */
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Estado global de sesión.
 * - Al montar: si hay token en localStorage se valida con GET /users/me.
 * - Escucha el evento global de 401 (disparado por el interceptor de axios)
 *   para limpiar la sesión cuando el token vence mientras se navega.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('initializing');

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setStatus('guest');
      return;
    }

    let cancelled = false;
    authService
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setStatus('guest');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = async (payload: LoginPayload): Promise<void> => {
    const response = await authService.login(payload);
    tokenStorage.set(response.accessToken);
    setUser(response.user);
    setStatus('authenticated');
  };

  /**
   * Actualiza el perfil contra la API y sincroniza el usuario en memoria
   * (y por ende navbar, badges y avatar) solo si la petición fue exitosa.
   */
  const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  /**
   * Cierra sesión: primero avisa a la API (POST /auth/logout) y luego limpia
   * el storage local pase lo que pase (`finally`), para nunca dejar tokens huérfanos.
   */
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // La API no guarda estado del JWT; aunque falle, la sesión local debe cerrarse.
    } finally {
      tokenStorage.clear();
      setUser(null);
      setStatus('guest');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: status === 'authenticated',
      initializing: status === 'initializing',
      login,
      updateProfile,
      logout,
    }),
    // login/logout son estables (recreados solo si cambia algo de abajo);
    // eslint no los rastrea, pero su identidad cambia con cada render de provider.
    // Se excluyen a propósito: su comportamiento depende únicamente de `status`/`user`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
