interface LoaderProps {
  label?: string;
}

/** Indicador de carga accesible. */
export function Loader({ label = 'Cargando…' }: LoaderProps) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Pantalla completa para guardas de ruta mientras se valida la sesión. */
export function PageLoader() {
  return (
    <div className="page-loader">
      <Loader />
    </div>
  );
}

/** Rejilla de esqueletos para listas de productos/categorías mientras cargan. */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton skeleton--media" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}
