import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary-700 px-4 py-8 text-center dark:bg-secondary-900 space-y-2">
      <p className="text-sm text-secondary-100">
        GreenITESO © {new Date().getFullYear()} | Desarrollando un futuro sostenible
      </p>
      <p className="text-xs text-secondary-300">
        ¿Tienes sugerencias o encontraste un problema?{' '}
        <Link
          to="/feedback"
          className="text-secondary-100 font-semibold underline underline-offset-4 hover:text-white"
        >
          Envíanos tus comentarios
        </Link>
      </p>
    </footer>
  );
}
