import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { LoginPage } from '../pages/LoginPage';
import type { AuthResponse } from '../types';

// Solo se simula la capa HTTP (servicios): el resto es lógica real de la app.
vi.mock('../services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services')>();
  return {
    ...actual,
    authService: {
      ...actual.authService,
      login: vi.fn(),
      getProfile: vi.fn(),
    },
  };
});

import { authService } from '../services';
import { AppError } from '../lib/errors';

const mockedLogin = vi.mocked(authService.login);

const fakeAuth: AuthResponse = {
  accessToken: 'jwt-de-prueba',
  user: {
    id: 'u-1',
    name: 'Ana Pérez',
    email: 'ana@example.com',
    avatar: null,
        role: 'user',
    createdAt: new Date().toISOString(),
  },
};

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Ruta sonda para verificar que la navegación ocurrió tras el login */}
            <Route path="/products" element={<div>CATÁLOGO PROTEGIDO</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('LoginForm (integración)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('envía las credenciales a la API y navega al catálogo cuando son válidas', async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValueOnce(fakeAuth);

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledTimes(1);
      expect(mockedLogin).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'secret123',
      });
    });

    // El login exitoso guarda el token y redirige
    expect(window.localStorage.getItem('gp.accessToken')).toBe('jwt-de-prueba');
    expect(await screen.findByText(/CATÁLOGO PROTEGIDO/i)).toBeInTheDocument();
  });

  it('muestra el error visible del servidor cuando las credenciales son inválidas (401)', async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValueOnce(
      new AppError('unauthorized', 'Credenciales inválidas'),
    );

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/credenciales inválidas/i);

    // No navegó ni guardó token
    expect(screen.queryByText(/CATÁLOGO PROTEGIDO/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem('gp.accessToken')).toBeNull();
  });

  it('valida en el cliente sin llamar a la API si el correo no tiene formato', async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'no-es-un-correo');
    await user.type(screen.getByLabelText(/contraseña/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/ingresa un correo válido/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });
});
