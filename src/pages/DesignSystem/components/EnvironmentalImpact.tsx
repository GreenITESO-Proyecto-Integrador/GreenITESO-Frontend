import { Leaf, Droplets, Recycle } from 'lucide-react';

export function EnvironmentalImpact() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Identidad Visual de Impacto</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-6 text-center">
          <Leaf className="size-8 text-primary-700 mx-auto mb-3" />
          <p className="font-bold text-primary-700">CO₂ Evitado</p>
          <p className="text-sm text-primary-600">128 kg</p>
        </div>
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-6 text-center">
          <Droplets className="size-8 text-sky-700 mx-auto mb-3" />
          <p className="font-bold text-sky-700">Agua Ahorrada</p>
          <p className="text-sm text-sky-600">2,450 L</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center">
          <Recycle className="size-8 text-emerald-700 mx-auto mb-3" />
          <p className="font-bold text-emerald-700">Plástico Reciclado</p>
          <p className="text-sm text-emerald-600">45 kg</p>
        </div>
      </div>
    </section>
  );
}
