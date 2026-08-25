import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Demo del Error Boundary (Módulo 6): este componente lanza un error
 * de renderizado real cuando se pulsa el botón; el ErrorBoundary que
 * envuelve la app lo captura y muestra el fallback con recarga.
 */
export function DemoCrashPage() {
  const [explode, setExplode] = useState(false);

  if (explode) {
    // Fallo intencional para demostrar la captura del Error Boundary.
    throw new Error('Fallo de renderizado intencional desde /demo-crash');
  }

  return (
    <section className="narrow">
      <div className="card card--form">
        <h1>Simulador de error de renderizado</h1>
        <p className="muted">
          Al pulsar el botón, este componente lanza una excepción durante el render.
          El Error Boundary global debería capturarla y mostrar un mensaje amigable
          en lugar de una pantalla en blanco.
        </p>
        <div className="detail__actions">
          <button type="button" className="btn btn--danger" onClick={() => setExplode(true)}>
            Provocar error ahora
          </button>
          <Link to="/products" className="btn btn--ghost">
            Volver a productos
          </Link>
        </div>
      </div>
    </section>
  );
}
