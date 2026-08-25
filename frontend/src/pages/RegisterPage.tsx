import { RegisterForm } from '../components/forms/RegisterForm';

export function RegisterPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Crear cuenta</h1>
        <p className="muted">Regístrate como usuario para ver y seleccionar favoritos y gestión de productos.</p>
        <RegisterForm />
      </div>
    </section>
  );
}
