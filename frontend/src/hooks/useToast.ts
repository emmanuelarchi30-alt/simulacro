import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import type { ToastContextValue } from '../context/ToastContext';

/** Hook de consumo de los avisos globales. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}
