import { useEffect, useMemo, useRef, useState } from 'react';
import { createActionLog, type RegisteredActionLog } from '@/lib/api/action-logs';
import { ApiError, toFriendlyMessage } from '@/lib/api/errors';
import {
  type ActionLogFormErrors,
  type ActionLogFormValues,
  validateActionLogForm,
} from '@/lib/action-log-form';
import type { CatalogAction } from '@/types/action-catalog';

export type ActionLogSubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Hold action-log form state, validate evidence rules, and register the action.
 * `initialActionKey` may be a catalog id or code, used once when the catalog arrives.
 */
export function useActionLogForm(actions: CatalogAction[], initialActionKey = '') {
  const [actionId, setActionId] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [errors, setErrors] = useState<ActionLogFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<ActionLogSubmitStatus>('idle');
  const [registeredLog, setRegisteredLog] = useState<RegisteredActionLog | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const initialApplied = useRef(false);

  const selectedAction = useMemo(
    () => actions.find(action => action.id === actionId),
    [actions, actionId],
  );

  const values: ActionLogFormValues = { actionId, evidence };

  useEffect(() => {
    if (initialApplied.current || !initialActionKey) return;
    if (actionId) {
      initialApplied.current = true;
      return;
    }
    const match = actions.find(
      action => action.id === initialActionKey || action.code === initialActionKey,
    );
    if (!match) return;
    initialApplied.current = true;
    setActionId(match.id);
  }, [actions, initialActionKey, actionId]);

  function clearSubmission() {
    setSubmitStatus('idle');
    setSubmitError(null);
    setRegisteredLog(null);
    idempotencyKey.current = crypto.randomUUID();
  }

  /**
   * Update the selected catalog action and clear its field error.
   */
  function selectAction(nextActionId: string) {
    setActionId(nextActionId);
    clearSubmission();
    setErrors(current => ({ ...current, actionId: undefined }));
  }

  /**
   * Update the attached evidence file and clear its field error.
   */
  function selectEvidence(file: File | null) {
    setEvidence(file);
    clearSubmission();
    setErrors(current => ({ ...current, evidence: undefined }));
  }

  /**
   * Validate the form and create the action log. Points are credited on the server.
   */
  async function submitForm(): Promise<boolean> {
    const nextErrors = validateActionLogForm(values, selectedAction);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitStatus('idle');
      setSubmitError(null);
      setRegisteredLog(null);
      return false;
    }

    if (submitStatus === 'submitting') return false;

    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const result = await createActionLog({
        actionId,
        idempotencyKey: idempotencyKey.current,
        evidence,
      });
      setRegisteredLog(result);
      setSubmitStatus('success');
      idempotencyKey.current = crypto.randomUUID();
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          actionId: error.fieldErrors.action_id,
          evidence: error.fieldErrors.evidence ?? error.fieldErrors.evidence_object_key,
        });
      }
      setRegisteredLog(null);
      setSubmitError(toFriendlyMessage(error, 'No se pudo registrar la acción.'));
      setSubmitStatus('error');
      return false;
    }
  }

  /**
   * Reset action, evidence, errors, and submit status.
   */
  function resetForm() {
    setActionId('');
    setEvidence(null);
    setErrors({});
    clearSubmission();
  }

  return {
    actionId,
    evidence,
    errors,
    submitError,
    selectedAction,
    submitStatus,
    registeredLog,
    selectAction,
    selectEvidence,
    submitForm,
    resetForm,
  };
}
