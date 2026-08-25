import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toAppError } from '../lib/errors';
import type { AppError } from '../lib/errors';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

/**
 * Hook genérico de carga de datos.
 * - Dispara la petición dentro de `useEffect` (nunca en el cuerpo del componente).
 * - La dependencia del efecto es la lista `deps` que pasa el llamador + un contador
 *   interno para `refetch`, así no hay bucles infinitos aunque `fetcher` cambie de
 *   identidad en cada render (se mantiene la última referencia en un ref).
 * - Ignora resultados de peticiones canceladas/desmontadas (`cancelled`).
 */
export function useFetch<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return useMemo(
    () => ({ data, loading, error, refetch }),
    [data, loading, error, refetch],
  );
}
