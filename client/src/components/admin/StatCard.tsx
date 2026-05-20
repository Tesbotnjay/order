import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatusBadge } from '../ui/index';
import { formatRupiah, formatDateShort } from '../../utils/helpers';
import type { Order } from '../../store/orderStore';

// ── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

export function StatCard({ label, value, icon, trend, color = 'var(--color-tan)' }: StatCardProps) {
  return (
    <div className="admin-stat-card relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
          style={{ background: `${color}20`, borderColor: `${color}40` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              trend.value >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}
          >
            {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-ink mb-1">{value}</p>
      <p className="text-xs font-medium text-ink/50 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Order Table ────────────────────────────────────────────────────────────
interface OrderTableProps {
  orders: Order[];
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  loading?: boolean;
}

export function OrderTable({ orders, onApprove, onReject, onDelete, loading }: OrderTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-xl animate-pulse border border-admin-border" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-pixel text-ink/30 text-lg">Belum ada pesanan</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-admin-border">
            {['Order ID', 'Pemesan', 'Nominal', 'Status', 'Tanggal', 'Aksi'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-ink/50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const fd = order.form_data as Record<string, string>;
            return (
              <tr
                key={order.id}
                className="border-b border-admin-border/50 hover:bg-surface transition-colors group"
              >
                <td className="px-4 py-4">
                  <span className="font-pixel text-xs text-ink/70">{order.order_id}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-ink text-sm">{fd?.nama_pengirim || '—'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="font-bold text-ink">{formatRupiah(order.nominal)}</span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-xs text-ink/50">
                  {formatDateShort(order.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/orders/${order.order_id}`}
                      className="text-xs font-bold px-3 py-1.5 bg-white border-2 border-border rounded-lg hover:bg-pink-light transition-colors"
                    >
                      Detail
                    </Link>
                    {order.status === 'pending' && (
                      <>
                        {onApprove && (
                          <button
                            onClick={() => onApprove(order.order_id)}
                            className="text-xs font-bold px-3 py-1.5 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {onReject && (
                          <button
                            onClick={() => onReject(order.order_id)}
                            className="text-xs font-bold px-3 py-1.5 bg-red-50 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(order.order_id)}
                        className="text-xs font-bold px-3 py-1.5 bg-red-50 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
