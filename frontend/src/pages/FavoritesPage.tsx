import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Loader } from '../components/common/Loader';
import { ProductCard } from '../components/common/ProductCard';

/**
 * "Mis favoritos": lista viva del usuario autenticado.
 * Agregar/quitar en cualquier vista se refleja aquí sin recargar,
 * porque el estado vive en FavoritesContext.
 */
export function FavoritesPage() {
  const { favorites, loading, error, refresh } = useFavorites();

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Mis favoritos</h1>
          <p className="muted">{favorites.length} producto(s) guardados</p>
        </div>
      </header>

      {loading && <Loader label="Cargando favoritos…" />}

      {!loading && error && <ErrorMessage error={error} onRetry={refresh} />}

      {!loading && !error && favorites.length === 0 && (
        <ErrorMessage message="Todavía no has guardado favoritos. Explora el catálogo y toca el corazón." />
      )}

      {!loading && !error && favorites.length > 0 && (
        <div className="grid">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <p className="muted small">
          <Link to="/products">← Seguir explorando</Link>
        </p>
      )}
    </section>
  );
}
