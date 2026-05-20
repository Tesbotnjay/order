import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { Button, StatusBadge, Modal, Textarea } from '../../components/ui/index';
import { toast, ToastContainer } from '../../components/ui/Toast';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, formatRupiah } from '../../utils/helpers';
import type { Order } from '../../store/orderStore';

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { token } = useAdminStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const headers = { 'X-Admin-Token': token || '' };

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`, { headers })
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const doAction = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}&action=${action}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(extra || {}),
      });
      if (!res.ok) throw new Error();
      const updated = await fetch(`/api/admin/orders/${orderId}`, { headers }).then((r) => r.json());
      setOrder(updated.order);
      toast.success(`Order berhasil di-${action}`);
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => doAction('approve');
  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Alasan wajib diisi'); return; }
    await doAction('reject', { reason: rejectReason });
    setRejectModal(false);
    setRejectReason('');
  };
  const handleDelete = async () => {
    await doAction('delete');
    navigate('/admin/orders');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="font-pixel text-ink/40">Memuat...</div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="font-pixel text-xl text-ink/40 mb-4">Order tidak ditemukan</p>
            <Link to="/admin/orders"><Button variant="secondary">Kembali</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const fd = order.form_data as Record<string, unknown>;
  const assets = (order.asset_urls || {}) as Record<string, unknown>;
  const photos = (assets.photos || []) as string[];
  const websiteUrl = order.slug ? `${appUrl}/w/${order.slug}` : null;

  // FIX: explicitly typed as [string, string][] so destructuring gives string, not unknown
  const orderFields: [string, string][] = [
    ['Pengirim', String(fd.nama_pengirim ?? '')],
    ['Penerima', String(fd.nama_penerima ?? '')],
    ['Nominal', formatRupiah(order.nominal)],
    ['Tanggal Spesial', String(fd.tanggal ?? '—')],
  ];

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />
      <ToastContainer />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin/orders">
              <button className="p-2 rounded-xl border-2 border-border hover:bg-pink-light transition-colors">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-pixel text-xl md:text-2xl text-ink">{order.order_id}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-ink/40 font-medium mt-1">{formatDate(order.created_at)}</p>
            </div>
            {/* Actions */}
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <Button variant="secondary" onClick={() => setRejectModal(true)} disabled={actionLoading}>
                    Tolak
                  </Button>
                  <Button variant="primary" onClick={handleApprove} loading={actionLoading}>
                    ✅ Approve
                  </Button>
                </>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary">
                    <ExternalLink size={16} />
                    Buka Site
                  </Button>
                </a>
              )}
              <Button variant="danger" onClick={() => setDeleteModal(true)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Data */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6 space-y-4">
              <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 border-b-2 border-admin-border pb-3">Data Pesanan</h2>
              {orderFields.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-ink/40">{label}</span>
                  <span className="text-sm font-bold text-ink">{value}</span>
                </div>
              ))}

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-ink/40 mb-2">Pesan</p>
                <p className="text-sm font-medium text-ink/80 leading-relaxed bg-cream rounded-xl p-3 border border-border/20">
                  {String(fd.pesan ?? '')}
                </p>
              </div>

              {order.status === 'rejected' && order.reject_reason && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Alasan Penolakan</p>
                  <p className="text-sm text-red-700">{order.reject_reason}</p>
                </div>
              )}

              {websiteUrl && (
                <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-1">Link Website</p>
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 font-bold hover:underline break-all">
                    {websiteUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Photos & Music */}
            <div className="space-y-6">
              {photos.length > 0 && (
                <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
                  <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 border-b-2 border-admin-border pb-3 mb-4">
                    Foto ({photos.length})
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="aspect-square object-cover rounded-xl border-2 border-border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!!assets.music && (
                <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
                  <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 border-b-2 border-admin-border pb-3 mb-4">Musik</h2>
                  <audio controls src={assets.music as string} className="w-full" />
                </div>
              )}

              {/* Highlights */}
              {!!(fd.highlight_title_1 || fd.highlight_title_2) && (
                <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
                  <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 border-b-2 border-admin-border pb-3 mb-4">Cerita</h2>
                  <div className="space-y-3">
                    {!!fd.highlight_title_1 && (
                      <div>
                        <p className="font-bold text-sm text-ink">{String(fd.highlight_title_1)}</p>
                        <p className="text-xs text-ink/60">{String(fd.highlight_desc_1 ?? '')}</p>
                      </div>
                    )}
                    {!!fd.highlight_title_2 && (
                      <div>
                        <p className="font-bold text-sm text-ink">{String(fd.highlight_title_2)}</p>
                        <p className="text-xs text-ink/60">{String(fd.highlight_desc_2 ?? '')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Tolak Pesanan">
        <div className="space-y-4">
          <Textarea label="Alasan Penolakan" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} maxLength={500} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal(false)}>Batal</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject}>Tolak</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Hapus Pesanan">
        <div className="space-y-4">
          <p className="text-sm text-ink/70">Yakin hapus pesanan <strong>{order.order_id}</strong>? Tidak bisa dibatalkan.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Batal</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>Hapus Permanen</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
