import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Confetti } from '@/components/shared/Confetti';
import { getBadgeName } from '@/components/shared/badge-unlock';
import { Dialog, DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { Notification } from '@/types/notification';

interface BadgeUnlockModalProps {
  /** The BADGE_EARNED notification to celebrate; null keeps the modal closed. */
  notification: Notification | null;
  /** How many more badges are waiting after this one. */
  remaining: number;
  onDismiss: () => void;
  onOpen: (notification: Notification) => void;
}

/**
 * Celebration shown when the API confirms a new badge (BADGE_EARNED pushed over
 * the notifications socket): leaf confetti, a medallion that pops in, and links
 * to the profile where the badge now appears.
 */
export function BadgeUnlockModal({
  notification,
  remaining,
  onDismiss,
  onOpen,
}: BadgeUnlockModalProps) {
  if (!notification) return null;

  const badgeName = getBadgeName(notification.message);

  return (
    <>
      {/* `key` restarts the confetti for every badge in the queue. */}
      <Confetti key={notification.id} />
      <Dialog
        open
        onOpenChange={open => {
          if (!open) onDismiss();
        }}
      >
        <ModalContent key={notification.id} className="text-center sm:max-w-sm">
          <div className="relative mx-auto mt-2 size-28 animate-badge-pop motion-reduce:animate-none">
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-badge-ring rounded-full bg-[conic-gradient(var(--color-primary-200),var(--color-primary-500),var(--color-emerald-300),var(--color-sky-300),var(--color-primary-200))] motion-reduce:animate-none"
            />
            <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-card shadow-sm">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <Award className="size-12" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="animate-badge-rise space-y-2 motion-reduce:animate-none">
            <DialogTitle className="text-3xl leading-9 font-extrabold text-foreground">
              ¡Insignia desbloqueada!
            </DialogTitle>
            {badgeName && (
              <p className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                {badgeName}
              </p>
            )}
            <DialogDescription className="text-sm text-muted-foreground">
              Ya aparece en tu perfil. Sigue registrando acciones para ganar más.
            </DialogDescription>
            {remaining > 0 && (
              <p className="text-xs font-semibold text-muted-foreground">
                {remaining === 1
                  ? 'Tienes 1 insignia más por ver'
                  : `Tienes ${remaining} insignias más por ver`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Link
              to="/profile"
              onClick={() => {
                onOpen(notification);
                onDismiss();
              }}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none active:bg-primary-700"
            >
              Ver mis insignias
            </Link>
            <DialogClose className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-5 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none">
              {remaining > 0 ? 'Siguiente' : 'Seguir explorando'}
            </DialogClose>
          </div>
        </ModalContent>
      </Dialog>
    </>
  );
}
