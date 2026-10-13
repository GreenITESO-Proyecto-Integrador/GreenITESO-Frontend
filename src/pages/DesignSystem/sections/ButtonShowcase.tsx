import { Button } from '@/components/ui/button';

export function ButtonShowcase() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-secondary-500 mb-6">Botones</h2>
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-secondary-300 mb-4">Primario - Estados</p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">Normal</Button>
            <Button className="bg-primary-600 text-white">Hover</Button>
            <Button className="bg-primary-700 text-white">Active</Button>
            <Button disabled className="bg-primary-500 text-white opacity-50">
              Disabled
            </Button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-secondary-300 mb-4">Secundario / Outlined</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-secondary-100 text-secondary-500">
              Normal
            </Button>
            <Button variant="outline" className="border-2 border-secondary-300 text-secondary-500">
              Hover
            </Button>
            <Button variant="outline" disabled className="border-secondary-100 text-secondary-300">
              Disabled
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
