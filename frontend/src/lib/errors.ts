import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api.types';

/**
 * Clasificación de todo lo que puede fallar en una llamada a la API.
 * El tipo obliga a manejar cada caso de forma explícita en la UI.
 */
export type ErrorKind =
  | 'network' // backend caído / sin conexión / timeout
  | 'validation' // 400 — datos inválidos
  | 'unauthorized' // 401 — sin token o token vencido
  | 'forbidden' // 403 — sin rol suficiente
  | 'not_found' // 404
  | 'conflict' // 409 — duplicado / ya existe
  | 'server' // 500+
  | 'unknown';

const KIND_BY_STATUS: Readonly<Record<number, ErrorKind>> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
};

/** Errores de campo por nombre para pintarlos junto al input correspondiente. */
export type FieldErrors = Record<string, string>;

const FIELD_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['email', /\b(email|correo)\b/i],
  ['password', /\b(password|contrase)/i],
  ['name', /\b(name|nombre)\b/i],
  ['price', /\b(price|precio)\b/i],
  ['stock', /\bstock\b/i],
  ['categoryId', /\b(categor)/i],
  ['images', /\b(image|imagen|url)\b/i],
];

function extractFieldErrors(
  message: string | string[],
): { fieldErrors: FieldErrors; generalMessages: string[] } {
  const messages = Array.isArray(message) ? message : [message];
  const fieldErrors: FieldErrors = {};
  const generalMessages: string[] = [];

  for (const msg of messages) {
    // "propertyX must be ..." → NestJS incluye la propiedad en el mensaje
    const propertyMatch = /^(?<prop>[A-Za-z][A-Za-z0-9_]*)\s+(?:must|debe|does|no)/.exec(msg);
    let matchedField: string | undefined;

    if (propertyMatch?.groups?.['prop']) {
      matchedField = FIELD_PATTERNS.find(([, re]) =>
        re.test(propertyMatch.groups?.['prop'] ?? ''),
      )?.[0];
    }
    matchedField ??= FIELD_PATTERNS.find(([, re]) => re.test(msg))?.[0];

    if (matchedField) {
      fieldErrors[matchedField] = fieldErrors[matchedField]
        ? `${fieldErrors[matchedField]} ${msg}`
        : msg;
    } else {
      generalMessages.push(msg);
    }
  }

  return { fieldErrors, generalMessages };
}

/**
 * Error de aplicación: unifica lo que devuelve la API con los fallos de red,
 * y expone un mensaje listo para mostrar al usuario.
 * Es la única clase del proyecto: aquí sí aporta valor porque necesitamos
 * `instanceof` + propiedades estructuradas (kind/status/fieldErrors).
 */
export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly status?: number;
  readonly fieldErrors: FieldErrors;

  constructor(kind: ErrorKind, message?: string, options?: { status?: number; fieldErrors?: FieldErrors }) {
    super(message ?? AppError.defaultMessageFor(kind));
    this.name = 'AppError';
    this.kind = kind;
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors ?? {};
  }

  static defaultMessageFor(kind: ErrorKind): string {
    switch (kind) {
      case 'network':
        return 'No se pudo conectar con el servidor. Revisa tu conexión o inténtalo más tarde.';
      case 'validation':
        return 'Revisa los datos ingresados.';
      case 'unauthorized':
        return 'Credenciales inválidas o sesión expirada.';
      case 'forbidden':
        return 'No tienes permisos para realizar esta acción.';
      case 'not_found':
        return 'El recurso solicitado no existe.';
      case 'conflict':
        return 'El recurso ya existe o entra en conflicto con otro.';
      case 'server':
        return 'El servidor tuvo un error inesperado. Inténtalo de nuevo.';
      default:
        return 'Ocurrió un error inesperado.';
    }
  }

  /** Mensaje final para mostrar en la interfaz. */
  userMessage(): string {
    if (this.kind === 'validation') {
      const generals = Object.values(this.fieldErrors).length > 0;
      return generals ? this.message || AppError.defaultMessageFor(this.kind) : this.message;
    }
    return this.message;
  }
}

/** Convierte cualquier excepción (axios u otra) en un `AppError` predecible. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (isAxiosError(error)) {
    if (!error.response) {
      return new AppError('network', undefined);
    }

    const status = error.response.status;
    const kind = KIND_BY_STATUS[status] ?? (status >= 500 ? 'server' : 'unknown');
    const data = error.response.data as Partial<ApiErrorResponse> | undefined;

    if (data && typeof data === 'object' && 'message' in data && data.message) {
      const rawMessage = data.message as string | string[];
      const { fieldErrors, generalMessages } = extractFieldErrors(rawMessage);
      const firstGeneral =
        generalMessages[0] ??
        Object.values(fieldErrors)[0] ??
        AppError.defaultMessageFor(kind);
      const joined =
        kind === 'validation'
          ? generalMessages.length > 0
            ? generalMessages.join(' ')
            : firstGeneral
          : typeof rawMessage === 'string'
            ? rawMessage
            : generalMessages.join(' ') || firstGeneral;
      return new AppError(kind, joined, { status, fieldErrors });
    }

    return new AppError(kind, undefined, { status });
  }

  if (error instanceof Error) {
    return new AppError('unknown', error.message);
  }

  return new AppError('unknown');
}
