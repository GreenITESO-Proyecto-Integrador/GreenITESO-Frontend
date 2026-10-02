import { useEffect, useRef, useState } from 'react';
import {
  Camera,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateEcologicalProfile } from '@/lib/api/ecological-profile';
import type { EcologicalProfile, ProfileVisibility } from '@/types/ecological-profile';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BIO_LENGTH = 500;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [bio, setBio] = useState(profile.bio ?? '');
  const [visibility, setVisibility] = useState<ProfileVisibility>(profile.visibility);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Preferences states
  const initialPrefs = (profile.preferences ?? {}) as Record<string, unknown>;
  const [notifyImpact, setNotifyImpact] = useState<boolean>(initialPrefs.notify_impact !== false);
  const [notifyCampaigns, setNotifyCampaigns] = useState<boolean>(
    initialPrefs.notify_campaigns !== false,
  );
  const [preferredTheme, setPreferredTheme] = useState<string>(
    typeof initialPrefs.theme === 'string' ? initialPrefs.theme : 'system',
  );

  // Validation & status states
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or profile changes
  useEffect(() => {
    if (open) {
      setBio(profile.bio ?? '');
      setVisibility(profile.visibility);
      setAvatarUrl(profile.avatarUrl ?? '');
      setAvatarPreview(profile.avatarUrl || null);
      setAvatarFile(null);
      setAvatarError(null);
      setBioError(null);
      setStatusMessage(null);

      const prefs = (profile.preferences ?? {}) as Record<string, unknown>;
      setNotifyImpact(prefs.notify_impact !== false);
      setNotifyCampaigns(prefs.notify_campaigns !== false);
      setPreferredTheme(typeof prefs.theme === 'string' ? prefs.theme : 'system');
    }
  }, [open, profile]);

  const initials =
    (profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '') ||
    profile.email?.[0]?.toUpperCase() ||
    'U';

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setAvatarError('Formato no válido. Usa una imagen JPG, PNG o WEBP.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('La imagen no puede exceder los 5 MB.');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Prepare avatar url compliant with backend validation rules
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    setAvatarUrl(
      `https://storage.googleapis.com/greeniteso-dev-objects/avatars/${profile.userId}.${extension}`,
    );
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl('');
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    // Validate bio
    if (bio.length > MAX_BIO_LENGTH) {
      setBioError(`La biografía no puede exceder los ${MAX_BIO_LENGTH} caracteres.`);
      return;
    }

    // Validate avatar url if manually entered
    if (avatarUrl && !avatarUrl.startsWith('https://')) {
      setAvatarError('La URL del avatar debe comenzar con https://');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPreferences: Record<string, unknown> = {
        ...((profile.preferences ?? {}) as Record<string, unknown>),
        notify_impact: notifyImpact,
        notify_campaigns: notifyCampaigns,
        theme: preferredTheme,
      };

      const updated = await updateEcologicalProfile({
        bio: bio.trim(),
        visibility,
        preferences: updatedPreferences,
        avatarUrl: avatarUrl.trim(),
      });

      setStatusMessage({
        type: 'success',
        text: '¡Perfil actualizado correctamente!',
      });

      onProfileUpdated(updated);

      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ocurrió un error al actualizar el perfil.',
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
          {/* Avatar Upload with Live Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Foto de perfil</Label>
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden border-2 border-border">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Previsualización"
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  id="avatar-file-input"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 cursor-pointer rounded-xl font-medium"
                  >
                    <Camera className="size-4 text-primary-600" />
                    <span>{avatarPreview ? 'Cambiar foto' : 'Subir foto'}</span>
                  </Button>

                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl font-medium"
                    >
                      <Trash2 className="size-4" />
                      <span>Quitar</span>
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  JPG, PNG o WEBP. Tamaño máximo 5 MB.
                </p>
                {avatarFile && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {avatarError && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    <span>{avatarError}</span>
                  </p>
                )}
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
              disabled={isSubmitting || Boolean(bioError) || Boolean(avatarError)}
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
