import { Link } from 'react-router-dom';
import { ordersService } from '../services';
import { useFetch } from '../hooks';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Loader } from '../components/common/Loader';
import { SafeImage } from '../components/common/SafeImage';
import { formatPrice } from '../utils/formatPrice';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Historial de compras del usuario autenticado (GET /orders/me). */
export function MyOrdersPage() {
  const ordersState = useFetch(() => ordersService.myOrders(), []);

  if (ordersState.loading) return <Loader label="Cargando tus compras…" />;
  if (ordersState.error) {
    return <ErrorMessage error={ordersState.error} onRetry={ordersState.refetch} />;
  }

  const orders = ordersState.data ?? [];

  return (
    <section className="container">
      <header className="page-header">
        <h1>Mis compras</h1>
      </header>

      {orders.length === 0 ? (
        <div className="card card--form empty-state">
          <span aria-hidden="true">🧾</span>
          <h2>Todavía no has comprado nada</h2>
          <p>Explora el catálogo y estrena algo hoy mismo.</p>
          <Link to="/products" className="btn btn--primary">
            Ver productos
          </Link>
        </div>
      ) : (
        <ul className="orders">
          {orders.map((order) => (
            <li key={order.id} className="order-row card">
              <SafeImage
                src={order.product.image}
                alt={order.product.name}
                className="order-row__thumb"
              />
              <div className="order-row__info">
                <Link to={`/products/${order.product.id}`} className="order-row__name">
                  {order.product.name}
                </Link>
                <p className="muted small">
                  {formatDate(order.createdAt)} · {order.quantity} ×{' '}
                  {formatPrice(order.unitPrice)}
                </p>
              </div>
              <div className="order-row__meta">
                <strong>{formatPrice(order.totalPrice)}</strong>
                <span className={`badge badge--status badge--${order.status}`}>
                  {order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
