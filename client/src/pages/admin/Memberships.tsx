import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { useAdminStore } from '../../store/adminStore';
import { formatRupiah, formatDateShort } from '../../utils/helpers';

interface MembershipRow {
  id: string;
  user_id: string;
  plan: 'basic' | 'premium';
  status: 'pending' | 'active' | 'expired' | 'rejected';
  nominal: number;
  reject_reason: string | null;
  approved_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

const STATUS_META = {
  pending:  { label: 'Menunggu', color: 'bg-amber-100 text-amber-700 border-amber-300',  icon: <Clock size={12} /> },
  active:   { label: 'Aktif',    color: 'bg-green-100 text-green-700 border-green-300',   icon: <CheckCircle size={12} /> },
  expired:  { label: 'Habis',    color: 'bg-gray-100 text-gray-500 border-gray-300',      icon: <XCircle size={12} /> },
  rejected: { label: 'Ditolak',  color: 'bg-red-100 text-red-600 border-red-300',         icon: <XCircle size={12} /> },
};

export default function AdminMemberships() {
  const { token } = useAdminStore();
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const PER_PAGE = 15;
  const headers = { 'X-Admin-Token': token || '' };

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (filterStatus) qs.set('status', filterStatus);
    const res = await fetch(`/api/admin/memberships?${qs}`, { headers });
    const json = await res.json();
    setItems(json.memberships || []);
    setTotal(json.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filterStatus]);

