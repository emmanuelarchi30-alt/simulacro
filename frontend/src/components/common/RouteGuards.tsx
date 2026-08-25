import type { ReactElement, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import type { UserRole } from '../../types';
import { PageLoader } from './Loader';

interface GuardProps {
  children: ReactNode;
}

/**
 * Primer nivel de protección: exige sesión iniciada.
 * Si no la hay redirige a /login recordando de dónde venía el usuario.
 */
export function RequireAuth({ children }: GuardProps): ReactElement {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Inverso de RequireAuth: si ya hay sesión, /login y /register no aplican.
 */
export function GuestOnly({ children }: GuardProps): ReactElement {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/products" replace />;

  return <>{children}</>;
}

interface RoleGuardProps extends GuardProps {
  /** Roles permitidos (RBAC). Ej: ['admin'] para crear categorías. */
  roles: readonly UserRole[];
}

/**
 * Segundo nivel de protección: autorización por rol.
 * Un usuario autenticado sin el rol requerido que entra por URL directa
 * es redirigido al inicio con un aviso — no solo se oculta el botón.
 */
export function RequireRole({ roles, children }: RoleGuardProps): ReactElement {
  const { role, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role || !roles.includes(role)) {
    return (
      <Navigate to="/products" replace state={{ denied: true, requiredRoles: roles }} />
    );
  }

  return <>{children}</>;
}
