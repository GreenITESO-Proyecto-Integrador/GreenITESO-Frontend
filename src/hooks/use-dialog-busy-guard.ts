import { useCallback, useRef } from 'react';

/**
 * Keep a dialog open while its request is in flight. Esc, the close button and a click outside
 * would otherwise unmount the form and drop its in-flight guard, letting the user fire the same
 * request again. The dialog body reports when its request starts and ends with `setBusy`.
 *
 * The flag lives in a ref, not in state, so it is already set when the request starts: waiting
 * for a re-render would leave a gap in which Esc could still close the dialog.
 */
export function useDialogBusyGuard(onOpenChange: (open: boolean) => void) {
  const busy = useRef(false);

  const setBusy = useCallback((next: boolean) => {
    busy.current = next;
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && busy.current) return;
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return { handleOpenChange, setBusy };
}
