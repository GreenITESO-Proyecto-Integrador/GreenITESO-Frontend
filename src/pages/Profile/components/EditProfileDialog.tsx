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
  Upload,
  Link2,
} from 'lucide-react';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import {
  isUploadedAvatarUrl,
  updateEcologicalProfile,
  uploadProfileAvatar,
} from '@/lib/api/ecological-profile';
import { toFriendlyMessage } from '@/lib/api/errors';
import { validateImageFile } from '@/lib/api/upload';
import { getUserInitials } from '@/lib/user-initials';
import type { EcologicalProfile, ProfileVisibility } from '@/types/ecological-profile';

// Mirrors the backend's avatar_url rules (accounts.serializers._validate_avatar_url).
const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_AVATAR_URL_LENGTH = 500;
const MAX_BIO_LENGTH = 500;
const CLOSE_AFTER_SAVE_MS = 700;

type PreviewStatus = 'loading' | 'loaded' | 'failed';

/** The pasted link the form starts from; an uploaded photo has none. */
function initialLink(profile: EcologicalProfile): string {
  return isUploadedAvatarUrl(profile.avatarUrl) ? '' : (profile.avatarUrl ?? '');
}

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

/**
 * Bio length as the backend measures it: DRF trims whitespace, then Python's len()
 * counts code points, so an emoji is one character rather than two UTF-16 units.
 */
