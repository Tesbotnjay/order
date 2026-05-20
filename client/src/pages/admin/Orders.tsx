import { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { OrderTable } from '../../components/admin/StatCard';
import { Button, Modal, Input, Textarea } from '../../components/ui/index';
import { toast, ToastContainer } from '../../components/ui/Toast';
import { useAdminStore } from '../../store/adminStore';
import { useAdminOrders } from '../../hooks/useOrders';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];

export default function AdminOrders() {
  const { token } = useAdminStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const { orders, total, loading, refetch } = useAdminOrders({
    status: status === 'all' ? undefined : status,
    search: search || undefined,
    page,
    limit: 10,
  });

  const totalPages = Math.ceil(total / 10);

  const doAction = async (action: string, orderId: string, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}&action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' },
        body: JSON.stringify(extra || {}),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order berhasil di-${action}`);
      refetch();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (orderId: string) => doAction('approve', orderId);

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Alasan penolakan wajib diisi'); return; }
    await doAction('reject', rejectModal.orderId, { reason: rejectReason });
    setRejectModal({ open: false, orderId: '' });
    setRejectReason('');
  };

  const handleDelete = async () => {
    await doAction('delete', deleteModal.orderId);
    setDeleteModal({ open: false, orderId: '' });
  };

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />
      <ToastContainer />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-pixel text-2xl md:text-3xl text-ink">Transaksi</h1>
            <p className="text-sm text-ink/50 font-medium mt-1">Kelola semua pesanan</p>
          </div>

          {/* Filters */}
          <div className="bg-white border-2 border-admin-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Cari order ID, nama, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-border/40 rounded-xl text-sm font-medium focus:outline-none focus:border-pink-deep transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-2 text-xs font-black uppercase rounded-xl border-2 transition-all ${
                    status === s
                      ? 'bg-pink-deep text-white border-border shadow-[3px_3px_0_var(--color-border)]'
                      : 'bg-white text-ink/60 border-border/30 hover:border-border'
                  }`}
                >
                  {s === 'all' ? 'Semua' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border-2 border-admin-border rounded-2xl overflow-hidden">
            <OrderTable
              orders={orders}
              loading={loading}
              onApprove={handleApprove}
              onReject={(id) => setRejectModal({ open: true, orderId: id })}
              onDelete={(id) => setDeleteModal({ open: true, orderId: id })}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t-2 border-admin-border">
                <p className="text-xs font-medium text-ink/50">
                  {total} pesanan · Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl border-2 border-border/30 hover:border-border disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl border-2 border-border/30 hover:border-border disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, orderId: '' })}
        title="Tolak Pesanan"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink/70 font-medium">
            Berikan alasan penolakan. Pembeli akan melihat pesan ini.
          </p>
          <Textarea
            label="Alasan Penolakan"
            placeholder="Contoh: Bukti pembayaran tidak ditemukan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, orderId: '' })}>
              Batal
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject}>
              Tolak Pesanan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, orderId: '' })}
        title="Hapus Pesanan"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink/70 font-medium">
            Yakin ingin menghapus pesanan <strong>{deleteModal.orderId}</strong>? Semua file terkait juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, orderId: '' })}>
              Batal
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
