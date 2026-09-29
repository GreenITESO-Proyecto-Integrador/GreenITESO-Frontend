import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

export function formatRelativeTime(isoDate: string): string {
  const elapsedSeconds = (new Date(isoDate).getTime() - Date.now()) / 1000;

  for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
    if (Math.abs(elapsedSeconds) >= seconds) {
      return relativeTimeFormatter.format(Math.round(elapsedSeconds / seconds), unit);
    }
  }

  return relativeTimeFormatter.format(Math.round(elapsedSeconds), 'second');
}
