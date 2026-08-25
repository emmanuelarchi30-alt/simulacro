import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useForm } from '../../hooks';
import { useToast } from '../../hooks';

interface LoginFormValues extends Record<string, unknown> {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/**
 * Formulario controlado de inicio de sesión.
 * Los errores del servidor (401 credenciales inválidas, red caída…)
 * se muestran dentro del formulario vía el hook `useForm`.
 */
export function LoginForm() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? '/products';

  const { values, errors, generalError, submitting, setFieldValue, handleSubmit } =
    useForm<LoginFormValues>({
      initialValues: { email: '', password: '' },
      validate: (vals) => ({
        email: !EMAIL_PATTERN.test(vals.email.trim()) ? 'Ingresa un correo válido.' : undefined,
        password: vals.password.length === 0 ? 'La contraseña es obligatoria.' : undefined,
      }),
      onSubmit: async (vals) => {
        await login({ email: vals.email.trim(), password: vals.password });
        showToast('¡Bienvenido de vuelta!', 'success');
        navigate(from, { replace: true });
      },
    });

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={values.email}
          onChange={(e) => setFieldValue('email', e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={(e) => setFieldValue('password', e.target.value)}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      {generalError && (
        <div className="alert alert--error" role="alert">
          {generalError}
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Ingresando…' : 'Iniciar sesión'}
      </button>

      <p className="form__hint">
        Cuenta admin de prueba: <code>admin@examen.com</code> / <code>Admin123!</code>
      </p>
      <p className="form__footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </form>
  );
}
