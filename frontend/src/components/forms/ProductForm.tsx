import { useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { categoriesService, productsService } from '../../services';
import { useFetch, useForm } from '../../hooks';
import { SafeImage } from '../common/SafeImage';
import type { Product } from '../../types';

interface ProductFormValues extends Record<string, unknown> {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  imagesText: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  /** Solo para `create`: categoría predefinida al llegar desde una categoría (select bloqueado). */
  presetCategoryId?: string;
  onSaved?: (product: Product) => void;
}

const URL_PATTERN = /^https?:\/\/\S+$/i;

/**
 * Formulario ÚNICO de producto, reutilizado en tres entradas:
 *  - /products/new                      → select de categorías activo.
 *  - /categories/:categoryId/products/new → select precargado y deshabilitado.
 *  - /products/:id/edit                 → modo edición con datos precargados.
 */
export function ProductForm({ mode, presetCategoryId, onSaved }: ProductFormProps) {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();

  // Categorías para el select (en modo create sin preset).
  const categoriesState = useFetch(() => categoriesService.list(), []);

  // En edición se cargan los datos actuales del producto para prellenar.
  const productState = useFetch(
    async () => (mode === 'edit' && productId ? productsService.getById(productId) : null),
    [mode, productId],
  );

  const product = productState.data;

  const initialValues = useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product ? String(product.price) : '',
      stock: product ? String(product.stock) : '',
      categoryId: presetCategoryId ?? product?.categoryId ?? '',
      imagesText: product?.images?.map((image) => image.url).join('\n') ?? '',
    }),
    [product, presetCategoryId],
  );

  const {
    values,
    errors,
    generalError,
    submitting,
    setFieldValue,
    handleSubmit,
  } = useForm<ProductFormValues>({
    initialValues,
    validate: (vals) => {
      const result: Partial<Record<keyof ProductFormValues, string>> = {};
      if (vals.name.trim().length < 2) {
        result.name = 'El nombre debe tener al menos 2 caracteres.';
      }
      if (!vals.categoryId) {
        result.categoryId = 'Selecciona una categoría.';
      }
      const price = Number(vals.price);
      if (vals.price.trim() === '' || Number.isNaN(price) || price <= 0) {
        result.price = 'Ingresa un precio mayor a 0.';
      } else if (!/^\d+(\.\d{1,2})?$/.test(vals.price.trim())) {
        result.price = 'Máximo dos decimales.';
      }
      const stock = Number(vals.stock);
      if (
        vals.stock.trim() === '' ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        result.stock = 'Ingresa un inventario entero igual o mayor a 0.';
      }
      const invalidUrl = vals.imagesText
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0 && !URL_PATTERN.test(line));
      if (invalidUrl) {
        result.imagesText = `Cada imagen debe ser una URL http(s) válida. Revisa: ${invalidUrl.slice(0, 60)}`;
      }
      return result;
    },
    onSubmit: async (vals) => {
      const images = vals.imagesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (mode === 'create') {
        const created = await productsService.create({
          name: vals.name.trim(),
          description: vals.description.trim() || undefined,
          price: Number(vals.price),
          stock: Number(vals.stock),
          categoryId: vals.categoryId,
          images: images.length > 0 ? images : undefined,
        });
        onSaved?.(created);
        navigate(`/products/${created.id}`);
        return;
      }

      if (productId) {
        const updated = await productsService.update(productId, {
          name: vals.name.trim(),
          description: vals.description.trim() || undefined,
          price: Number(vals.price),
          stock: Number(vals.stock),
          categoryId: vals.categoryId,
          images: images.length > 0 ? images : [],
        });
        onSaved?.(updated);
        navigate(`/products/${updated.id}`);
      }
    },
  });

  if (mode === 'edit') {
    if (productState.loading) return <p className="muted">Cargando producto…</p>;
    if (productState.error || !product) {
      return (
        <div className="alert alert--error" role="alert">
          No se pudieron cargar los datos del producto para editarlos.
        </div>
      );
    }
  }

  const previewUrls = values.imagesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="product-name">Nombre</label>
        <input
          id="product-name"
          name="name"
          type="text"
          placeholder="Audífonos inalámbricos XT200"
          value={values.name}
          onChange={(e) => setFieldValue('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="product-description">Descripción</label>
        <textarea
          id="product-description"
          name="description"
          rows={3}
          placeholder="Describe el producto…"
          value={values.description}
          onChange={(e) => setFieldValue('description', e.target.value)}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="product-price">Precio (COP)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="129900"
            value={values.price}
            onChange={(e) => setFieldValue('price', e.target.value)}
            aria-invalid={Boolean(errors.price)}
          />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </div>

        <div className="field">
          <label htmlFor="product-stock">Inventario</label>
          <input
            id="product-stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            placeholder="25"
            value={values.stock}
            onChange={(e) => setFieldValue('stock', e.target.value)}
            aria-invalid={Boolean(errors.stock)}
          />
          {errors.stock && <span className="field-error">{errors.stock}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="product-category">Categoría</label>
        <select
          id="product-category"
          name="categoryId"
          value={values.categoryId}
          disabled={Boolean(presetCategoryId)}
          onChange={(e) => setFieldValue('categoryId', e.target.value)}
          aria-invalid={Boolean(errors.categoryId)}
        >
          <option value="">
            {categoriesState.loading ? 'Cargando categorías…' : 'Selecciona una categoría'}
          </option>
          {(categoriesState.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {presetCategoryId && (
          <small className="field-hint">
            Categoría definida por la vista desde donde llegaste.
          </small>
        )}
        {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
      </div>

      <div className="field">
        <label htmlFor="product-images">Imágenes (una URL por línea)</label>
        <textarea
          id="product-images"
          name="imagesText"
          rows={3}
          placeholder={'https://example.com/foto1.jpg\nhttps://example.com/foto2.jpg'}
          value={values.imagesText}
          onChange={(e) => setFieldValue('imagesText', e.target.value)}
          aria-invalid={Boolean(errors.imagesText)}
        />
        {errors.imagesText && <span className="field-error">{errors.imagesText}</span>}
        <small className="field-hint">
          Hasta 10 URLs. Si una imagen no carga, la interfaz muestra un placeholder.
        </small>

        {previewUrls.length > 0 && (
          <div className="image-preview" aria-label="Vista previa de imágenes">
            {previewUrls.map((url) => (
              <SafeImage key={url} src={url} alt="Vista previa" className="image-preview__item" />
            ))}
          </div>
        )}
      </div>

      {generalError && (
        <div className="alert alert--error" role="alert">
          {generalError}
        </div>
      )}

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting
          ? 'Guardando…'
          : mode === 'create'
            ? 'Crear producto'
            : 'Guardar cambios'}
      </button>
    </form>
  );
}