function getBioLength(value: string): number {
  return [...value.trim()].length;
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
  // Esc, the close button and a click outside are ignored while a save is in flight.
  // Otherwise the modal could be reopened with the pre-save values and a later save
  // would silently revert the one still in flight.
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);
  // Bumped each time the modal opens or closes, so a save that settles after the
  // modal moved on (e.g. the parent closed it) can't touch the new session.
  const sessionRef = useRef(0);

  // Form states
  const [bio, setBio] = useState(profile.bio ?? '');
  const [visibility, setVisibility] = useState<ProfileVisibility>(profile.visibility);
  const [avatarUrl, setAvatarUrl] = useState(initialLink(profile));
  const [isLinkOpen, setIsLinkOpen] = useState(initialLink(profile) !== '');
  // A photo picked from the device; it is only uploaded when the form is saved.
  const [avatarFile, setAvatarFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [avatarFileError, setAvatarFileError] = useState<string | null>(null);
  // "Quitar" on an uploaded photo, which has no link to clear.
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    sessionRef.current += 1;
    // A close scheduled by an earlier save must not close a reopened modal.
    clearTimeout(closeTimerRef.current);
    if (!open) return;
    const current = profileRef.current;
    setBio(current.bio ?? '');
    setVisibility(current.visibility);
    setAvatarUrl(initialLink(current));
    setIsLinkOpen(initialLink(current) !== '');
    setAvatarFile(null);
    setAvatarFileError(null);
    setIsAvatarRemoved(false);
    setPreview(null);
    setBioError(null);
    setStatusMessage(null);

    const prefs = current.preferences ?? {};
    setNotifyImpact(prefs.notify_impact !== false);
    setNotifyCampaigns(prefs.notify_campaigns !== false);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Free the picked file's preview once it is replaced or the modal closes.
  const avatarPreviewUrl = avatarFile?.previewUrl;
  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    },
    [avatarPreviewUrl],
  );

  const initials = getUserInitials(
    `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email || 'U',
  );

  const trimmedAvatarUrl = avatarUrl.trim();
  const avatarFormatError = validateAvatarUrl(trimmedAvatarUrl);
  const hasUploadedAvatar = isUploadedAvatarUrl(profile.avatarUrl);
  const avatarChanged = trimmedAvatarUrl !== initialLink(profile);
  // What the preview shows: the picked file, else the typed link, else the
  // current uploaded photo unless it was removed.
  const previewSrc =
    avatarFile?.previewUrl ??
    (trimmedAvatarUrl !== ''
      ? trimmedAvatarUrl
      : hasUploadedAvatar && !isAvatarRemoved
        ? (profile.avatarUrl ?? '')
        : '');
  const previewStatus: PreviewStatus = preview?.url === previewSrc ? preview.status : 'loading';
  const linkPreviewed = !avatarFile && trimmedAvatarUrl !== '';
  // A new link is only saved once the browser could actually load it, so a broken
  // link never reaches other users. An unchanged link never blocks other edits.
  const avatarBlocksSave =
    linkPreviewed && avatarChanged && (avatarFormatError !== null || previewStatus !== 'loaded');
  const showPreviewImage = previewSrc !== '' && (!linkPreviewed || avatarFormatError === null);
  // A picked file is uploaded on its own request; otherwise a changed link, or
  // removing an uploaded photo, goes in the PATCH ("" clears either kind).
  const avatarUrlPatch = avatarFile
    ? undefined
    : avatarChanged
      ? trimmedAvatarUrl
      : isAvatarRemoved && hasUploadedAvatar
        ? ''
        : undefined;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a removal.
    e.target.value = '';
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarFileError(validation.error ?? 'Archivo no válido.');
      return;
    }
    setAvatarFileError(null);
    setAvatarFile({ file, previewUrl: URL.createObjectURL(file) });
    setAvatarUrl('');
    setIsAvatarRemoved(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarFileError(null);
    setAvatarUrl('');
    setIsAvatarRemoved(true);
  };

  const handleLinkChange = (value: string) => {
    setAvatarUrl(value);
    setAvatarFile(null);
    setAvatarFileError(null);
  };
  const bioLength = getBioLength(bio);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBio(value);
    if (getBioLength(value) > MAX_BIO_LENGTH) {
      setBioError(`La biografía no puede exceder los ${MAX_BIO_LENGTH} caracteres.`);
    } else {
      setBioError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // A click that lands while the modal is already closing must not start a save
    // the user can no longer see (and could reopen over with stale values).
    if (!open) return;
    setStatusMessage(null);

    if (bioLength > MAX_BIO_LENGTH) {
      setBioError(`La biografía no puede exceder los ${MAX_BIO_LENGTH} caracteres.`);
      return;
    }
    if (avatarBlocksSave) {
      return;
    }

    const session = sessionRef.current;
    // A new save cancels the auto-close scheduled by a previous one, which would
    // otherwise close the modal while this save is still in flight.
    clearTimeout(closeTimerRef.current);
    setBusy(true);
    setIsSubmitting(true);

    let photoSaved = false;
    try {
      // Spread the stored preferences so keys this form doesn't edit (e.g. theme) survive.
      const updatedPreferences: Record<string, unknown> = {
        ...(profile.preferences ?? {}),
        notify_impact: notifyImpact,
        notify_campaigns: notifyCampaigns,
      };

      if (avatarFile) {
        // The upload goes first, so a failed upload saves nothing. Once it succeeds the photo
        // stays saved even if the PATCH below fails: drop the picked file so a retry only
        // re-sends the other fields instead of uploading the photo again.
        const withPhoto = await uploadProfileAvatar(avatarFile.file);
        photoSaved = true;
        onProfileUpdated(withPhoto);
        if (session === sessionRef.current) setAvatarFile(null);
      }

      const updated = await updateEcologicalProfile({
        bio: bio.trim(),
        visibility,
        preferences: updatedPreferences,
        avatarUrl: avatarUrlPatch,
      });

      // The saved profile is still the latest server state, even if the modal moved on.
      onProfileUpdated(updated);
      if (session !== sessionRef.current) return;

      setStatusMessage({
        type: 'success',
        text: '¡Perfil actualizado correctamente!',
      });

      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        handleOpenChange(false);
      }, CLOSE_AFTER_SAVE_MS);
    } catch (err) {
      if (session !== sessionRef.current) return;
      const reason = toFriendlyMessage(err, 'Ocurrió un error al actualizar el perfil.');
      setStatusMessage({
        type: 'error',
        text: photoSaved
          ? `La foto se actualizó, pero no se guardaron los demás cambios: ${reason}`
          : reason,
      });
    } finally {
      setBusy(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-700/50 dark:text-emerald-300'
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
          {/* Profile photo: upload from the device, or paste a link */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Foto de perfil</p>
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden border-2 border-border">
                {showPreviewImage ? (
                  <img
                    key={previewSrc}
                    src={previewSrc}
                    alt="Previsualización"
                    className={previewStatus === 'loaded' ? 'size-full object-cover' : 'hidden'}
                    onLoad={() => setPreview({ url: previewSrc, status: 'loaded' })}
                    onError={() => setPreview({ url: previewSrc, status: 'failed' })}
                  />
                ) : null}
                {!showPreviewImage || previewStatus !== 'loaded' ? (
                  <span aria-hidden="true">{initials}</span>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                    data-testid="profile-avatar-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 items-center gap-1.5 rounded-xl font-semibold cursor-pointer"
                  >
                    <Upload className="size-4" />
                    <span>Subir foto</span>
                  </Button>
                  {previewSrc ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="flex h-11 items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl font-medium"
                    >
                      <Trash2 className="size-4" />
                      <span>Quitar</span>
                    </Button>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  {avatarFile
                    ? `Se subirá «${avatarFile.file.name}» al guardar.`
                    : 'JPG, PNG o WEBP de máximo 5 MB.'}
                </p>
                {avatarFileError ? (
                  <p
                    role="alert"
                    className="text-xs text-destructive font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="size-3.5" />
                    <span>{avatarFileError}</span>
                  </p>
                ) : null}

                {isLinkOpen ? (
                  <div className="space-y-1.5 pt-1">
                    <Label
                      htmlFor="profile-avatar-url"
                      className="text-xs font-semibold text-foreground"
                    >
                      Enlace de la foto
                    </Label>
                    <Input
                      id="profile-avatar-url"
                      type="url"
                      inputMode="url"
                      value={avatarUrl}
                      onChange={e => handleLinkChange(e.target.value)}
                      placeholder="https://…/mi-foto.jpg"
                      aria-invalid={
                        avatarChanged && avatarBlocksSave && previewStatus !== 'loading'
                      }
                      className="h-11 rounded-xl"
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setIsLinkOpen(true)}
                    className="h-auto gap-1 px-0 text-xs text-primary-700 dark:text-primary-300 cursor-pointer"
                  >
                    <Link2 className="size-3.5" />
                    Usar un enlace
                  </Button>
                )}

                {linkPreviewed && avatarChanged && avatarFormatError ? (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    <span>{avatarFormatError}</span>
                  </p>
                ) : null}
                {linkPreviewed &&
                avatarChanged &&
                showPreviewImage &&
                previewStatus === 'loading' ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    <span>Cargando vista previa…</span>
                  </p>
                ) : null}
                {linkPreviewed &&
                avatarChanged &&
                showPreviewImage &&
                previewStatus === 'failed' ? (
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
                  bioLength > MAX_BIO_LENGTH
                    ? 'text-destructive font-bold'
                    : 'text-muted-foreground'
                }`}
              >
                {bioLength} / {MAX_BIO_LENGTH}
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
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/30 ring-2 ring-primary-500/20'
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
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/30 ring-2 ring-primary-500/20'
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
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-300">
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
                  <div className="flex size-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-300">
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
