import { Leaf, ArrowRight, BarChart3, Target, Trophy, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { RequireRole } from '@/components/auth/RequireRole';
import { ADMIN_ROLES } from '@/types/auth';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-secondary-50 min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="bg-primary-500 p-6 rounded-3xl">
              <Leaf className="size-16 text-white" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-secondary-500 mb-4">
            GreenITESO
          </h1>

          <p className="text-2xl text-primary-600 font-semibold mb-6">En Desarrollo</p>

          <p className="text-lg text-secondary-400 mb-12 leading-relaxed">
            Plataforma integral de sostenibilidad y gestión ambiental para la comunidad ITESO.
            Medimos, monitoreamos y maximizamos el impacto positivo en nuestro planeta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate('/design-system')}
              className="min-h-11 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Ver Design System
              <ArrowRight className="ml-2 size-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="min-h-11 border-2 border-secondary-300 px-8 py-3 font-semibold text-secondary-500 cursor-pointer"
            >
              Iniciar sesión
            </Button>
            <RequireRole allowedRoles={ADMIN_ROLES}>
              <Button
                variant="outline"
                onClick={() => navigate('/audit')}
                className="min-h-11 border-2 border-primary-600 bg-primary-50 px-8 py-3 font-semibold text-primary-700 hover:bg-primary-100 cursor-pointer"
              >
                <ShieldCheck className="mr-2 size-5 text-primary-600" />
                Panel de Auditoría
              </Button>
            </RequireRole>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-secondary-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-secondary-500 mb-12 text-center">Próximamente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 text-center shadow-sm">
              <BarChart3 className="size-10 text-primary-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary-700 mb-2">Dashboard</h3>
              <p className="text-sm text-primary-600">
                Visualiza tu impacto ambiental en tiempo real
              </p>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 text-center shadow-sm">
              <Target className="size-10 text-sky-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-sky-700 mb-2">Misiones</h3>
              <p className="text-sm text-sky-600">Participa en retos sostenibles y gana puntos</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-sm">
              <Trophy className="size-10 text-emerald-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-emerald-700 mb-2">Leaderboard</h3>
              <p className="text-sm text-emerald-600">Compite y colabora con tu comunidad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-700 text-secondary-50 py-8 px-4 text-center">
        <p className="text-sm text-secondary-100">
          GreenITESO © {new Date().getFullYear()} | Desarrollando un futuro sostenible
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
