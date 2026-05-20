// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdminToken, checkRateLimit, getIp } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 60, windowMs: 60_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limit exceeded' });

  if (!requireAdminToken(req, res)) return;

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

    const [
      { count: total },
      { count: pending },
      { count: approved },
      { count: rejected },
      { data: approvedOrders },
    ] = await Promise.all([
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabaseAdmin.from('orders').select('nominal, created_at').eq('status', 'approved'),
    ]);

    const orders = approvedOrders || [];
    const totalRevenue = orders.reduce((s, o) => s + (o.nominal || 0), 0);
    const todayRevenue = orders
      .filter((o) => o.created_at >= startOfDay)
      .reduce((s, o) => s + (o.nominal || 0), 0);
    const weekRevenue = orders
      .filter((o) => o.created_at >= startOfWeek)
      .reduce((s, o) => s + (o.nominal || 0), 0);
    const monthRevenue = orders
      .filter((o) => o.created_at >= startOfMonth)
      .reduce((s, o) => s + (o.nominal || 0), 0);

    return res.status(200).json({
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
    });
  } catch (err) {
    console.error('[Stats Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
