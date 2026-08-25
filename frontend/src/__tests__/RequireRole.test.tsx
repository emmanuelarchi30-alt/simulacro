import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { RequireRole } from '../components/common/RouteGuards';
import type { User } from '../types';

/**
 * Prueba de integración del RBAC: un usuario autenticado con rol `user`
 * que intenta entrar por URL directa a una ruta de admin es redirigido.
 * Se simula solo la llamada a /users/me; los guards son reales.
 */
vi.mock('../services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services')>();
  return {
    ...actual,
    authService: {
      ...actual.authService,
      getProfile: vi.fn(),
    },
  };
});

import { authService } from '../services';

const mockedGetProfile = vi.mocked(authService.getProfile);

function userWith(role: User['role']): User {
  return {
    id: 'u-9',
    name: 'Carlos Usuario',
    email: 'carlos@example.com',
    role,
    avatar: null,
    createdAt: new Date().toISOString(),
  };
}

function renderRbacRoutes() {
  return render(
    <MemoryRouter initialEntries={['/categories/new']}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/categories/new"
              element={
                <RequireRole roles={['admin']}>
                  <div>FORMULARIO DE ADMIN</div>
                </RequireRole>
              }
            />
            <Route path="/products" element={<div>CATÁLOGO</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('RequireRole (RBAC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Simula sesión persistida: el provider validará el token con /users/me
    window.localStorage.setItem('gp.accessToken', 'jwt-valido');
  });

  it('permite el acceso cuando el usuario tiene el rol requerido', async () => {
    mockedGetProfile.mockResolvedValueOnce(userWith('admin'));

    renderRbacRoutes();

    expect(await screen.findByText(/FORMULARIO DE ADMIN/i)).toBeInTheDocument();
  });

  it('redirige al inicio cuando un usuario `user` entra por URL directa', async () => {
    mockedGetProfile.mockResolvedValueOnce(userWith('user'));

    renderRbacRoutes();

    expect(
      await screen.findByText(/CATÁLOGO/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/FORMULARIO DE ADMIN/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetProfile).toHaveBeenCalledTimes(1);
    });
  });
});
