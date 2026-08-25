import { useState } from 'react';
import { useAuth, useFavorites } from '../../hooks';
import type { Product } from '../../types';

interface FavoriteButtonProps {
  product: Product;
  /** Variante compacta para tarjetas o con texto para la vista de favoritos. */
  withLabel?: boolean;
}

/**
 * Corazón de favorito. Solo se renderiza para usuarios autenticados.
 * El estado visual viene del contexto global (sincronizado entre vistas)
 * y el toggle es optimista con reconciliación de 409/404 en el contexto.
 */
export function FavoriteButton({ product, withLabel = false }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pending, setPending] = useState(false);

  if (!isAuthenticated) return null;

  const active = isFavorite(product.id);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // no navegar si el botón vive dentro de un Link
    if (pending) return;
    setPending(true);
    try {
      await toggleFavorite(product);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-btn ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      title={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      disabled={pending}
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {withLabel && <span>{active ? 'En favoritos' : 'Agregar a favoritos'}</span>}
    </button>
  );
}
