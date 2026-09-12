export function BadgeShowcase() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Badges y Tags</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
            APROBADO
          </span>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full">
            PENDIENTE
          </span>
          <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
            RECHAZADO
          </span>
          <span className="px-3 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full">
            INFORMACIÓN
          </span>
        </div>
        <p className="text-xs text-secondary-300">
          Badges con estados semánticos y colores de alto contraste
        </p>
      </div>
    </section>
  );
}
