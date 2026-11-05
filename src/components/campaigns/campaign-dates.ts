const MX_TIME_ZONE = 'America/Mexico_City';
// Mexico City has no daylight saving time since 2022. Every campaign datetime sent to the
// backend goes through `toMxDateTime`, so this is the only place the offset lives.
const MX_OFFSET = '-06:00';
const DAY_MS = 24 * 60 * 60 * 1000;

const mxDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: MX_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * `YYYY-MM-DD` of an instant as seen in Mexico City.
 */
function toMxDate(date: Date): string {
  return mxDateFormat.format(date);
}

/**
 * ISO datetime for a `YYYY-MM-DD` value at the start (00:00:00) or end (23:59:59) of that day in
 * Mexico City, e.g. `2026-10-21T00:00:00-06:00`. Use it for both `start_date` and `end_date`.
 */
export function toMxDateTime(value: string, edge: 'start' | 'end'): string {
  return `${value}T${edge === 'start' ? '00:00:00' : '23:59:59'}${MX_OFFSET}`;
}

/**
 * End of day (Mexico City) for a `YYYY-MM-DD` value.
 */
export function endOfDay(value: string): Date {
  return new Date(toMxDateTime(value, 'end'));
}

/**
 * `YYYY-MM-DD` shifted by whole days (calendar arithmetic, no time zone involved).
 */
export function addDays(value: string, days: number): string {
  return new Date(new Date(`${value}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Tomorrow as `YYYY-MM-DD` in Mexico City: the earliest `start_date` the backend accepts.
 */
export function getTomorrowInMexicoCity(now: Date = new Date()): string {
  return addDays(toMxDate(now), 1);
}

/**
 * Earliest `end_date` for a campaign: the backend needs the end at least one day after the start,
 * which with start-of-day / end-of-day times means the next calendar day. Without a start, the
 * earliest start (tomorrow) is assumed.
 */
export function getMinEndDate(startDate: string): string {
  return addDays(startDate || getTomorrowInMexicoCity(), 1);
}

/**
 * Backend datetime -> `YYYY-MM-DD` (Mexico City) for a date input. Empty when invalid.
 */
export function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return toMxDate(parsed);
}

interface ValidateDatesOptions {
  /** Also require the start to be tomorrow or later (Mexico City). */
  checkStartMin?: boolean;
}

/**
 * Client-side date checks: both required, start tomorrow or later (when asked), end at least one
 * day after start, end in the future. Returns messages keyed by backend field name.
 */
export function validateDates(
  startDate: string,
  endDate: string,
  { checkStartMin = false }: ValidateDatesOptions = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!startDate) errors.start_date = 'Elige la fecha de inicio.';
  if (!endDate) errors.end_date = 'Elige la fecha de fin.';

  if (startDate && checkStartMin && startDate < getTomorrowInMexicoCity()) {
    errors.start_date = 'La fecha de inicio debe ser mañana o después.';
  }

  if (startDate && endDate) {
    if (endDate < getMinEndDate(startDate)) {
      errors.end_date = 'La fecha de fin debe ser al menos un día después del inicio.';
    } else if (endOfDay(endDate) <= new Date()) {
      errors.end_date = 'La fecha de fin debe estar en el futuro.';
    }
  }
  return errors;
}
