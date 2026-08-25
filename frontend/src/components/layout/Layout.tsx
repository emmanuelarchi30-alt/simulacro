import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';

/** Estructura común: navbar + contenido de la ruta activa + footer. */
export function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main container">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>Gestión de Productos — prueba de desempeño frontend</p>
        {/* Enlace de demostración del Error Boundary (ver README) */}
        <Link to="/demo-crash" className="app-footer__demo-link">
          Simular error de renderizado (demo)
        </Link>
      </footer>
    </div>
  );
}
