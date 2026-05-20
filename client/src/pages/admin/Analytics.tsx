import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { StatCard } from '../../components/admin/StatCard';
import { useAnalytics } from '../../hooks/useOrders';
import { formatRupiah } from '../../utils/helpers';
import { TrendingUp, ShoppingBag, Clock, CheckCircle } from 'lucide-react';

const RANGES = [
  { label: 'Hari Ini', value: '1' },
  { label: '7 Hari', value: '7' },
  { label: '30 Hari', value: '30' },
  { label: '3 Bulan', value: '90' },
];

export default function AdminAnalytics() {
  const [range, setRange] = useState('30');
  const { data, loading } = useAnalytics(range);

  const stats = (data?.stats || {}) as Record<string, number>;
  const daily = (data?.daily || []) as { date: string; count: number; revenue: number; cumRevenue: number }[];
  const hourly = (data?.hourly || []) as { hour: number; count: number }[];
  const nominalSplit = (data?.nominalSplit || []) as { name: string; value: number }[];

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-pixel text-2xl md:text-3xl text-ink">Analitik</h1>
              <p className="text-sm text-ink/50 font-medium mt-1">Data performa penjualan</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-4 py-2 text-xs font-black rounded-xl border-2 transition-all ${
                    range === r.value
                      ? 'bg-pink-deep text-white border-border shadow-[3px_3px_0_var(--color-border)]'
                      : 'bg-white text-ink/60 border-border/30 hover:border-border'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Order" value={loading ? '—' : stats.total || 0} icon={<ShoppingBag size={22} />} color="var(--color-tan)" />
            <StatCard label="Pendapatan" value={loading ? '—' : formatRupiah(stats.revenue || 0)} icon={<TrendingUp size={22} />} color="var(--color-pink-deep)" />
            <StatCard label="Rata-rata/hari" value={loading ? '—' : (stats.avgPerDay || 0).toFixed(1)} icon={<Clock size={22} />} color="var(--color-sage-dark)" />
            <StatCard label="Conversion" value={loading ? '—' : `${((stats.conversionRate || 0) * 100).toFixed(0)}%`} icon={<CheckCircle size={22} />} color="#81C784" />
          </div>

          {/* Area chart - cumulative revenue */}
          <div className="bg-white border-2 border-admin-border rounded-2xl p-6 mb-6">
            <h3 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-6">Akumulasi Pendapatan</h3>
            {loading ? (
              <div className="h-48 bg-surface animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8A1B0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E8A1B0" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fontFamily: 'Quicksand', fontWeight: 700 }} />
                  <Tooltip formatter={(v: number) => [formatRupiah(v), 'Akumulasi']} contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }} />
                  <Area type="monotone" dataKey="cumRevenue" stroke="#E8A1B0" strokeWidth={3} fill="url(#revenueGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Orders per day */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-6">Order per Hari</h3>
              {loading ? (
                <div className="h-48 bg-surface animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <Tooltip contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }} />
                    <Bar dataKey="count" fill="#A5C4B1" radius={[6, 6, 0, 0]} name="Order" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Hourly heatmap-style */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-6">Order per Jam</h3>
              {loading ? (
                <div className="h-48 bg-surface animate-pulse rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 9, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'Quicksand', fontWeight: 700 }} />
                    <Tooltip labelFormatter={(l) => `Jam ${l}:00`} contentStyle={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 12, borderRadius: 12, border: '2px solid #4A4444' }} />
                    <Bar dataKey="count" fill="#C9A98A" radius={[4, 4, 0, 0]} name="Order" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Nominal split */}
          <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
            <h3 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-6">Distribusi Nominal</h3>
            {loading ? (
              <div className="h-24 bg-surface animate-pulse rounded-xl" />
            ) : (
              <div className="flex gap-4 flex-wrap">
                {nominalSplit.map((item, i) => (
                  <div key={i} className="flex-1 min-w-[120px] p-4 bg-cream border-2 border-admin-border rounded-xl text-center">
                    <p className="font-pixel text-2xl text-ink">{item.value}</p>
                    <p className="text-xs font-bold text-ink/50 mt-1">{item.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
