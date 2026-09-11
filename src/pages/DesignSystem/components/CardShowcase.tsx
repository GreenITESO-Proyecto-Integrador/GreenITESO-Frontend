import { Button } from '@/components/ui/button';

export function CardShowcase() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Tarjetas (Cards)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-primary-500 h-24" />
          <div className="p-4">
            <h3 className="font-bold text-secondary-500 mb-2">Misión Principal</h3>
            <p className="text-sm text-secondary-300 mb-4">
              Reduce tu huella de carbono en esta semana
            </p>
            <Button className="w-full bg-primary-50 hover:bg-primary-100 text-primary-700">
              Ver Detalles
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-linear-to-r from-sky-400 to-sky-500 h-24" />
          <div className="p-4">
            <h3 className="font-bold text-secondary-500 mb-2">Tu Impacto</h3>
            <p className="text-2xl font-bold text-primary-600 mb-1">2,450 L</p>
            <p className="text-sm text-secondary-300">Agua ahorrada este mes</p>
          </div>
        </div>
      </div>
    </section>
  );
}
