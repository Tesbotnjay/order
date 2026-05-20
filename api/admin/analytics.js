// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdminToken, getIp, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 60, windowMs: 60_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limit exceeded' });

  if (!requireAdminToken(req, res)) return;

  const rangeDays = parseInt(req.query.range || '30', 10);
  if (isNaN(rangeDays) || rangeDays < 1 || rangeDays > 365) {
    return res.status(400).json({ error: 'Range tidak valid' });
  }

  try {
    const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('order_id, status, nominal, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    const all = orders || [];
    const approved = all.filter((o) => o.status === 'approved');

    // Daily aggregation
    const dailyMap = new Map();
    for (const o of all) {
      const day = o.created_at.slice(0, 10);
      const entry = dailyMap.get(day) || { date: day, count: 0, revenue: 0 };
      entry.count++;
      if (o.status === 'approved') entry.revenue += o.nominal || 0;
      dailyMap.set(day, entry);
    }

    // Sort and add cumulative revenue
    let cum = 0;
    const daily = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => {
        cum += d.revenue;
        return { ...d, cumRevenue: cum, date: d.date.slice(5) }; // "MM-DD"
      });

    // Hourly breakdown
    const hourlyMap = new Map();
    for (let h = 0; h < 24; h++) hourlyMap.set(h, { hour: h, count: 0 });
    for (const o of all) {
      const h = new Date(o.created_at).getHours();
      hourlyMap.get(h).count++;
    }
    const hourly = Array.from(hourlyMap.values());

    // Nominal split
    const n15 = all.filter((o) => o.nominal === 15000).length;
    const n20 = all.filter((o) => o.nominal === 20000).length;
    const nominalSplit = [
      { name: 'Rp 15.000', value: n15 },
      { name: 'Rp 20.000', value: n20 },
    ];

    const totalRevenue = approved.reduce((s, o) => s + (o.nominal || 0), 0);
    const avgPerDay = all.length / Math.max(rangeDays, 1);
    const conversionRate = all.length > 0 ? approved.length / all.length : 0;

    return res.status(200).json({
      daily,
      hourly,
      nominalSplit,
      stats: {
        total: all.length,
        revenue: totalRevenue,
        avgPerDay,
        conversionRate,
      },
    });
  } catch (err) {
    console.error('[Analytics Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
