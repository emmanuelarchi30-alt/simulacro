/**
 * Barrel de hooks reutilizables.
 * Los hooks de contexto viven aquí como capa de consumo:
 * los componentes nunca importan contextos directamente.
 */
export { useAuth } from './useAuth';
export { useDebouncedValue } from './useDebouncedValue';
export { useFavorites } from './useFavorites';
export { useFetch } from './useFetch';
export { useForm } from './useForm';
export { useTheme } from './useTheme';
export { useToast } from './useToast';
export type { FormErrors } from './useForm';
