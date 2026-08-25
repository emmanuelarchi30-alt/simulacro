import { Link, useParams } from 'react-router-dom';
import { ProductForm } from '../components/forms/ProductForm';
import { useFetch } from '../hooks';
import { categoriesService } from '../services';

interface ProductFormPageProps {
  mode: 'create' | 'edit';
}

/**
 * Página contenedora del formulario único de producto.
 * - /products/new → mode create sin categoría predefinida.
 * - /categories/:categoryId/products/new → create con `presetCategoryId`
 *   (el select queda precargado y deshabilitado).
 * - /products/:id/edit → mode edit.
 */
export function ProductFormPage({ mode }: ProductFormPageProps) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const presetCategoryId = mode === 'create' ? categoryId : undefined;

  const categoryState = useFetch(
    async () => (presetCategoryId ? categoriesService.getById(presetCategoryId) : null),
    [presetCategoryId],
  );

  const title =
    mode === 'edit'
      ? 'Editar producto'
      : presetCategoryId
        ? `Nuevo producto en ${categoryState.data?.name ?? 'categoría'}`
        : 'Nuevo producto';

  return (
    <section className="narrow">
      <nav className="breadcrumbs" aria-label="Migas de pan">
        {presetCategoryId ? (
          <>
            <Link to={`/categories/${presetCategoryId}`}>← Volver a la categoría</Link>
          </>
        ) : (
          <Link to="/products">← Volver a productos</Link>
        )}
      </nav>

      <header className="page-header">
        <h1>{title}</h1>
      </header>

      <div className="card card--form">
        <ProductForm
          key={mode + (presetCategoryId ?? '')}
          mode={mode}
          presetCategoryId={presetCategoryId}
        />
      </div>
    </section>
  );
}
