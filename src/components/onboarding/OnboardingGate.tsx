import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/campaigns/FieldError';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import { completeOnboarding, fetchCareers, fetchOnboardingState } from '@/lib/api/onboarding';
import { clearSession, getStoredUser } from '@/lib/auth/session';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

const OTHER_CAREER = '__other__';
const CAREER_MAX_LENGTH = 150;
const NICKNAME_MAX_LENGTH = 50;
/** Fields with their own error line; any other field error goes to the general alert. */
const FIELD_KEYS = ['career', 'nickname'];

const SELECT_CLASSES = cn(
  'h-11 w-full min-h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground transition-all',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none',
);

// Users already confirmed onboarded in this page load, so remounting the layout does not refetch.
const onboardedUserIds = new Set<string>();

function OnboardingForm({
  careers,
  careersFailed,
  onDone,
}: {
  careers: string[];
  careersFailed: boolean;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState(careers.length > 0 ? '' : OTHER_CAREER);
  const [otherCareer, setOtherCareer] = useState('');
  const [nickname, setNickname] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Blocks a second submit fired before React disables the button.
  const inFlight = useRef(false);

  const career = (selected === OTHER_CAREER ? otherCareer : selected).trim();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!career) found.career = 'Elige tu carrera.';
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      await completeOnboarding({
        career,
        ...(nickname.trim() ? { nickname: nickname.trim() } : {}),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      });
      onDone();
    } catch (error) {
      if (error instanceof ApiError) {
        const entries = Object.entries(error.fieldErrors);
        setErrors(Object.fromEntries(entries.filter(([key]) => FIELD_KEYS.includes(key))));
        const unrendered = entries.filter(([key]) => !FIELD_KEYS.includes(key));
        if (unrendered.length > 0) {
          setSubmitError(unrendered.map(([, message]) => message).join(' '));
        } else {
          setSubmitError(entries.length === 0 ? error.message : null);
        }
      } else {
        setSubmitError(toFriendlyMessage(error, 'No se pudo guardar tu carrera.'));
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-career">Carrera</Label>
        {careers.length > 0 ? (
          <select
            id="onboarding-career"
            value={selected}
            onChange={event => setSelected(event.target.value)}
            aria-invalid={errors.career && selected !== OTHER_CAREER ? true : undefined}
            className={SELECT_CLASSES}
          >
            <option value="">Selecciona tu carrera</option>
            {careers.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={OTHER_CAREER}>Mi carrera no está en la lista</option>
          </select>
        ) : null}
        {selected === OTHER_CAREER ? (
          <Input
            id={careers.length > 0 ? 'onboarding-other-career' : 'onboarding-career'}
            aria-label={careers.length > 0 ? 'Escribe tu carrera' : undefined}
            placeholder="Escribe el nombre de tu carrera"
            value={otherCareer}
            maxLength={CAREER_MAX_LENGTH}
            onChange={event => setOtherCareer(event.target.value)}
            aria-invalid={errors.career ? true : undefined}
            className="h-11 rounded-xl px-3"
            autoComplete="off"
          />
        ) : null}
        <p className="text-xs text-muted-foreground">
          Te une al clan de tu carrera. Tus acciones suman puntos a ese clan.
        </p>
        {careersFailed ? (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
            No se pudo cargar la lista de carreras. Escribe el nombre completo de tu carrera.
          </p>
        ) : null}
        <FieldError message={errors.career} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-nickname">Nickname (opcional)</Label>
        <Input
          id="onboarding-nickname"
          value={nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          onChange={event => setNickname(event.target.value)}
          aria-invalid={errors.nickname ? true : undefined}
          className="h-11 rounded-xl px-3"
          autoComplete="nickname"
        />
        <p className="text-xs text-muted-foreground">
          Es el nombre que verán los demás en rankings y clanes.
        </p>
        <FieldError message={errors.nickname} />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/30">
        <span>
          <span className="block text-sm font-semibold text-foreground">Perfil privado</span>
          <span className="block text-xs text-muted-foreground">
            No aparecerás en las tablas de clasificación.
          </span>
        </span>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={event => setIsPrivate(event.target.checked)}
          className="size-4.5 cursor-pointer rounded accent-primary-600"
        />
      </label>

      {submitError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
      >
        {submitting ? 'Guardando…' : 'Continuar'}
      </Button>
    </form>
  );
}

/**
 * Blocks the app with a required modal until the user declares a career (#163).
 * Without an institutional clan the backend rejects every action log. Admins are
 * skipped until the backend defines their case; everyone else can still sign out.
 */
export function OnboardingGate() {
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<string[] | null>(null);
  const [careersFailed, setCareersFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const userId = getStoredUser()?.id ?? '';
    if (isAdmin || onboardedUserIds.has(userId)) return;
    let cancelled = false;
    async function load() {
      try {
        const state = await fetchOnboardingState();
        if (!state.needsOnboarding) {
          onboardedUserIds.add(userId);
          return;
        }
        let options: string[] = [];
        let failed = false;
        try {
          options = await fetchCareers();
        } catch {
          failed = true;
        }
        if (!cancelled) {
          setCareers(options);
          setCareersFailed(failed);
          setOpen(true);
        }
      } catch {
        // A failed check must not lock the app; the action form still reports the error.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!open || careers === null) return null;

  function handleDone() {
    onboardedUserIds.add(getStoredUser()?.id ?? '');
    // Pages already loaded the profile without a clan; reload so they show the new one.
    window.location.reload();
  }

  function handleSignOut() {
    clearSession();
    setOpen(false);
    navigate('/login');
  }

  return (
    // Required step: escape and outside clicks do not close it.
    <Dialog open onOpenChange={() => undefined} disablePointerDismissal>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] gap-5 overflow-y-auto rounded-2xl p-5 shadow-lg sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Completa tu perfil</DialogTitle>
          <DialogDescription>
            Antes de registrar acciones, dinos qué estudias para unirte al clan de tu carrera.
          </DialogDescription>
        </DialogHeader>
        <OnboardingForm careers={careers} careersFailed={careersFailed} onDone={handleDone} />
        <Button
          type="button"
          variant="ghost"
          onClick={handleSignOut}
          className="min-h-11 cursor-pointer rounded-xl text-muted-foreground"
        >
          Cerrar sesión
        </Button>
      </DialogContent>
    </Dialog>
  );
}
