import type { ComponentProps } from 'react';
import { X } from 'lucide-react';
import { DialogClose, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalContentProps = Omit<ComponentProps<typeof DialogContent>, 'showCloseButton'>;

/**
 * Dialog content with the GreenITESO modal look: rounded-2xl, shadow-lg, scrollable,
 * and a 44×44 close button.
 */
export function ModalContent({ className, children, ...props }: ModalContentProps) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        'max-h-[90dvh] gap-5 overflow-y-auto rounded-2xl p-5 shadow-lg sm:max-w-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogClose
        aria-label="Cerrar"
        className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
      >
        <X className="size-5" />
      </DialogClose>
    </DialogContent>
  );
}
