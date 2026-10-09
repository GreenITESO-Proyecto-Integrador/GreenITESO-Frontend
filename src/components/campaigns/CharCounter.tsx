interface CharCounterProps {
  value: string;
  max: number;
}

/**
 * "12/100" counter shown under a length-limited field.
 */
export function CharCounter({ value, max }: CharCounterProps) {
  const nearLimit = value.length >= max * 0.9;
  return (
    <p
      className={
        nearLimit
          ? 'text-right text-xs font-medium text-amber-700 tabular-nums dark:text-amber-300'
          : 'text-right text-xs text-muted-foreground tabular-nums'
      }
      aria-hidden="true"
    >
      {value.length}/{max}
    </p>
  );
}
