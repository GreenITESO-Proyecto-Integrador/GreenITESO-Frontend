interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-white"
      aria-label={`${count} notificaciones sin leer`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
