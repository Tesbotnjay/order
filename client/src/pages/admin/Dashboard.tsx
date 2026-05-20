import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ShoppingBag, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { StatCard } from '../../components/admin/StatCard';
import { OrderTable } from '../../components/admin/StatCard';
import { useAdminStore } from '../../store/adminStore';
import { formatRupiah, formatDateShort } from '../../utils/helpers';
import type { Order } from '../../store/orderStore';

const PIE_COLORS = ['#E8A1B0', '#A5C4B1', '#C9A98A'];

export default function AdminDashboard() {
  const { token } = useAdminStore();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [dailyOrders, setDailyOrders] = useState<{ date: string; count: number; revenue: number }[]>([]);
  const [nominalSplit, setNominalSplit] = useState<{ name: string; value: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { 'X-Admin-Token': token || '' };

    Promise.all([
      fetch('/api/admin/stats', { headers }).then((r) => r.json()),
      fetch('/api/admin/analytics?range=7', { headers }).then((r) => r.json()),
      fetch('/api/admin/orders?limit=5', { headers }).then((r) => r.json()),
    ])
      .then(([statsData, analyticsData, ordersData]) => {
        setStats(statsData);
        setDailyOrders(analyticsData.daily || []);
        setNominalSplit(analyticsData.nominalSplit || []);
        setRecentOrders(ordersData.orders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-pixel text-2xl md:text-3xl text-ink">Dashboard</h1>
            <p className="text-sm text-ink/50 font-medium mt-1">Selamat datang di panel admin Pixel Memories</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Order"
              value={loading ? '—' : stats.total || 0}
              icon={<ShoppingBag size={22} />}
              color="var(--color-tan)"
            />
            <StatCard
              label="Pending"
              value={loading ? '—' : stats.pending || 0}
              icon={<Clock size={22} />}
              color="#F9C84A"
            />
            <StatCard
              label="Approved"
              value={loading ? '—' : stats.approved || 0}
              icon={<CheckCircle size={22} />}
              color="#81C784"
            />
            <StatCard
              label="Rejected"
              value={loading ? '—' : stats.rejected || 0}
              icon={<XCircle size={22} />}
              color="#EF9A9A"
            />
          </div>

          {/* Revenue stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Pendapatan"
              value={loading ? '—' : formatRupiah(stats.totalRevenue || 0)}
              icon={<DollarSign size={22} />}
              color="var(--color-pink-deep)"
            />
            <StatCard
              label="Hari Ini"
              value={loading ? '—' : formatRupiah(stats.todayRevenue || 0)}
              icon={<TrendingUp size={22} />}
              color="var(--color-sage-dark)"
            />
            <StatCard
              label="Bulan Ini"
              value={loading ? '—' : formatRupiah(stats.monthRevenue || 0)}
              icon={<Calendar size={22} />}
              color="var(--color-gold)"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Bar chart - orders per day */}
            <div className="lg:col-span-2 bg-white border-2 border-admin-border rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-ink/70 mb-6">Order 7 Hari Terakhir</h3>
              {loading ? (
                <div className="h-48 bg-surface animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }}
                    />
                    <Bar dataKey="count" fill="#E8A1B0" radius={[6, 6, 0, 0]} name="Order" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart - nominal split */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-ink/70 mb-6">Nominal Order</h3>
              {loading ? (
                <div className="h-48 bg-surface animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={nominalSplit} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {nominalSplit.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue line chart */}
          <div className="bg-white border-2 border-admin-border rounded-2xl p-6 mb-8">
            <h3 className="font-black text-sm uppercase tracking-widest text-ink/70 mb-6">Pendapatan per Hari</h3>
            {loading ? (
              <div className="h-48 bg-surface animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                  <Tooltip
                    formatter={(v: number) => [formatRupiah(v), 'Pendapatan']}
                    contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#E8A1B0" strokeWidth={3} dot={{ fill: '#E8A1B0', r: 5, strokeWidth: 2, stroke: '#4A4444' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-ink/70">5 Order Terbaru</h3>
              <Link to="/admin/orders" className="text-xs font-bold text-pink-deep hover:underline">
                Lihat Semua →
              </Link>
            </div>
            <OrderTable orders={recentOrders} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
