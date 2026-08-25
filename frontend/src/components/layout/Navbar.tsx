import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme, useToast } from '../../hooks';
import { SafeImage } from '../common/SafeImage';

/** Iniciales para el avatar cuando el usuario no tiene foto de perfil. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Barra de navegación principal: links condicionados por sesión y rol + toggle de tema. */
export function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showToast('Sesión cerrada correctamente.', 'success');
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/products" className="navbar__brand">
          🛍️ Gestión de Productos
        </Link>

        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Productos
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Categorías
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Mis favoritos
              </NavLink>
              <NavLink to="/my-orders" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Mis compras
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar__session">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {isAuthenticated && user ? (
            <>
              <Link to="/profile" className="navbar__profile" title="Mi perfil" aria-label="Mi perfil">
                <span className="avatar">
                  {user.avatar ? (
                    <SafeImage src={user.avatar} alt={`Foto de ${user.name}`} className="avatar__img" />
                  ) : (
                    <span aria-hidden="true">{initialsOf(user.name)}</span>
                  )}
                </span>
                <span className="navbar__user">
                  {user.name}
                  <span className={`badge badge--role badge--${role}`}>
                    {role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </span>
              </Link>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout} disabled={loggingOut}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
