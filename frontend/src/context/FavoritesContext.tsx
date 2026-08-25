/* eslint-disable react/only-export-components -- el token del contexto se exporta junto a su provider (patrón estándar de Context API) */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { favoritesService } from '../services';
import { toAppError } from '../lib/errors';
import type { AppError } from '../lib/errors';
import type { Product } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export interface FavoritesContextValue {
  favorites: Product[];
  favoriteIds: ReadonlySet<string>;
  loading: boolean;
  error: AppError | null;
  isFavorite: (productId: string) => boolean;
  /**
   * Alterna favorito con actualización optimista.
   * - 409: el servidor dice que ya estaba → se sincroniza como favorito (no rompe).
   * - 404: el servidor dice que no estaba → se sincroniza como quitado (no rompe).
   * Devuelve el estado resultante tras la operación.
   */
  toggleFavorite: (product: Product) => Promise<boolean>;
  refresh: () => void;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Sesión de favoritos del usuario autenticado. Carga la lista al iniciar sesión
 * y la limpia al cerrarla; expone un toggle optimista con reconciliación de
 * conflictos (409/404) para que la UI nunca quede desincronizada ni se rompa.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      // Sincronización con un sistema externo (la sesión): al cerrarla se
      // limpia el estado local. No es estado derivado calculable en render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavorites([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    favoritesService
      .list()
      .then((list) => {
        if (!cancelled) setFavorites(list);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(toAppError(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId, reloadToken]);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((product) => product.id)),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (product: Product): Promise<boolean> => {
      const wasFavorite = favoriteIds.has(product.id);

      // Actualización optimista: la UI responde al instante.
      setFavorites((prev) =>
        wasFavorite
          ? prev.filter((item) => item.id !== product.id)
          : [...prev, product],
      );

      try {
        if (!wasFavorite) {
          await favoritesService.add(product.id);
        } else {
          await favoritesService.remove(product.id);
        }
        return !wasFavorite;
      } catch (cause: unknown) {
        const appError = toAppError(cause);

        if (appError.status === 409) {
          // Ya estaba en el servidor: sincronizamos y avisamos sin error.
          setFavorites((prev) =>
            prev.some((item) => item.id === product.id) ? prev : [...prev, product],
          );
          showToast('El producto ya estaba en tus favoritos.', 'info');
          return true;
        }

        if (appError.status === 404) {
          // Ya no existía en el servidor: sincronizamos como quitado.
          setFavorites((prev) => prev.filter((item) => item.id !== product.id));
          showToast('El producto ya no estaba en tus favoritos.', 'info');
          return false;
        }

        // Error real (red, 500…): revertimos y avisamos.
        setFavorites((prev) =>
          wasFavorite
            ? [...prev, product]
            : prev.filter((item) => item.id !== product.id),
        );
        showToast(appError.userMessage(), 'error');
        return wasFavorite;
      }
    },
    [favoriteIds, showToast],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteIds,
      loading,
      error,
      isFavorite: (productId: string) => favoriteIds.has(productId),
      toggleFavorite,
      refresh,
    }),
    [favorites, favoriteIds, loading, error, toggleFavorite, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
