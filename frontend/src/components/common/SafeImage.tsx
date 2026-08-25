import { useState } from 'react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/**
 * `<img>` tolerante a fallos: si la URL es inválida o no carga,
 * muestra un placeholder y nunca rompe el layout.
 */
export function SafeImage({ src, alt, className }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src ?? null);

  // Ajuste de estado derivado durante el render (patrón oficial de React):
  // si llega una URL nueva, reintentamos mostrar la imagen.
  if ((src ?? null) !== lastSrc) {
    setLastSrc(src ?? null);
    setFailed(false);
  }

  if (!src || failed) {
    return (
      <div className={`img-placeholder ${className ?? ''}`} role="img" aria-label={alt}>
        <span aria-hidden="true">🖼️</span>
        <small>Imagen no disponible</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
