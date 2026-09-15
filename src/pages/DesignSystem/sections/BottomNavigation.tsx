import { Home as HomeIcon, Compass, User, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-100 shadow-lg z-50 pb-[env(safe-area-inset-bottom,16px)]">
      <div className="flex justify-around items-center h-20 max-w-5xl mx-auto px-4">
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-auto text-primary-500 hover:text-primary-600"
        >
          <HomeIcon size={24} />
          <span className="text-xs mt-1 font-semibold">Inicio</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-auto text-secondary-300 hover:text-secondary-400"
        >
          <Compass size={24} />
          <span className="text-xs mt-1 font-semibold">Explorar</span>
        </Button>
        <Button className="flex items-center justify-center rounded-full w-12 h-12 -mt-8 bg-primary-500 hover:bg-primary-600 text-white">
          <Plus size={28} />
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-auto text-secondary-300 hover:text-secondary-400"
        >
          <User size={24} />
          <span className="text-xs mt-1 font-semibold">Perfil</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-auto text-secondary-300 hover:text-secondary-400"
        >
          <Settings size={24} />
          <span className="text-xs mt-1 font-semibold">Config</span>
        </Button>
      </div>
    </nav>
  );
}
