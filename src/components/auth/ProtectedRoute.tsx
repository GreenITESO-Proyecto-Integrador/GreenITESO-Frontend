import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ensureAccessToken, hasSession } from '@/lib/auth/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void ensureAccessToken().then(() => {
      if (isMounted) {
        setIsAuthenticated(hasSession());
        setIsCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50 text-sm text-secondary-300">
        Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
