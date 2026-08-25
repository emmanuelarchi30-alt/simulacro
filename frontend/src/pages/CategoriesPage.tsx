import { Link } from 'react-router-dom';
import { categoriesService } from '../services';
import { useAuth, useFetch } from '../hooks';
import { EmptyState, ErrorMessage } from '../components/common/ErrorMessage';
import { Loader } from '../components/common/Loader';

/** Listado público de categorías (sin paginación en la API). */
export function CategoriesPage() {
  const { isAuthenticated, role } = useAuth();
  const { data: categories, loading, error, refetch } = useFetch(
    () => categoriesService.list(),
    [],
  );

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Categorías</h1>
          <p className="muted">Explora el catálogo por categoría.</p>
        </div>
        {isAuthenticated && role === 'admin' && (
          <Link to="/categories/new" className="btn btn--primary">
            + Nueva categoría
          </Link>
        )}
      </header>

      {loading && <Loader label="Cargando categorías…" />}

      {!loading && error && <ErrorMessage error={error} onRetry={refetch} />}

      {!loading && !error && (categories ?? []).length === 0 && (
        <EmptyState
          title="Aún no hay categorías"
          hint="Cuando un administrador cree categorías aparecerán aquí."
        />
      )}

      {!loading && !error && (categories ?? []).length > 0 && (
        <div className="grid grid--categories">
          {(categories ?? []).map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="card category-card"
            >
              <h3>{category.name}</h3>
              <p>{category.description ?? 'Sin descripción'}</p>
              <span className="category-card__cta">Ver productos →</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
