/**
 * Orden de compra directa (1 producto por orden).
 * El precio queda congelado en la orden (`unitPrice`) aunque el producto
 * cambie de precio después.
 */
export interface Order {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface CreateOrderPayload {
  productId: string;
  /** Entre 1 y 10 (validado también por la API). */
  quantity: number;
}
