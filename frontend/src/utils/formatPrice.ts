const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formatea un precio numérico como moneda local ($ 129.900). */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return priceFormatter.format(value);
}
