import { Input } from '@/components/ui/input';

export function FormShowcase() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Formularios e Inputs</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold text-secondary-500 mb-2">Nombre</label>
          <Input
            type="text"
            placeholder="Ingresa tu nombre"
            className="rounded-xl border-secondary-100 text-secondary-500 placeholder:text-secondary-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-secondary-500 mb-2">Email</label>
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            className="rounded-xl border-secondary-100 text-secondary-500 placeholder:text-secondary-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-secondary-500 mb-2">Mensaje</label>
          <textarea
            placeholder="Tu mensaje aquí..."
            className="w-full px-4 py-3 rounded-xl border border-secondary-100 bg-white text-secondary-500 placeholder:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            rows={4}
          />
        </div>
      </div>
    </section>
  );
}
