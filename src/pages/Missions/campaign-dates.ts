/**
 * Local start of day for a `YYYY-MM-DD` value.
 */
export function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/**
 * Local end of day for a `YYYY-MM-DD` value, so a same-day campaign is valid.
 */
export function endOfDay(value: string): Date {
  return new Date(`${value}T23:59:59`);
}

/**
 * Backend datetime -> `YYYY-MM-DD` (local) for a date input. Empty when invalid.
 */
export function toDateInputValue(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
}

/**
 * Client-side date checks: both required, end after start, end in the future.
 * Returns messages keyed by backend field name.
 */
export function validateDates(startDate: string, endDate: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!startDate) errors.start_date = 'Elige la fecha de inicio.';
  if (!endDate) errors.end_date = 'Elige la fecha de fin.';

  if (startDate && endDate) {
    if (endOfDay(endDate) <= startOfDay(startDate)) {
      errors.end_date = 'La fecha de fin debe ser posterior al inicio.';
    } else if (endOfDay(endDate) <= new Date()) {
      errors.end_date = 'La fecha de fin debe estar en el futuro.';
    }
  }
  return errors;
}
