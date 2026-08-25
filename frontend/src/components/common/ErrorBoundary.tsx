import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Única otra clase del proyecto: React todavía exige class components
 * para `getDerivedStateFromError`/`componentDidCatch`.
 * Captura errores de renderizado y muestra un fallback con recarga,
 * evitando la pantalla en blanco.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Registro para diagnóstico; la UI ya está cubierta por el fallback.
    console.error('[ErrorBoundary] Error de renderizado:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      return (
        <div className="error-boundary" role="alert">
          <span className="error-boundary__icon" aria-hidden="true">💥</span>
          <h1>Algo se rompió en la interfaz</h1>
          <p>
            Ocurrió un error inesperado al mostrar esta sección. No es culpa tuya:
            puedes recargar la página o volver al inicio.
          </p>
          <details>
            <summary>Detalles técnicos</summary>
            <code>{error.message}</code>
          </details>
          <div className="error-boundary__actions">
            <button type="button" className="btn btn--primary" onClick={this.handleReload}>
              Recargar página
            </button>
            <a className="btn btn--ghost" href="/">
              Volver al inicio
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