  const approve = async (id: string) => {
    setProcessing(id);
    const res = await fetch(`/api/admin/memberships/${id}/approve`, { method: 'POST', headers });
    if (res.ok) { await load(); }
    else { const j = await res.json(); alert(j.error || 'Gagal approve'); }
    setProcessing(null);
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    const res = await fetch(`/api/admin/memberships/${id}/reject`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) { setRejectTarget(null); setRejectReason(''); await load(); }
    else { const j = await res.json(); alert(j.error || 'Gagal tolak'); }
    setProcessing(null);
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-pixel text-2xl md:text-3xl text-ink">Membership</h1>
              <p className="text-sm text-ink/50 font-medium mt-1">Kelola membership pelanggan</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border-2 border-amber-300 rounded-full text-xs font-black text-amber-700">
                  <AlertTriangle size={12} /> {pendingCount} menunggu
                </span>
              )}
              <button
                onClick={load}
                className="p-2.5 bg-white border-[2px] border-border rounded-xl hover:bg-pink-light transition-colors shadow-[3px_3px_0_var(--color-sage)]"
              >
                <RefreshCw size={16} className="text-ink/60" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(['', 'pending', 'active', 'expired'] as const).map((s) => {
              const labels = { '': 'Semua', pending: 'Pending', active: 'Aktif', expired: 'Habis' };
              const colors = { '': 'bg-white', pending: 'bg-amber-50', active: 'bg-green-50', expired: 'bg-gray-50' };
              return (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(1); }}
                  className={`p-4 rounded-2xl border-[3px] border-border text-left transition-all ${colors[s]} ${
                    filterStatus === s ? 'shadow-[4px_4px_0_var(--color-ink)]' : 'shadow-[3px_3px_0_var(--color-sage)] hover:-translate-y-0.5'
                  }`}
                >
                  <p className="text-xs font-black text-ink/50 uppercase tracking-widest mb-1">{labels[s]}</p>
                  <p className="font-pixel text-2xl text-ink">{total}</p>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white border-[3px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-pink-deep border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-ink/40 font-bold">Tidak ada membership</div>
            ) : (
              <div className="divide-y-2 divide-border/30">
                {items.map((m) => {
                  const meta = STATUS_META[m.status];
                  const expanded = expandedId === m.id;
                  const isPending = m.status === 'pending';
                  return (
                    <div key={m.id}>
                      {/* Row */}
                      <div
                        className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors ${isPending ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-surface'}`}
                        onClick={() => setExpandedId(expanded ? null : m.id)}
                      >
                        {/* Plan badge */}
                        <div className={`w-9 h-9 rounded-xl border-2 border-border flex items-center justify-center flex-shrink-0 ${
                          m.plan === 'premium' ? 'bg-amber-100' : 'bg-pink-light'
                        }`}>
                          {m.plan === 'premium' ? <Crown size={16} className="text-amber-600" /> : <Star size={16} className="text-pink-deep" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-ink truncate">
                              {m.profiles?.full_name || 'User'}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-ink/50">
                            {m.plan === 'premium' ? 'Premium' : 'Basic'} · {formatRupiah(m.nominal)} · {formatDateShort(m.created_at)}
                            {m.expires_at && m.status === 'active' && (
                              <span className="ml-2 text-green-600 font-bold">
                                s/d {new Date(m.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Quick approve button for pending */}
                        {isPending && (
                          <button
                            onClick={(e) => { e.stopPropagation(); approve(m.id); }}
                            disabled={processing === m.id}
                            className="px-4 py-2 bg-green-500 text-white text-xs font-black rounded-xl border-2 border-border shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 disabled:opacity-50 transition-all flex-shrink-0"
                          >
                            {processing === m.id ? '...' : '✓ Approve'}
                          </button>
                        )}

                        {/* Expand toggle */}
                        <div className="text-ink/30 flex-shrink-0">
                          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-2 bg-surface/40 space-y-4">
                              {/* Detail grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: 'User ID', val: m.user_id.slice(0, 8) + '...' },
                                  { label: 'Plan', val: m.plan === 'premium' ? '⭐ Premium' : '✦ Basic' },
                                  { label: 'Nominal', val: formatRupiah(m.nominal) },
                                  { label: 'Dibuat', val: formatDateShort(m.created_at) },
                                  ...(m.approved_at ? [{ label: 'Diapprove', val: formatDateShort(m.approved_at) }] : []),
                                  ...(m.expires_at ? [{ label: 'Berakhir', val: new Date(m.expires_at).toLocaleDateString('id-ID') }] : []),
                                  ...(m.reject_reason ? [{ label: 'Alasan Tolak', val: m.reject_reason }] : []),
                                ].map(({ label, val }) => (
                                  <div key={label} className="p-3 bg-white rounded-xl border-2 border-border/50">
                                    <p className="text-[10px] font-black text-ink/40 uppercase tracking-widest mb-0.5">{label}</p>
                                    <p className="text-xs font-bold text-ink break-all">{val}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Actions for pending */}
                              {isPending && (
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={() => approve(m.id)}
                                    disabled={processing === m.id}
                                    className="px-5 py-2.5 bg-green-500 text-white text-sm font-black rounded-xl border-2 border-border shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 disabled:opacity-50 transition-all"
                                  >
                                    ✓ Approve & Aktifkan
                                  </button>
                                  <button
                                    onClick={() => setRejectTarget(m.id)}
                                    className="px-5 py-2.5 bg-red-100 text-red-600 text-sm font-black rounded-xl border-2 border-red-300 hover:bg-red-200 transition-all"
                                  >
                                    ✕ Tolak
                                  </button>
                                </div>
                              )}

                              {/* Reject form */}
                              {rejectTarget === m.id && (
                                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
                                  <p className="text-sm font-black text-red-700">Alasan penolakan (wajib):</p>
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full p-3 text-sm font-medium rounded-xl border-2 border-red-300 bg-white resize-none focus:outline-none focus:border-red-500"
                                    rows={2}
                                    placeholder="Contoh: Bukti transfer tidak ditemukan"
                                    maxLength={300}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => reject(m.id)}
                                      disabled={!rejectReason.trim() || processing === m.id}
                                      className="px-4 py-2 bg-red-500 text-white text-xs font-black rounded-lg border-2 border-border disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                                    >
                                      {processing === m.id ? '...' : 'Kirim Penolakan'}
                                    </button>
                                    <button
                                      onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                                      className="px-4 py-2 bg-white text-ink/60 text-xs font-black rounded-lg border-2 border-border hover:bg-gray-50 transition-all"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold bg-white border-[2px] border-border rounded-xl disabled:opacity-40 hover:bg-pink-light transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-black text-ink/60">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-bold bg-white border-[2px] border-border rounded-xl disabled:opacity-40 hover:bg-pink-light transition-colors"
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
