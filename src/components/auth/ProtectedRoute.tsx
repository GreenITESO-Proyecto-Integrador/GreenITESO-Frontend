import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ensureAccessToken, getStoredUser, hasSession } from '@/lib/auth/session';
import type { UserRole } from '@/types/auth';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly (UserRole | string)[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
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

  if (allowedRoles && allowedRoles.length > 0) {
    const user = getStoredUser();
    const hasRole = Boolean(user?.role && allowedRoles.includes(user.role));

    if (!hasRole) {
      return fallback ?? <AccessDenied />;
    }
  }

  return children;
}
