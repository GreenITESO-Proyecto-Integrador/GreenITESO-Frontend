import { Link } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-has-role';

export function Footer() {
  const isAdmin = useIsAdmin();

  return (
    <footer className="border-t border-border bg-card px-4 py-8 text-center space-y-2">
      <p className="text-sm text-muted-foreground">
        GreenITESO © {new Date().getFullYear()} | Desarrollando un futuro sostenible
      </p>
      {isAdmin ? null : (
        <p className="text-xs text-muted-foreground">
          ¿Tienes sugerencias o encontraste un problema?{' '}
          <Link
            to="/feedback"
            className="text-primary-700 dark:text-primary-300 font-semibold underline underline-offset-4 hover:text-primary-800 dark:hover:text-primary-200"
          >
            Envíanos tus comentarios
          </Link>
        </p>
      )}
    </footer>
  );
}
