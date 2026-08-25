import { Link } from 'react-router-dom';
import { SafeImage } from './SafeImage';
import { FavoriteButton } from './FavoriteButton';
import { formatPrice } from '../../utils/formatPrice';
import type { Product } from '../../types';

/** Tarjeta de producto reutilizada en listado general, detalle de categoría y favoritos. */
export function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.[0]?.url ?? null;

  return (
    <article className="card product-card">
      <FavoriteButton product={product} />
      <Link to={`/products/${product.id}`} className="product-card__link">
        <div className="product-card__media">
          <SafeImage src={cover} alt={`Imagen de ${product.name}`} className="product-card__img" />
        </div>
        <div className="product-card__body">
          <span className="badge">{product.category?.name ?? 'Sin categoría'}</span>
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__price">{formatPrice(product.price)}</p>
          <span className={`stock ${product.stock > 0 ? 'stock--ok' : 'stock--out'}`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          </span>
        </div>
      </Link>
    </article>
  );
}
