/**
 * Inline validation message under a form field.
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-700" role="alert">
      {message}
    </p>
  );
}
