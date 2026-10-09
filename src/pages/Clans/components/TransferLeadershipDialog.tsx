import { useState } from 'react';
import { ModalContent } from '@/components/custom/ModalContent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SELECT_ITEM_CLASS } from '@/components/campaigns/field-limits';
import { useClanAction } from '@/hooks/use-clan-action';
import { useDialogBusyGuard } from '@/hooks/use-dialog-busy-guard';
import { transferClanLeadership } from '@/lib/api/clans';
import { memberDisplayName } from '@/lib/clan-meta';
import type { ClanMember } from '@/types/clan';

interface TransferLeadershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanId: string;
  /** Members who can receive the leadership (everyone except the current leader). */
  candidates: ClanMember[];
  onTransferred: (newLeaderName: string) => void;
}

function TransferForm({
  clanId,
  candidates,
  onTransferred,
  onCancel,
  onBusyChange,
}: Omit<TransferLeadershipDialogProps, 'open' | 'onOpenChange'> & {
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [successorId, setSuccessorId] = useState('');
  const { busy, error, run } = useClanAction(onBusyChange);
  const items = candidates.map(member => ({
    value: member.userId,
    label: memberDisplayName(member.nickname),
  }));

  async function handleConfirm() {
    if (!successorId) return;
    const ok = await run(
      () => transferClanLeadership(clanId, successorId),
      'No se pudo transferir el liderazgo.',
    );
    if (ok) onTransferred(items.find(item => item.value === successorId)?.label ?? 'otro miembro');
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer-successor">Nuevo líder</Label>
        <Select
          value={successorId || null}
          onValueChange={next => setSuccessorId(next ?? '')}
          items={items}
        >
          <SelectTrigger id="transfer-successor" className="h-11 w-full min-w-0 rounded-xl px-3">
            <SelectValue className="min-w-0 overflow-hidden" placeholder="Selecciona un miembro">
              {(selected: string | null) => {
                const label = items.find(item => item.value === selected)?.label;
                return label ? (
                  <span className="block min-w-0 truncate">{label}</span>
                ) : (
                  <span className="text-muted-foreground">Selecciona un miembro</span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="min-w-64">
            {items.map(item => (
              <SelectItem key={item.value} value={item.value} className={SELECT_ITEM_CLASS}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy || !successorId}
          className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
        >
          {busy ? 'Transfiriendo…' : 'Transferir liderazgo'}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Leader only: pick another member to take over the clan. The leader becomes a regular member.
 */
export function TransferLeadershipDialog({
  open,
  onOpenChange,
  ...form
}: TransferLeadershipDialogProps) {
  const { handleOpenChange, setBusy } = useDialogBusyGuard(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <DialogHeader>
          <DialogTitle>Transferir liderazgo</DialogTitle>
          <DialogDescription>
            La persona elegida será la nueva líder del clan y tú pasarás a ser miembro. Solo puede
            liderar un clan a la vez, así que debe ser alguien que no lidere otro.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TransferForm {...form} onCancel={() => onOpenChange(false)} onBusyChange={setBusy} />
        ) : null}
      </ModalContent>
    </Dialog>
  );
}
