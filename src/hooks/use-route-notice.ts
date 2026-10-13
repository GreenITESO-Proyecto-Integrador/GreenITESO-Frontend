import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readNoticeState } from '@/lib/clan-meta';

/**
 * Success notice handed over by the previous page through the router state.
 * The state is cleared from the history entry once read, so going back or reloading
 * does not show the same notice again.
 */
export function useRouteNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const incoming = readNoticeState(location.state);
  const [notice, setNotice] = useState<string | null>(incoming);

  useEffect(() => {
    if (!incoming) return;
    setNotice(incoming);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [incoming, location.pathname, location.search, navigate]);

  const dismiss = useCallback(() => setNotice(null), []);

  return { notice, setNotice, dismiss };
}
