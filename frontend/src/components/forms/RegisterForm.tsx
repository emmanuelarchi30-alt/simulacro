import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks';
import { useToast } from '../../hooks';
import { authService } from '../../services';

interface RegisterFormValues extends Record<string, unknown> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** Formulario controlado de registro; valida en cliente y refleja errores del servidor (400/409).
 * El registro NO inicia sesión: solo confirma la cuenta y redirige a /login. */
export function RegisterForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { values, errors, generalError, submitting, setFieldValue, handleSubmit } =
    useForm<RegisterFormValues>({
      initialValues: { name: '', email: '', password: '', confirmPassword: '' },
      validate: (vals) => ({
        name:
          vals.name.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : undefined,
        email: !EMAIL_PATTERN.test(vals.email.trim())
          ? 'Ingresa un correo válido.'
          : undefined,
        password:
          vals.password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.' : undefined,
        confirmPassword:
          vals.confirmPassword !== vals.password ? 'Las contraseñas no coinciden.' : undefined,
      }),
      onSubmit: async (vals) => {
        await authService.register({
          name: vals.name.trim(),
          email: vals.email.trim(),
          password: vals.password,
        });
        showToast('Usuario creado. Inicia sesión para entrar.', 'success');
        navigate('/login', { replace: true });
      },
    });

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="register-name">Nombre completo</label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Ana Pérez"
          value={values.name}
          onChange={(e) => setFieldValue('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="register-email">Correo electrónico</label>
        <input
          id="register-email"
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
        <label htmlFor="register-password">Contraseña</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={values.password}
          onChange={(e) => setFieldValue('password', e.target.value)}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      <div className="field">
        <label htmlFor="register-confirm">Confirmar contraseña</label>
        <input
          id="register-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={values.confirmPassword}
          onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
      </div>

      {generalError && (
        <div className="alert alert--error" role="alert">
          {generalError}
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="form__footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
