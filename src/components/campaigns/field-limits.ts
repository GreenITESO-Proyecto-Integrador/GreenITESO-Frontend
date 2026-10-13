/** Client-side text limits so long input cannot break the card and modal layouts. */
export const TITLE_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 100;
export const REJECTION_REASON_MAX_LENGTH = 100;

/** Breaks long unbroken strings instead of stretching the container. */
export const WRAP_TEXT = '[overflow-wrap:anywhere]';

/**
 * Select option: 44px tall, and long labels wrap inside the popup instead of widening it
 * (the base `SelectItem` keeps its label on one line).
 */
export const SELECT_ITEM_CLASS =
  'min-h-11 py-2 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink [&>span:first-child]:whitespace-normal [&>span:first-child]:[overflow-wrap:anywhere]';
