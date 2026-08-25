import { useMemo, useState } from 'react';
import { useAuth } from '../hooks';
import { useToast } from '../hooks';
import { SafeImage } from '../components/common/SafeImage';
import { toAppError } from '../lib/errors';

/** Iniciales para el fallback cuando no hay foto o la imagen falla. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Perfil del usuario autenticado: edición de nombre y foto de perfil.
 * La foto se maneja como URL (misma filosofía que las imágenes de producto:
 * no hay subida de archivos en el alcance).
 */
export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Estado inicial derivado del usuario en memoria (RequireAuth garantiza sesión);
  // tras guardar, los campos conservan lo escrito (mejor UX que resetear).
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Vista previa en vivo: solo si lo escrito parece una URL http(s). */
  const previewAvatar: string | null = useMemo(() => {
    const value = avatarUrl.trim();
    return /^https?:\/\/\S+$/i.test(value) ? value : null;
  }, [avatarUrl]);

  if (!user) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedAvatar = avatarUrl.trim();

    if (trimmedName.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (trimmedAvatar && !/^https?:\/\/\S+$/i.test(trimmedAvatar)) {
      setFormError('La foto de perfil debe ser una URL válida que empiece por http(s)://, o dejarse vacía.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: trimmedName,
        // Vacío = quitar la foto (null en la API).
        avatar: trimmedAvatar || null,
      });
      showToast('Perfil actualizado correctamente.', 'success');
    } catch (error) {
      setFormError(toAppError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile">
      <div className="auth-card profile__card" role="region" aria-label="Mi perfil">
        <div className="profile__header">
          <span className="avatar avatar--lg">
            {previewAvatar ? (
              <SafeImage src={previewAvatar} alt={`Foto de ${user.name}`} className="avatar__img" />
            ) : (
              <span aria-hidden="true">{initialsOf(user.name)}</span>
            )}
          </span>
          <div>
            <h1>Mi perfil</h1>
            <p className="profile__email">{user.email}</p>
          </div>
        </div>

        {formError && (
          <div className="alert alert--error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>

          <label className="field">
            <span>Foto de perfil (URL de imagen)</span>
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://ejemplo.com/mi-foto.jpg"
            />
            <small>Pega el enlace de una imagen. Déjalo vacío para quitar la foto.</small>
          </label>

          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
