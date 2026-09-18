import { useMemo, useState } from 'react';
import {
  type ActionLogFormErrors,
  type ActionLogFormValues,
  validateActionLogForm,
} from '@/lib/action-log-form';
import type { CatalogAction } from '@/types/action-catalog';

export type ActionLogSubmitStatus = 'idle' | 'preview';

/**
 * Hold action-log form state, validate evidence rules, and mark a local preview submit.
 */
export function useActionLogForm(actions: CatalogAction[]) {
  const [actionId, setActionId] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [errors, setErrors] = useState<ActionLogFormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<ActionLogSubmitStatus>('idle');

  const selectedAction = useMemo(
    () => actions.find(action => action.id === actionId),
    [actions, actionId],
  );

  const values: ActionLogFormValues = { actionId, evidence };

  /**
   * Update the selected catalog action and clear its field error.
   */
  function selectAction(nextActionId: string) {
    setActionId(nextActionId);
    setSubmitStatus('idle');
    setErrors(current => ({ ...current, actionId: undefined }));
  }

  /**
   * Update the attached evidence file and clear its field error.
   */
  function selectEvidence(file: File | null) {
    setEvidence(file);
    setSubmitStatus('idle');
    setErrors(current => ({ ...current, evidence: undefined }));
  }

  /**
   * Validate the form. Points stay on the backend; success here is a UI preview only.
   */
  function submitForm(): boolean {
    const nextErrors = validateActionLogForm(values, selectedAction);
    setErrors(nextErrors);

    const isValid = Object.keys(nextErrors).length === 0;
    if (!isValid) {
      setSubmitStatus('idle');
      return false;
    }

    setSubmitStatus('preview');
    return true;
  }

  /**
   * Reset action, evidence, errors, and submit status.
   */
  function resetForm() {
    setActionId('');
    setEvidence(null);
    setErrors({});
    setSubmitStatus('idle');
  }

  return {
    actionId,
    evidence,
    errors,
    selectedAction,
    submitStatus,
    selectAction,
    selectEvidence,
    submitForm,
    resetForm,
  };
}
