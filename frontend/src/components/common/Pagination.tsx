interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Rango compacto de páginas con elipsis, ej: 1 … 4 5 6 … 12 */
function buildPageWindow(page: number, totalPages: number): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];
  let previous = 0;
  for (const current of sorted) {
    if (current - previous > 1) {
      result.push(previous === 0 ? 'ellipsis-left' : 'ellipsis-right');
    }
    result.push(current);
    previous = current;
  }
  return result;
}

/** Controles de paginación para listas del backend paginado. */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación de resultados">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹ Anterior
      </button>

      {buildPageWindow(page, totalPages).map((entry) =>
        typeof entry === 'number' ? (
          <button
            key={entry}
            type="button"
            className={`pagination__page ${entry === page ? 'is-active' : ''}`}
            aria-current={entry === page ? 'page' : undefined}
            onClick={() => onChange(entry)}
          >
            {entry}
          </button>
        ) : (
          <span key={entry} className="pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ),
      )}

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente ›
      </button>
    </nav>
  );
}
