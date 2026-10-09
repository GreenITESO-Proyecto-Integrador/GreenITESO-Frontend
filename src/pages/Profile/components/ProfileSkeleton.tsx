export function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Cargando perfil ecológico">
      <span className="sr-only">Cargando perfil ecológico…</span>

      {/* Header Skeleton */}
      <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-xs border border-border flex flex-col sm:flex-row items-center gap-6">
        <div className="size-20 rounded-full bg-muted" />
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="h-7 w-48 bg-muted rounded-md mx-auto sm:mx-0" />
          <div className="h-4 w-64 bg-muted rounded-md mx-auto sm:mx-0" />
          <div className="flex justify-center sm:justify-start gap-2 pt-1">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-24 bg-muted rounded-full" />
          </div>
        </div>
      </div>

      {/* Progress Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-5 shadow-xs border border-border text-center space-y-2"
          >
            <div className="size-8 rounded-full bg-muted mx-auto" />
            <div className="h-6 w-16 bg-muted rounded-md mx-auto" />
            <div className="h-4 w-20 bg-muted rounded-md mx-auto" />
          </div>
        ))}
      </div>

      {/* Impact Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(idx => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-6 shadow-xs border border-border text-center space-y-3"
          >
            <div className="size-8 rounded-full bg-muted mx-auto" />
            <div className="h-5 w-24 bg-muted rounded-md mx-auto" />
            <div className="h-4 w-16 bg-muted rounded-md mx-auto" />
          </div>
        ))}
      </div>

      {/* Clans Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(idx => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-6 shadow-xs border border-border space-y-3"
          >
            <div className="h-5 w-32 bg-muted rounded-md" />
            <div className="h-4 w-48 bg-muted rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
