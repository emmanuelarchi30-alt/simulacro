import { CategoryForm } from '../components/forms/CategoryForm';
import { useAuth } from '../hooks';

/**
 * Ruta exclusiva de admin (protegida con RequireRole en el router):
 * un usuario `user` que escriba la URL directa es redirigido al inicio.
 */
export function NewCategoryPage() {
  const { user } = useAuth();

  return (
    <section className="narrow">
      <header className="page-header">
        <div>
          <h1>Nueva categoría</h1>
          <p className="muted">Sesión de {user?.name} · rol admin</p>
        </div>
      </header>
      <div className="card card--form">
        <CategoryForm />
      </div>
    </section>
  );
}
