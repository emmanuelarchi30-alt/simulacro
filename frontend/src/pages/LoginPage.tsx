import { useLocation } from 'react-router-dom';
import { LoginForm } from '../components/forms/LoginForm';

/** Pantalla de login. Si el usuario venía de una ruta protegida, LoginForm lo devuelve allí. */
export function LoginPage() {
  const location = useLocation();
  const from = (location.state as { from?: string; expired?: boolean } | null)?.from;

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        {from && (
          <p className="alert alert--info" role="note">
            Inicia sesión para continuar.
          </p>
        )}
        <LoginForm />
      </div>
    </section>
  );
}
