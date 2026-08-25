import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type { ThemeContextValue } from '../context/ThemeContext';

/** Hook de consumo del tema claro/oscuro. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}
