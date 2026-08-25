import type { Category } from './category.types';

export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: Category;
  categoryId: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
}

/** PATCH /products/:id admite cualquier subconjunto de campos. */
export type UpdateProductPayload = Partial<CreateProductPayload>;
