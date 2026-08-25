import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { categoriesService, productsService } from '../services';
import { useAuth, useDebouncedValue, useFetch } from '../hooks';
import { EmptyState, ErrorMessage } from '../components/common/ErrorMessage';
import { SkeletonGrid } from '../components/common/Loader';
import { Pagination } from '../components/common/Pagination';
import { ProductCard } from '../components/common/ProductCard';

const PRODUCTS_PER_PAGE = 9;

/**
 * Listado general de productos (home): búsqueda con debounce,
 * filtro por categoría y paginación — todo sincronizado con la URL.
 */
export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const categoryId = searchParams.get('categoryId') ?? '';

  /** La página vive en la URL para que el listado sea compartible/recargable. */
  const setPage = (nextPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage > 1) next.set('page', String(nextPage));
        else next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // Cualquier cambio en los filtros reinicia la paginación: el efecto
  // reconstruye los query params sin `page` (la URL es la fuente de verdad).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
        else next.delete('search');
        if (categoryId) next.set('categoryId', categoryId);
        else next.delete('categoryId');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, categoryId, setSearchParams]);

  const denied = (location.state as { denied?: boolean } | null)?.denied === true;

  // Limpia el aviso de acceso denegado de history.state tras mostrarlo.
  useEffect(() => {
    if (!denied) return;
    const timeout = window.setTimeout(() => {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [denied, navigate, location.pathname, location.search]);

  const categoriesState = useFetch(() => categoriesService.list(), []);
  const searchTerm = debouncedSearch.trim();
  const productsState = useFetch(
    () =>
      productsService.list({
        search: searchTerm || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: PRODUCTS_PER_PAGE,
      }),
    [searchTerm, categoryId, page],
  );

  const products = productsState.data?.data ?? [];
  const hasActiveFilters = Boolean(searchTerm || categoryId);

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Productos</h1>
          <p className="muted">
            {productsState.data
              ? `${productsState.data.total} producto(s) encontrados`
              : 'Catálogo completo'}
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/products/new" className="btn btn--primary">
            + Nuevo producto
          </Link>
        )}
      </header>

      {denied && (
        <div className="alert alert--forbidden" role="alert">
          <strong>Acceso restringido.</strong> No tienes el rol necesario para esa sección.
        </div>
      )}

      <div className="filters card">
        <div className="field field--grow">
          <label htmlFor="filter-search">Buscar</label>
          <input
            id="filter-search"
            type="search"
            placeholder="Buscar por nombre o descripción…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-category">Categoría</label>
          <select
            id="filter-category"
            value={categoryId}
            onChange={(e) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (e.target.value) next.set('categoryId', e.target.value);
                else next.delete('categoryId');
                next.delete('page');
                return next;
              })
            }
          >
            <option value="">Todas</option>
            {(categoriesState.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {productsState.loading && <SkeletonGrid count={PRODUCTS_PER_PAGE} />}

      {!productsState.loading && productsState.error && (
        <ErrorMessage error={productsState.error} onRetry={productsState.refetch} />
      )}

      {!productsState.loading && !productsState.error && products.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? 'Sin resultados' : 'No hay productos todavía'}
          hint={
            hasActiveFilters
              ? 'Prueba con otros términos de búsqueda o cambia el filtro de categoría.'
              : 'Cuando se creen productos aparecerán aquí.'
          }
        >
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearchInput('');
                setSearchParams(new URLSearchParams());
              }}
            >
              Limpiar filtros
            </button>
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
            onChange={(nextPage) => setPage(nextPage)}
          />
        </>
      )}
    </section>
  );
}
