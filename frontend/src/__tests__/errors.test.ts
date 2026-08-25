import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { AppError, toAppError } from '../lib/errors';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;

  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
}

describe('toAppError', () => {
  it('clasifica un fallo sin respuesta como error de red', () => {
    const error = toAppError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(error).toBeInstanceOf(AppError);
    expect(error.kind).toBe('network');
  });

  it('clasifica un 400 con mensajes de validación y extrae errores por campo', () => {
    const error = toAppError(
      axiosErrorWith(400, {
        statusCode: 400,
        message: ['email must be an email', 'password must be longer than or equal to 6 characters'],
        error: 'Bad Request',
      }),
    );

    expect(error.kind).toBe('validation');
    expect(error.status).toBe(400);
    expect(error.fieldErrors['email']).toContain('must be an email');
    expect(error.fieldErrors['password']).toContain('password');
  });

  it('clasifica 401 y 403 en errores de autorización', () => {
    expect(toAppError(axiosErrorWith(401, { message: 'Credenciales inválidas' })).kind).toBe('unauthorized');
    expect(toAppError(axiosErrorWith(403, { message: 'No autorizado' })).kind).toBe('forbidden');
  });

  it('clasifica 404 y 409 con su mensaje del servidor', () => {
    const notFound = toAppError(axiosErrorWith(404, { message: 'Producto no encontrado' }));
    const conflict = toAppError(
      axiosErrorWith(409, { message: 'El producto ya está en favoritos' }),
    );

    expect(notFound.kind).toBe('not_found');
    expect(notFound.message).toBe('Producto no encontrado');
    expect(conflict.kind).toBe('conflict');
    expect(conflict.message).toBe('El producto ya está en favoritos');
  });

  it('clasifica 500+ como error de servidor', () => {
    const error = toAppError(axiosErrorWith(500, { message: 'Internal Server Error' }));
    expect(error.kind).toBe('server');
  });

  it('convierte cualquier excepción desconocida en AppError genérico', () => {
    const error = toAppError('algo raro');
    expect(error).toBeInstanceOf(AppError);
    expect(error.kind).toBe('unknown');
  });
});
