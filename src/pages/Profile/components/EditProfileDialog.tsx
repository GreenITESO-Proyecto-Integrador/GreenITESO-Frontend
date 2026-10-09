import { useEffect, useRef, useState } from 'react';
import {
  Trash2,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Bell,
  SunMoon,
} from 'lucide-react';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateEcologicalProfile } from '@/lib/api/ecological-profile';
import { toFriendlyMessage } from '@/lib/api/errors';
import type { EcologicalProfile, ProfileVisibility } from '@/types/ecological-profile';

// Mirrors the backend's avatar_url rules (accounts.serializers._validate_avatar_url).
const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_AVATAR_URL_LENGTH = 500;
const MAX_BIO_LENGTH = 500;
const CLOSE_AFTER_SAVE_MS = 700;

type PreviewStatus = 'loading' | 'loaded' | 'failed';

/**
 * Validate an avatar URL the same way the backend does. Returns a Spanish error, or null.
 */
function validateAvatarUrl(value: string): string | null {
  if (!value) return null;
  if (value.length > MAX_AVATAR_URL_LENGTH) {
    return `La URL no puede exceder los ${MAX_AVATAR_URL_LENGTH} caracteres.`;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return 'Ingresa una URL válida.';
  }
  if (parsed.protocol !== 'https:') {
    return 'La URL de la foto debe usar https://.';
  }
  const path = parsed.pathname.toLowerCase();
  if (!ALLOWED_AVATAR_EXTENSIONS.some(extension => path.endsWith(extension))) {
    return 'La URL de la foto debe terminar en .jpg, .jpeg, .png o .webp.';
  }
  return null;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: EcologicalProfile;
  onProfileUpdated: (updatedProfile: EcologicalProfile) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Form states
  const [bio, setBio] = useState(profile.bio ?? '');
  const [visibility, setVisibility] = useState<ProfileVisibility>(profile.visibility);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  // Load result of the preview image, tagged with the URL it belongs to so a stale
  // result never applies to a newly typed URL.
  const [preview, setPreview] = useState<{ url: string; status: PreviewStatus } | null>(null);

  // Preferences states
  const initialPrefs = profile.preferences ?? {};
  const [notifyImpact, setNotifyImpact] = useState<boolean>(initialPrefs.notify_impact !== false);
  const [notifyCampaigns, setNotifyCampaigns] = useState<boolean>(
    initialPrefs.notify_campaigns !== false,
  );

  // Validation & status states
  const [bioError, setBioError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset the form each time the modal opens. Not on every profile change: saving
  // updates the profile while the modal is still open, and that must not wipe the
  // success message.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  useEffect(() => {
    if (!open) return;
    const current = profileRef.current;
    setBio(current.bio ?? '');
    setVisibility(current.visibility);
    setAvatarUrl(current.avatarUrl ?? '');
    setPreview(null);
    setBioError(null);
    setStatusMessage(null);

    const prefs = current.preferences ?? {};
    setNotifyImpact(prefs.notify_impact !== false);
    setNotifyCampaigns(prefs.notify_campaigns !== false);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const initials =
    (profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '') ||
    profile.email?.[0]?.toUpperCase() ||
    'U';

  const trimmedAvatarUrl = avatarUrl.trim();
  const avatarFormatError = validateAvatarUrl(trimmedAvatarUrl);
  const previewStatus: PreviewStatus =
    preview?.url === trimmedAvatarUrl ? preview.status : 'loading';
  const avatarChanged = trimmedAvatarUrl !== (profile.avatarUrl ?? '');
  // A new URL is only saved once the browser could actually load it, so a broken
  // link never reaches other users. An unchanged URL never blocks other edits.
  const avatarBlocksSave =
    avatarChanged &&
    trimmedAvatarUrl !== '' &&
    (avatarFormatError !== null || previewStatus !== 'loaded');
  const showPreviewImage = trimmedAvatarUrl !== '' && avatarFormatError === null;

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBio(value);
    if (value.length > MAX_BIO_LENGTH) {
      setBioError(`La biografía no puede exceder los ${MAX_BIO_LENGTH} caracteres.`);
    } else {
      setBioError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (bio.length > MAX_BIO_LENGTH) {
      setBioError(`La biografía no puede exceder los ${MAX_BIO_LENGTH} caracteres.`);
      return;
    }
    if (avatarBlocksSave) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Spread the stored preferences so keys this form doesn't edit (e.g. theme) survive.
      const updatedPreferences: Record<string, unknown> = {
        ...(profile.preferences ?? {}),
        notify_impact: notifyImpact,
        notify_campaigns: notifyCampaigns,
      };

      const updated = await updateEcologicalProfile({
        bio: bio.trim(),
        visibility,
        preferences: updatedPreferences,
        avatarUrl: avatarChanged ? trimmedAvatarUrl : undefined,
      });

      setStatusMessage({
        type: 'success',
        text: '¡Perfil actualizado correctamente!',
      });

      onProfileUpdated(updated);

      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        onOpenChange(false);
      }, CLOSE_AFTER_SAVE_MS);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: toFriendlyMessage(err, 'Ocurrió un error al actualizar el perfil.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-xl">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-foreground">Editar perfil</DialogTitle>
          <DialogDescription>
            Personaliza tu información pública, tu avatar y tus preferencias ecológicas.
          </DialogDescription>
        </DialogHeader>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            role="alert"
            className={`p-3 rounded-xl text-sm flex items-center gap-2 border font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar URL with Live Preview */}
          <div className="space-y-3">
            <Label htmlFor="profile-avatar-url" className="text-sm font-semibold text-foreground">
              Foto de perfil
            </Label>
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden border-2 border-border">
                {showPreviewImage ? (
                  <img
                    key={trimmedAvatarUrl}
                    src={trimmedAvatarUrl}
                    alt="Previsualización"
                    className={previewStatus === 'loaded' ? 'size-full object-cover' : 'hidden'}
                    onLoad={() => setPreview({ url: trimmedAvatarUrl, status: 'loaded' })}
                    onError={() => setPreview({ url: trimmedAvatarUrl, status: 'failed' })}
                  />
                ) : null}
                {!showPreviewImage || previewStatus !== 'loaded' ? (
                  <span aria-hidden="true">{initials}</span>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="profile-avatar-url"
                    type="url"
                    inputMode="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://…/mi-foto.jpg"
                    aria-invalid={avatarChanged && avatarBlocksSave && previewStatus !== 'loading'}
                    className="h-11 rounded-xl"
                  />
                  {avatarUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl('')}
                      className="flex h-11 items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl font-medium"
                    >
                      <Trash2 className="size-4" />
                      <span>Quitar</span>
                    </Button>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  Pega el enlace https de una imagen JPG, PNG o WEBP. La subida de archivos llegará
                  cuando se habilite el almacenamiento en la nube.
                </p>
                {avatarChanged && avatarFormatError ? (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    <span>{avatarFormatError}</span>
                  </p>
                ) : null}
                {avatarChanged && showPreviewImage && previewStatus === 'loading' ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    <span>Cargando vista previa…</span>
                  </p>
                ) : null}
                {avatarChanged && showPreviewImage && previewStatus === 'failed' ? (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    <span>No se pudo cargar la imagen. Verifica que el enlace sea público.</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bio Field with Char Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-bio" className="text-sm font-semibold text-foreground">
                Biografía
              </Label>
              <span
                className={`text-xs font-medium ${
                  bio.length > MAX_BIO_LENGTH
                    ? 'text-destructive font-bold'
                    : 'text-muted-foreground'
                }`}
              >
                {bio.length} / {MAX_BIO_LENGTH}
              </span>
            </div>
            <Textarea
              id="profile-bio"
              name="bio"
              value={bio}
              onChange={handleBioChange}
              placeholder="Comparte una breve descripción sobre ti, tu rol o tu compromiso ambiental..."
              rows={3}
              className="resize-none rounded-xl"
              aria-invalid={Boolean(bioError)}
            />
            {bioError && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                <span>{bioError}</span>
              </p>
            )}
          </div>

          {/* Visibility Choice */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Visibilidad del perfil</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Public option */}
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  visibility === 'PUBLIC'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/20'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div
                  className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                    visibility === 'PUBLIC'
                      ? 'bg-primary-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Globe className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Público</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Apareces en tablas de clasificación y ranking de clanes.
                  </p>
                </div>
              </button>

              {/* Private option */}
              <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  visibility === 'PRIVATE'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/20'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div
                  className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                    visibility === 'PRIVATE'
                      ? 'bg-primary-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Lock className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Privado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tus métricas e impacto solo son visibles por ti.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-sm font-semibold text-foreground">Preferencias ecológicas</Label>
            <div className="space-y-3">
              {/* Notify Impact toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Notificaciones de impacto
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avisos sobre tu racha y logros ambientales acumulados.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyImpact}
                  onChange={e => setNotifyImpact(e.target.checked)}
                  className="size-4.5 accent-primary-600 rounded cursor-pointer"
                />
              </label>

              {/* Notify Campaigns toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center">
                    <SunMoon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Nuevas campañas</p>
                    <p className="text-xs text-muted-foreground">
                      Recibir invitaciones a campañas de tu clan o globales.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCampaigns}
                  onChange={e => setNotifyCampaigns(e.target.checked)}
                  className="size-4.5 accent-primary-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Boolean(bioError) || avatarBlocksSave}
              className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold cursor-pointer min-w-32"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin mr-2" />
                  <span>Guardando…</span>
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Dialog>
  );
}
