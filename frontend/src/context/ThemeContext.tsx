import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/* eslint-disable react/only-export-components -- el token del contexto se exporta junto a su provider (patrón estándar de Context API) */

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'gp.theme';

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // storage bloqueado → caemos a la preferencia del sistema
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Tema visual global (claro/oscuro) con persistencia en localStorage.
 * Si no hay preferencia guardada, respeta la del sistema operativo.
 * Aplica `data-theme` en <html> para que los tokens CSS cambien en cascada.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // sin persistencia disponible: el tema solo vive durante la sesión
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
