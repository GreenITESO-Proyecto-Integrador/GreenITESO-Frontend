import { Input } from '@/components/ui/input';

export function FormShowcase() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-foreground">Formularios e Inputs</h2>
      <div className="bg-card p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Nombre</label>
          <Input
            type="text"
            placeholder="Ingresa tu nombre"
            className="rounded-xl border-input text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Email</label>
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            className="rounded-xl border-input text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Mensaje</label>
          <textarea
            placeholder="Tu mensaje aquí..."
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            rows={4}
          />
        </div>
      </div>
    </section>
  );
}
