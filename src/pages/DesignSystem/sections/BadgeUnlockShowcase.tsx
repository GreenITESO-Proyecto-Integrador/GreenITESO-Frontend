import { useState } from 'react';
import { Award } from 'lucide-react';
import { BadgeUnlockModal } from '@/components/shared/BadgeUnlockModal';
import type { Notification } from '@/types/notification';

// Same shape the backend pushes over the socket for BADGE_EARNED.
const DEMO_NOTIFICATION: Notification = {
  id: 'design-system-badge-demo',
  type: 'ACHIEVEMENT',
  title: '¡Nueva insignia desbloqueada!',
  message: 'Obtuviste la insignia "Guardián del agua".',
  createdAt: new Date(0).toISOString(),
  read: false,
  href: null,
};

/** Lets the team preview the badge celebration without waiting for the API. */
export function BadgeUnlockShowcase() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Animación de insignia</h2>
      <div className="bg-card p-6 rounded-2xl shadow-sm space-y-4">
        <p className="text-sm text-muted-foreground">
          Aparece cuando la API confirma una insignia nueva (notificación BADGE_EARNED).
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none active:bg-primary-700"
        >
          <Award className="size-5" aria-hidden="true" />
          Probar animación
        </button>
      </div>
      <BadgeUnlockModal
        notification={isOpen ? DEMO_NOTIFICATION : null}
        remaining={0}
        onDismiss={() => setIsOpen(false)}
        onOpen={() => setIsOpen(false)}
      />
    </section>
  );
}
