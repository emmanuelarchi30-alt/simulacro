import { AppError } from '../../lib/errors';

interface ErrorMessageProps {
  error?: AppError | null;
  /** Mensaje manual cuando no hay objeto de error. */
  message?: string;
  onRetry?: () => void;
}

/**
 * Feedback visible para cualquier fallo de datos (red, validación,
 * autorización…). Traduce el `kind` del AppError a un texto claro.
 */
export function ErrorMessage({ error, message, onRetry }: ErrorMessageProps) {
  const text = message ?? error?.userMessage() ?? 'Ocurrió un error inesperado.';
  const isNetwork = error?.kind === 'network';
  const isForbidden = error?.kind === 'forbidden' || error?.kind === 'unauthorized';

  return (
    <div className={`alert ${isNetwork ? 'alert--network' : isForbidden ? 'alert--forbidden' : 'alert--error'}`} role="alert">
      <div>
        <strong>{isNetwork ? 'Sin conexión con el servidor' : isForbidden ? 'Acceso denegado' : 'Algo salió mal'}</strong>
        <p>{text}</p>
        {isNetwork && <small>Verifica que la API esté corriendo e inténtalo de nuevo.</small>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  children?: React.ReactNode;
}

/** Estado vacío reutilizable para listas sin resultados. */
export function EmptyState({ title, hint, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">📦</span>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {children}
    </div>
  );
}
