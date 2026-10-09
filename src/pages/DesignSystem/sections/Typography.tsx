export function Typography() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Tipografía</h2>
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-3xl sm:text-4xl font-extrabold text-secondary-500 mb-1">
            Display / Hero
          </p>
          <p className="text-sm text-secondary-300">Plus Jakarta Sans - ExtraBold (800)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-2xl font-bold text-secondary-500 mb-1">Título H1</p>
          <p className="text-sm text-secondary-300">Plus Jakarta Sans - Bold (700)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-xl font-bold text-secondary-500 mb-1">Título H2</p>
          <p className="text-sm text-secondary-300">Plus Jakarta Sans - Bold (700)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-lg font-semibold text-secondary-500 mb-1">Subtítulo H3</p>
          <p className="text-sm text-secondary-300">Plus Jakarta Sans - SemiBold (600)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-sm sm:text-base text-secondary-500 mb-1">Cuerpo Principal Regular</p>
          <p className="text-xs sm:text-sm text-secondary-300">Plus Jakarta Sans - Regular (400)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs sm:text-sm text-secondary-300 mb-1">Cuerpo Secundario</p>
          <p className="text-xs text-secondary-300">Plus Jakarta Sans - Regular (400)</p>
        </div>
      </div>
    </section>
  );
}
