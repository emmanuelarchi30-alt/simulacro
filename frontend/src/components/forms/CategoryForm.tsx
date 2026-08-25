import { useNavigate } from 'react-router-dom';
import { categoriesService } from '../../services';
import { useForm } from '../../hooks';

interface CategoryFormValues extends Record<string, unknown> {
  name: string;
  description: string;
}

/**
 * Formulario controlado de creación de categorías (solo admin).
 * Muestra los errores del servidor junto al campo correspondiente,
 * p. ej. 409 "Ya existe una categoría con este nombre" → error en `name`.
 */
export function CategoryForm() {
  const navigate = useNavigate();

  const { values, errors, generalError, submitting, setFieldValue, handleSubmit } =
    useForm<CategoryFormValues>({
      initialValues: { name: '', description: '' },
      validate: (vals) => ({
        name:
          vals.name.trim().length < 2
            ? 'El nombre debe tener al menos 2 caracteres.'
            : vals.name.trim().length > 100
              ? 'El nombre no puede superar 100 caracteres.'
              : undefined,
        description:
          vals.description.trim().length > 255
            ? 'La descripción no puede superar 255 caracteres.'
            : undefined,
      }),
      onSubmit: async (vals) => {
        await categoriesService.create({
          name: vals.name.trim(),
          description: vals.description.trim() || undefined,
        });
        navigate('/categories', { replace: true });
      },
    });

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="category-name">Nombre de la categoría</label>
        <input
          id="category-name"
          name="name"
          type="text"
          placeholder="Electrónica"
          value={values.name}
          onChange={(e) => setFieldValue('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="category-description">Descripción (opcional)</label>
        <textarea
          id="category-description"
          name="description"
          rows={3}
          placeholder="Dispositivos y accesorios electrónicos"
          value={values.description}
          onChange={(e) => setFieldValue('description', e.target.value)}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      {generalError && (
        <div className="alert alert--error" role="alert">
          {generalError}
        </div>
      )}

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Crear categoría'}
      </button>
    </form>
  );
}
