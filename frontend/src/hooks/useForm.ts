import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { toAppError } from '../lib/errors';

export type FormErrors<T> = Partial<Record<keyof T & string, string>>;

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  /** Validación del lado del cliente; si devuelve errores no se llama a la API. */
  validate?: (values: T) => FormErrors<T>;
}

/**
 * Hook genérico para formularios controlados.
 * - Mantiene valores y errores tipados por campo (`Partial<Record<keyof T, string>>`).
 * - Ejecuta validación local y luego `onSubmit`; si la API responde 400 con
 *   mensajes por campo, los reparte en `errors`; el resto va a `generalError`.
 */
export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const { initialValues, onSubmit, validate } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si el llamador entrega nuevos `initialValues` (p. ej. llegaron los datos
  // del backend para precargar el modo edición), se sincroniza el estado.
  // Se compara por contenido (y no por identidad) porque los llamadores suelen
  // crear el objeto inline; el patrón oficial de React permite ajustar estado
  // durante el render mientras la comparación converja.
  const initialKey = JSON.stringify(initialValues);
  const [prevInitialKey, setPrevInitialKey] = useState(initialKey);
  if (initialKey !== prevInitialKey) {
    setPrevInitialKey(initialKey);
    setValues(initialValues);
    setErrors({});
  }

  const setFieldValue = useCallback(<K extends keyof T & string>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Al escribir se limpia el error del campo (local o del servidor).
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setGeneralError(null);

      const clientErrors = validate?.(values) ?? {};
      const hasClientErrors = Object.values(clientErrors).some(Boolean);
      if (hasClientErrors) {
        setErrors(clientErrors);
        return;
      }
      setErrors({});

      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (cause: unknown) {
        const appError = toAppError(cause);
        if (Object.keys(appError.fieldErrors).length > 0) {
          setErrors(appError.fieldErrors as FormErrors<T>);
          setGeneralError(
            Object.keys(appError.fieldErrors).length > 1
              ? 'Corrige los campos marcados.'
              : null,
          );
        } else {
          setGeneralError(appError.userMessage());
        }
      } finally {
        setSubmitting(false);
      }
    },
    [values, validate, onSubmit],
  );

  return { values, errors, generalError, submitting, setFieldValue, handleSubmit };
}
