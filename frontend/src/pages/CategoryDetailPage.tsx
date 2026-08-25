import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoriesService, productsService } from '../services';
import { useAuth, useFetch } from '../hooks';
import { EmptyState, ErrorMessage } from '../components/common/ErrorMessage';
import { Loader, SkeletonGrid } from '../components/common/Loader';
import { Pagination } from '../components/common/Pagination';
import { ProductCard } from '../components/common/ProductCard';

const PRODUCTS_PER_PAGE = 6;

/**
 * Detalle de categoría: información + productos paginados.
 * El botón "Agregar producto a esta categoría" es visible solo
 * para usuarios autenticados (cualquier rol).
 */
export function CategoryDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();

  const categoryState = useFetch(() => categoriesService.getById(id), [id]);
  const productsState = useFetch(
    () => productsService.list({ categoryId: id, page, limit: PRODUCTS_PER_PAGE }),
    [id, page],
  );

  if (categoryState.loading) return <Loader label="Cargando categoría…" />;
  if (categoryState.error) {
    return <ErrorMessage error={categoryState.error} onRetry={categoryState.refetch} />;
  }

  const category = categoryState.data;
  if (!category) {
    return <ErrorMessage message="No se encontró la categoría solicitada." />;
  }

  const products = productsState.data?.data ?? [];

  return (
    <section>
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link to="/categories">Categorías</Link> <span aria-hidden="true">/</span>{' '}
        <strong>{category.name}</strong>
      </nav>

      <header className="page-header">
        <div>
          <h1>{category.name}</h1>
          <p className="muted">{category.description ?? 'Sin descripción'}</p>
        </div>
        {isAuthenticated && (
          <Link to={`/categories/${category.id}/products/new`} className="btn btn--primary">
            + Agregar producto a esta categoría
          </Link>
        )}
      </header>

      {productsState.loading && (
        <>
          <span className="visually-hidden">Cargando productos…</span>
          <SkeletonGrid count={PRODUCTS_PER_PAGE} />
        </>
      )}

      {!productsState.loading && productsState.error && (
        <ErrorMessage error={productsState.error} onRetry={productsState.refetch} />
      )}

      {!productsState.loading && !productsState.error && products.length === 0 && (
        <EmptyState
          title="Esta categoría aún no tiene productos"
          hint={
            isAuthenticated
              ? 'Usa el botón "Agregar producto" para crear el primero.'
              : 'Inicia sesión para poder agregar productos.'
          }
        >
          {!isAuthenticated && (
            <Link to="/login" className="btn btn--primary btn--sm">
              Iniciar sesión
            </Link>
          )}
        </EmptyState>
      )}

      {!productsState.loading && !productsState.error && products.length > 0 && (
        <>
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={productsState.data?.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </section>
  );
}
