import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ExternalLink, Copy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { ProtectedRoute } from '../components/ui/ProtectedRoute';
import { Navbar } from '../components/ui/Navbar';
import { Button, StatusBadge, PageLoader } from '../components/ui/index';
import { toast, ToastContainer } from '../components/ui/Toast';
import { formatDate, formatRupiah, copyToClipboard } from '../utils/helpers';

function MyOrdersInner() {
  const { user } = useAuthStore();
  const { myOrders, fetchMyOrders } = useOrderStore();
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    if (user?.id) fetchMyOrders(user.id);
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <ToastContainer />

      <div className="pt-28 md:pt-36 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-pixel text-3xl text-ink">Pesananku</h1>
            <p className="text-sm text-ink/50 font-medium mt-1">Semua pesanan yang pernah kamu buat</p>
          </div>
          <Link to="/create">
            <Button variant="primary">
              <Plus size={18} />
              Buat Baru
            </Button>
          </Link>
        </div>

        {myOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)]"
          >
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-pixel text-xl text-ink mb-3">Belum Ada Pesanan</h3>
            <p className="text-sm text-ink/60 font-medium mb-8">Buat website kenangan pertamamu sekarang!</p>
            <Link to="/create">
              <Button variant="primary" size="lg">
                <Plus size={18} />
                Buat Pesanan Pertama
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order, i) => {
              const fd = order.form_data as Record<string, string>;
              const websiteUrl = order.slug ? `${appUrl}/w/${order.slug}` : null;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border-[3px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)] p-5 hover:shadow-[6px_6px_0_var(--color-pink-soft)] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-pixel text-xs text-ink/50">{order.order_id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="font-bold text-ink">
                        Untuk: <span className="text-pink-deep">{fd?.nama_penerima || '—'}</span>
                      </p>
                      <p className="text-sm text-ink/50 font-medium mt-1">
                        {formatRupiah(order.nominal)} · {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(order.status === 'pending' || order.status === 'rejected') && (
                        <Link to={`/status/${order.order_id}`}>
                          <Button variant="secondary" size="sm">Lihat Status</Button>
                        </Link>
                      )}
                      {order.status === 'approved' && websiteUrl && (
                        <>
                          <button
                            onClick={async () => {
                              await copyToClipboard(websiteUrl);
                              toast.success('Link disalin!');
                            }}
                            className="p-2 rounded-xl border-2 border-border hover:bg-pink-light transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm">
                              <ExternalLink size={14} />
                              Buka Website
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyOrders() {
  return (
    <ProtectedRoute>
      <MyOrdersInner />
    </ProtectedRoute>
  );
}
