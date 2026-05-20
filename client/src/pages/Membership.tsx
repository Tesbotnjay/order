import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Camera, Globe, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/ui/Navbar';
import { ToastContainer, toast } from '../components/ui/Toast';
import { useBuyerAuth, useMembership, useSettings } from '../hooks/useBuyerAuth';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import { formatRupiah } from '../utils/helpers';

function MembershipBadge({ plan, size = 'md' }: { plan: 'basic' | 'premium'; size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  }[size];
  if (plan === 'premium') {
    return (
      <span className={`inline-flex items-center gap-1 font-black uppercase tracking-widest rounded-full border-2 bg-amber-50 text-amber-700 border-amber-300 ${cls}`}>
        <Crown size={size === 'lg' ? 14 : 10} /> Premium
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 font-black uppercase tracking-widest rounded-full border-2 bg-pink-light text-pink-deep border-pink-deep/30 ${cls}`}>
      <Star size={size === 'lg' ? 14 : 10} /> Basic
    </span>
  );
}

export default function MembershipPage() {
  const { authStatus } = useBuyerAuth();
  const { user, session } = useAuthStore();
  const { settings, loading: settingsLoading } = useSettings();
  const { activeMembership, pendingMembership, allMemberships, isActive, isPremium, expiresAt, daysLeft, loading: memberLoading, refresh } = useMembership();

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  const navigate = useNavigate();

  if (authStatus === 'loading' || memberLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-deep border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plans = [
    {
      id: 'basic' as const,
      label: settings?.basic_label || 'Basic',
      price: settings?.basic_price || 15000,
      color: 'pink',
      icon: <Star size={22} />,
      features: [
        { icon: <Globe size={14} />, text: 'Buat website kenangan custom', ok: true },
        { icon: <Camera size={14} />, text: 'Photobooth online', ok: false },
      ],
    },
    {
      id: 'premium' as const,
      label: settings?.premium_label || 'Premium',
      price: settings?.premium_price || 20000,
      color: 'amber',
      icon: <Crown size={22} />,
      features: [
        { icon: <Globe size={14} />, text: 'Buat website kenangan custom', ok: true },
        { icon: <Camera size={14} />, text: 'Photobooth online', ok: true },
      ],
    },
  ];

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !session?.access_token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim pembayaran');
      toast.success('Pembayaran dikirim! Menunggu konfirmasi admin.');
      refresh();
      setStep('plan');
      setSelectedPlan(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const nominal = selectedPlan
    ? (selectedPlan === 'premium' ? settings?.premium_price : settings?.basic_price) || 0
    : 0;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <ToastContainer />
      <div className="pt-24 md:pt-28 pb-20 px-4 max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-pixel text-3xl text-ink mb-2">Membership</h1>
          <p className="text-sm font-medium text-ink/60">Akses semua fitur Pixel Memories selama 1 bulan.</p>
        </div>

        {/* ── Active Membership Card ── */}
        {isActive && activeMembership && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-6 rounded-3xl border-[4px] border-border shadow-[6px_6px_0_var(--color-ink)] ${
              isPremium ? 'bg-amber-50' : 'bg-pink-light'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-ink/50 mb-1">Membership Aktif</p>
                <MembershipBadge plan={activeMembership.plan} size="lg" />
              </div>
              <div className={`w-12 h-12 rounded-2xl border-[3px] border-border flex items-center justify-center shadow-[3px_3px_0_var(--color-ink)] ${
                isPremium ? 'bg-amber-200' : 'bg-pink-deep'
              }`}>
                {isPremium ? <Crown size={22} className="text-amber-700" /> : <Star size={22} className="text-white" />}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink/50">Berakhir</p>
                <p className="text-sm font-black text-ink">
                  {expiresAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl border-2 border-border font-black text-sm ${
                daysLeft !== null && daysLeft <= 5
                  ? 'bg-red-100 text-red-600 border-red-300'
                  : 'bg-white text-ink'
              }`}>
                {daysLeft} hari lagi
              </div>
            </div>
            {daysLeft !== null && daysLeft <= 7 && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-100 border-2 border-amber-300 rounded-xl">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-700">
                  Membership hampir habis! Perpanjang sekarang agar website tetap aktif.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Pending Membership ── */}
        {pendingMembership && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-amber-50 rounded-2xl border-[3px] border-amber-300 shadow-[4px_4px_0_var(--color-tan)]"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-ink">Menunggu Konfirmasi</p>
                <p className="text-xs font-medium text-ink/60">
                  Pembayaran <MembershipBadge plan={pendingMembership.plan} size="sm" />{' '}
                  ({formatRupiah(pendingMembership.nominal)}) sedang diverifikasi admin.
                </p>
              </div>
              <button onClick={refresh} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                <RefreshCw size={16} className="text-amber-600" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Plan Picker ── */}
        {!pendingMembership && (
          <AnimatePresence mode="wait">
            {step === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-pixel text-lg text-ink mb-4">
                  {isActive ? 'Perpanjang / Upgrade' : 'Pilih Paket'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`text-left p-5 rounded-2xl border-[3px] transition-all ${
                        selectedPlan === p.id
                          ? p.id === 'premium'
                            ? 'border-amber-400 bg-amber-50 shadow-[4px_4px_0_theme(colors.amber.400)]'
                            : 'border-pink-deep bg-pink-light shadow-[4px_4px_0_var(--color-pink-deep)]'
                          : 'border-border bg-white shadow-[3px_3px_0_var(--color-sage)] hover:border-pink-deep/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-border ${
                          selectedPlan === p.id
                            ? p.id === 'premium' ? 'bg-amber-200 text-amber-700' : 'bg-pink-deep text-white'
                            : 'bg-sage/30 text-ink'
                        }`}>
                          {p.icon}
                        </div>
                        {selectedPlan === p.id && (
                          <CheckCircle size={18} className={p.id === 'premium' ? 'text-amber-500' : 'text-pink-deep'} />
                        )}
                      </div>
                      <p className="font-pixel text-xl text-ink mb-0.5">{formatRupiah(p.price)}</p>
                      <p className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-3">{p.label} · 1 Bulan</p>
                      <ul className="space-y-1.5">
                        {p.features.map((f, i) => (
                          <li key={i} className={`flex items-center gap-2 text-xs font-medium ${f.ok ? 'text-ink/80' : 'text-ink/30 line-through'}`}>
                            <span className={f.ok ? (p.id === 'premium' ? 'text-amber-500' : 'text-pink-deep') : 'text-ink/20'}>
                              {f.icon}
                            </span>
                            {f.text}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <button
                  disabled={!selectedPlan}
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  Lanjut ke Pembayaran <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 'payment' && selectedPlan && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white border-[4px] border-border rounded-3xl shadow-[6px_6px_0_var(--color-sage)] p-6 mb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-pixel text-xl text-ink">Pembayaran</h2>
                    <MembershipBadge plan={selectedPlan} size="md" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-ink/70 leading-relaxed">
                      Scan QRIS di bawah, bayar sebesar <strong className="text-pink-deep">{formatRupiah(nominal)}</strong>, lalu klik <strong>Sudah Bayar</strong>.
                    </p>
                    {settings?.qris_image_url ? (
                      <div className="flex justify-center">
                        <img
                          src={settings.qris_image_url}
                          alt="QR QRIS"
                          className="w-52 h-52 object-contain border-[3px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)]"
                        />
                      </div>
                    ) : (
                      <div className="w-52 h-52 mx-auto bg-pink-light border-[3px] border-dashed border-border rounded-2xl flex items-center justify-center">
                        <p className="text-xs text-ink/40 text-center font-medium px-4">QR Code belum diatur admin</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <CreditCard size={18} className="text-amber-600 flex-shrink-0" />
                      <p className="text-xs font-bold text-ink/80">
                        Pastikan nominal transfer tepat: <span className="text-pink-deep">{formatRupiah(nominal)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('plan')}
                    className="flex-1 py-4 bg-white text-ink font-black text-sm rounded-2xl border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] hover:-translate-y-0.5 transition-all"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="flex-2 flex-1 py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mengirim...</>
                    ) : (
                      <><CheckCircle size={16} /> Sudah Bayar</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── History ── */}
        {allMemberships.length > 0 && (
          <div className="mt-10">
            <h3 className="font-pixel text-sm text-ink/60 uppercase tracking-widest mb-4">Riwayat Membership</h3>
            <div className="space-y-2">
              {allMemberships.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border-[2px] border-border/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.status === 'active' ? 'bg-green-100' :
                    m.status === 'pending' ? 'bg-amber-100' :
                    m.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {m.status === 'active'   && <CheckCircle size={14} className="text-green-600" />}
                    {m.status === 'pending'  && <Clock       size={14} className="text-amber-600" />}
                    {m.status === 'expired'  && <XCircle     size={14} className="text-gray-400" />}
                    {m.status === 'rejected' && <XCircle     size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MembershipBadge plan={m.plan} size="sm" />
                      <span className="text-xs font-bold text-ink/40">
                        {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    {m.status === 'active' && m.expires_at && (
                      <p className="text-[10px] font-medium text-ink/50">
                        Aktif s/d {new Date(m.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {m.status === 'rejected' && m.reject_reason && (
                      <p className="text-[10px] font-medium text-red-500">{m.reject_reason}</p>
                    )}
                  </div>
                  <span className="text-xs font-black text-ink/40">{formatRupiah(m.nominal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
