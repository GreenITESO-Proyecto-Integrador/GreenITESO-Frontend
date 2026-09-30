interface MockNoticeProps {
  errorMessage: string | null;
  onRetry: () => void;
}

/**
 * Warns that the API failed and sample data is on screen.
 */
export function MockNotice({ errorMessage, onRetry }: MockNoticeProps) {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {errorMessage ?? 'No se pudo conectar con el servidor.'} Mostrando datos de ejemplo.{' '}
      <button
        type="button"
        className="min-h-11 cursor-pointer font-semibold underline"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </p>
  );
}
