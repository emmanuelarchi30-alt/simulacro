import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">🧭</span>
      <h1>Página no encontrada</h1>
      <p>La ruta que buscas no existe o fue movida.</p>
      <Link to="/products" className="btn btn--primary">
        Ir al catálogo
      </Link>
    </div>
  );
}
