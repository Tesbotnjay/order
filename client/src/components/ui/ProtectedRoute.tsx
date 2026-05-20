import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { PageLoader } from './index';

// ── Buyer Protected Route ──────────────────────────────────────────────────
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const location = useLocation();
  const { setSession } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setSession(session);
        setStatus('ok');
      } else {
        setStatus('fail');
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') return <PageLoader />;
  if (status === 'fail') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

// ── Admin Protected Route ──────────────────────────────────────────────────
export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkSession, clearSession } = useAdminStore();
  const [checked, setChecked] = useState<boolean | null>(null);

  useEffect(() => {
    const valid = isAuthenticated && checkSession();
    if (!valid) clearSession();
    setChecked(valid);
  }, []);

  if (checked === null) return <PageLoader />;
  if (!checked) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
