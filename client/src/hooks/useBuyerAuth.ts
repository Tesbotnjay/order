import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';

export function useBuyerAuth() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession, setProfile } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (!session) {
        setStatus('fail');
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?redirect=${redirect}`, { replace: true });
        return;
      }

      setSession(session);
      setStatus('ok');

      // fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      if (profile && !cancelled) setProfile(profile);
    });

    return () => { cancelled = true; };
  }, []);

  return { authStatus: status };
}

// ── Membership types ──────────────────────────────────────────────
export type MembershipPlan = 'basic' | 'premium';
export type MembershipStatus = 'pending' | 'active' | 'expired' | 'rejected' | null;

export interface MembershipInfo {
  id: string;
  plan: MembershipPlan;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  nominal: number;
  expires_at: string | null;
  starts_at: string | null;
  created_at: string;
  reject_reason?: string | null;
}

export interface UseMembershipResult {
  activeMembership: MembershipInfo | null;
  pendingMembership: MembershipInfo | null;
  allMemberships: MembershipInfo[];
  isActive: boolean;
  isPremium: boolean;
  isBasic: boolean;
  expiresAt: Date | null;
  daysLeft: number | null;
  loading: boolean;
  refresh: () => void;
}

export function useMembership(): UseMembershipResult {
  const { user } = useAuthStore();
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('memberships')
      .select('id, plan, status, nominal, expires_at, starts_at, created_at, reject_reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMemberships((data as MembershipInfo[]) || []);
        setLoading(false);
      });
  }, [user?.id, tick]);

  const activeMembership = memberships.find(
    (m) => m.status === 'active' && m.expires_at && new Date(m.expires_at) > new Date()
  ) ?? null;

  const pendingMembership = memberships.find((m) => m.status === 'pending') ?? null;

  const isActive = !!activeMembership;
  const isPremium = isActive && activeMembership?.plan === 'premium';
  const isBasic   = isActive && activeMembership?.plan === 'basic';

  const expiresAt = activeMembership?.expires_at ? new Date(activeMembership.expires_at) : null;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return {
    activeMembership,
    pendingMembership,
    allMemberships: memberships,
    isActive,
    isPremium,
    isBasic,
    expiresAt,
    daysLeft,
    loading,
    refresh: () => setTick((t) => t + 1),
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<{
    basic_price: number;
    premium_price: number;
    basic_label: string;
    premium_label: string;
    basic_description: string;
    premium_description: string;
    store_open: boolean;
    qris_image_url: string | null;
    whatsapp_number: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('settings')
      .select(
        'basic_price,premium_price,basic_label,premium_label,basic_description,premium_description,store_open,qris_image_url,whatsapp_number'
      )
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as typeof settings);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
