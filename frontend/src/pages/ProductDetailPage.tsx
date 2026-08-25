import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ordersService, productsService } from '../services';
import { toAppError } from '../lib/errors';
import { useAuth, useFetch } from '../hooks';
import { useToast } from '../hooks';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Loader } from '../components/common/Loader';
import { SafeImage } from '../components/common/SafeImage';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { formatPrice } from '../utils/formatPrice';

/** Cantidad máxima por compra; la API valida lo mismo. */
const MAX_QTY_PER_ORDER = 10;

/** Vista de detalle de producto: galería tolerante a imágenes rotas + acciones. */
export function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const { showToast } = useToast();

  const productState = useFetch(() => productsService.getById(id), [id]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  if (productState.loading) return <Loader label="Cargando producto…" />;
  if (productState.error) {
    return <ErrorMessage error={productState.error} onRetry={productState.refetch} />;
  }

  const product = productState.data;
  if (!product) return <ErrorMessage message="Producto no disponible." />;

  const images = product.images ?? [];
  const currentImage = images[selectedImage]?.url ?? images[0]?.url ?? null;
  const isAdmin = role === 'admin';
  const maxQty = Math.min(product.stock, MAX_QTY_PER_ORDER);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await productsService.remove(product.id);
      showToast('Producto eliminado.', 'success');
      navigate('/products', { replace: true });
    } catch (cause) {
      // El fallo ya viene clasificado: red, permisos o recurso inexistente.
      showToast(toAppError(cause).userMessage(), 'error');
    } finally {
      setDeleting(false);
    }
  };

  /** Compra directa: registra la orden y refresca el stock mostrado. */
  const handleBuy = async () => {
    setBuying(true);
    try {
      const order = await ordersService.purchase({
        productId: product.id,
        quantity,
      });
      showToast(
        `¡Compra realizada! ${order.quantity} × ${order.product.name}`,
        'success',
      );
      setQuantity(1);
      await productState.refetch();
    } catch (cause) {
      showToast(toAppError(cause).userMessage(), 'error');
    } finally {
      setBuying(false);
    }
  };

  return (
    <section>
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link to="/products">Productos</Link> <span aria-hidden="true">/</span>{' '}
        <strong>{product.name}</strong>
      </nav>

      <div className="detail card">
        <div className="detail__gallery">
          <SafeImage
            src={currentImage}
            alt={`Imagen de ${product.name}`}
            className="detail__main-image"
          />
          {images.length > 1 && (
            <div className="detail__thumbs">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={`detail__thumb ${index === selectedImage ? 'is-active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <SafeImage src={image.url} alt="" className="detail__thumb-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail__info">
          <Link to={`/categories/${product.category.id}`} className="badge badge--link">
            {product.category.name}
          </Link>
          <h1>{product.name}</h1>
          <p className="detail__price">{formatPrice(product.price)}</p>
          <span className={`stock ${product.stock > 0 ? 'stock--ok' : 'stock--out'}`}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}
          </span>
          <p className="detail__description">{product.description ?? 'Sin descripción.'}</p>

          {product.stock > 0 && (
            <div className="buy-box">
              <div className="qty-selector" role="group" aria-label="Cantidad a comprar">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Quitar una unidad"
                >
                  −
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="Agregar una unidad"
                >
                  +
                </button>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn--primary btn--buy"
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying
                    ? 'Procesando…'
                    : `Comprar ahora · ${formatPrice(product.price * quantity)}`}
                </button>
              ) : (
                <Link to="/login" className="btn btn--primary btn--buy">
                  Inicia sesión para comprar
                </Link>
              )}
            </div>
          )}

          <div className="detail__actions">
            <FavoriteButton product={product} withLabel />
            {isAdmin && (
              <>
                <Link to={`/products/${product.id}/edit`} className="btn btn--ghost">
                  Editar
                </Link>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <p className="muted small">
              <Link to="/login">Inicia sesión</Link> para comprar o guardar favoritos.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
