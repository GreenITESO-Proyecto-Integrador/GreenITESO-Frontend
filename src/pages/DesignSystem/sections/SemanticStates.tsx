export function SemanticStates() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Estados Semánticos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-primary-700 font-semibold">Aprobado / Exitoso</p>
          <p className="text-sm text-primary-600">Registro aprobado, misión completada</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-semibold">Pendiente de Auditoría</p>
          <p className="text-sm text-amber-700">Evidencia en revisión</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold">Rechazado / Alerta</p>
          <p className="text-sm text-red-600">Evidencia rechazada, error</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sky-800 font-semibold">Información / Neutral</p>
          <p className="text-sm text-sky-700">Avisos generales, tutoriales</p>
        </div>
      </div>
    </section>
  );
}
