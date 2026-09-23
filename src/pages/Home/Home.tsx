import { Leaf, ArrowRight, BarChart3, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="bg-primary-500 p-6 rounded-3xl">
              <Leaf className="size-16 text-white" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground mb-4">GreenITESO</h1>

          <p className="text-2xl text-primary-600 dark:text-primary-400 font-semibold mb-6">
            En Desarrollo
          </p>

          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Plataforma integral de sostenibilidad y gestión ambiental para la comunidad ITESO.
            Medimos, monitoreamos y maximizamos el impacto positivo en nuestro planeta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/design-system')}
              className="min-h-11 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition-colors"
            >
              Ver Design System
              <ArrowRight className="ml-2 size-5" />
            </Button>
            {/* <Button variant="outline" className="min-h-[44px] border-2 border-secondary-300 text-secondary-500 font-semibold px-8 py-3 rounded-xl transition-colors">
              Documentación
            </Button> */}
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-muted py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Próximamente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-2xl p-6 text-center shadow-sm">
              <BarChart3 className="size-10 text-primary-700 dark:text-primary-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300 mb-2">
                Dashboard
              </h3>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                Visualiza tu impacto ambiental en tiempo real
              </p>
            </div>
            <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-2xl p-6 text-center shadow-sm">
              <Target className="size-10 text-sky-700 dark:text-sky-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-sky-700 dark:text-sky-300 mb-2">Misiones</h3>
              <p className="text-sm text-sky-600 dark:text-sky-400">
                Participa en retos sostenibles y gana puntos
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-sm">
              <Trophy className="size-10 text-emerald-700 dark:text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                Leaderboard
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Compite y colabora con tu comunidad
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
