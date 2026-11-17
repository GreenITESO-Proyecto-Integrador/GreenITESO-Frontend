import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CharCounter } from '@/components/campaigns/CharCounter';
import { FieldError } from '@/components/campaigns/FieldError';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/campaigns/field-limits';
import { FilterChips } from '@/components/shared/FilterChips';
import { PRIVACY_META, PRIVACY_OPTIONS } from '@/lib/clan-meta';
import type { ClanFormValues } from './clan-form';

interface ClanFormFieldsProps {
  values: ClanFormValues;
  errors: Record<string, string>;
  onChange: (values: ClanFormValues) => void;
  /** Shown under the privacy chips, after the description of the chosen option. */
  privacyNote?: string;
}

/**
 * Name, description and privacy inputs shared by the create and edit clan dialogs.
 */
export function ClanFormFields({ values, errors, onChange, privacyNote }: ClanFormFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-name">Nombre</Label>
        <Input
          id="clan-name"
          value={values.name}
          maxLength={TITLE_MAX_LENGTH}
          onChange={event => onChange({ ...values, name: event.target.value })}
          aria-invalid={errors.name ? true : undefined}
          className="h-11 rounded-xl px-3"
          autoComplete="off"
        />
        <CharCounter value={values.name} max={TITLE_MAX_LENGTH} />
        <FieldError message={errors.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="clan-description">Descripción (opcional)</Label>
        <Textarea
          id="clan-description"
          value={values.description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={event => onChange({ ...values, description: event.target.value })}
          aria-invalid={errors.description ? true : undefined}
          className="min-h-24 rounded-xl px-3 py-2"
        />
        <CharCounter value={values.description} max={DESCRIPTION_MAX_LENGTH} />
        <FieldError message={errors.description} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Privacidad</Label>
        <FilterChips
          label="Privacidad del clan"
          options={PRIVACY_OPTIONS}
          value={values.privacy}
          onChange={privacy => onChange({ ...values, privacy })}
        />
        <p className="text-xs text-muted-foreground">{PRIVACY_META[values.privacy].description}</p>
        {privacyNote ? <p className="text-xs text-muted-foreground">{privacyNote}</p> : null}
        <FieldError message={errors.privacy} />
      </div>
    </>
  );
}
