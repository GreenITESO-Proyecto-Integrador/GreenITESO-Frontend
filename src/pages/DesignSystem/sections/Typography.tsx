export function Typography() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-foreground">Tipografía</h2>
      <div className="space-y-4">
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-3xl font-extrabold text-foreground sm:text-4xl">Display / Hero</p>
          <p className="text-sm text-muted-foreground">Plus Jakarta Sans - ExtraBold (800)</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-2xl font-bold text-foreground">Título H1</p>
          <p className="text-sm text-muted-foreground">Plus Jakarta Sans - Bold (700)</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-xl font-bold text-foreground">Título H2</p>
          <p className="text-sm text-muted-foreground">Plus Jakarta Sans - Bold (700)</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-lg font-semibold text-foreground">Subtítulo H3</p>
          <p className="text-sm text-muted-foreground">Plus Jakarta Sans - SemiBold (600)</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-sm text-foreground sm:text-base">Cuerpo Principal Regular</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Plus Jakarta Sans - Regular (400)
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <p className="mb-1 text-xs text-muted-foreground sm:text-sm">Cuerpo Secundario</p>
          <p className="text-xs text-muted-foreground">Plus Jakarta Sans - Regular (400)</p>
        </div>
      </div>
    </section>
  );
}
