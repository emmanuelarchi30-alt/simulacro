import { describe, expect, it } from 'vitest';
import { formatPrice } from '../utils/formatPrice';

describe('formatPrice', () => {
  it('formatea precios enteros como moneda colombiana', () => {
    expect(formatPrice(129900)).toContain('129.900');
  });

  it('formatea precios con decimales', () => {
    expect(formatPrice(1999.5)).toMatch(/1\.999([,.]5)?/);
  });

  it('maneja el cero sin romperse', () => {
    expect(formatPrice(0)).toContain('0');
  });

  it('devuelve un guion para valores no finitos (defensa contra datos inválidos de la API)', () => {
    expect(formatPrice(Number.NaN)).toBe('—');
    expect(formatPrice(Infinity)).toBe('—');
  });
});
