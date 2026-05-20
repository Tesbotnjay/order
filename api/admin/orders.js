// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import {
  requireAdminToken, getIp, checkRateLimit,
  isValidOrderId, generateSlug, sanitizeText,
} from '../_utils.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

async function tgSend(text) {
  if (!TELEGRAM_TOKEN || !ADMIN_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: 'Markdown' }),
  });
}

export default async function handler(req, res) {
  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 60, windowMs: 60_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limit exceeded' });
  if (!requireAdminToken(req, res)) return;

  const url = req.url || '';
  // Extract orderId and action from URL
  // Paths: /api/admin/orders, /api/admin/orders/:id, /api/admin/orders/:id/approve, etc.
  const parts = url.split('?')[0].split('/').filter(Boolean);
  // parts: ['api', 'admin', 'orders', <orderId?>, <action?>]
 const orderId = parts[3] || req.query?.orderId || null;
const action = parts[4] || req.query?.action || null;

  try {
    // ── GET /api/admin/orders ── List
    if (req.method === 'GET' && !orderId) {
      const { status, search, page = '1', limit: lim = '10' } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(lim, 10)));
      const from = (pageNum - 1) * limitNum;

      let query = supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + limitNum - 1);

      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`order_id.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return res.status(200).json({ orders: data || [], total: count || 0 });
    }

    // ── GET /api/admin/orders/:orderId ── Detail
    if (req.method === 'GET' && orderId) {
      if (!isValidOrderId(orderId)) return res.status(400).json({ error: 'Order ID tidak valid' });

      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Order tidak ditemukan' });
      return res.status(200).json({ order: data });
    }

    // ── POST /api/admin/orders/:orderId/approve ──
    if (req.method === 'POST' && orderId && action === 'approve') {
      if (!isValidOrderId(orderId)) return res.status(400).json({ error: 'Order ID tidak valid' });

      const slug = generateSlug();
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'approved', slug })
        .eq('order_id', orderId)
        .eq('status', 'pending');

      if (error) throw error;

      const appUrl = process.env.VITE_APP_URL || '';
      await tgSend(`✅ Order *${orderId}* diapprove via panel.\nLink: ${appUrl}/w/${slug}`);
      return res.status(200).json({ success: true, slug });
    }

    // ── POST /api/admin/orders/:orderId/reject ──
    if (req.method === 'POST' && orderId && action === 'reject') {
      if (!isValidOrderId(orderId)) return res.status(400).json({ error: 'Order ID tidak valid' });

      const reason = sanitizeText(req.body?.reason || '', 500);
      if (!reason) return res.status(400).json({ error: 'Alasan penolakan wajib diisi' });

      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'rejected', reject_reason: reason })
        .eq('order_id', orderId);

      if (error) throw error;
      await tgSend(`❌ Order *${orderId}* ditolak via panel.\nAlasan: _${reason}_`);
      return res.status(200).json({ success: true });
    }

    // ── POST /api/admin/orders/:orderId/delete ──
    if (req.method === 'POST' && orderId && action === 'delete') {
      if (!isValidOrderId(orderId)) return res.status(400).json({ error: 'Order ID tidak valid' });

      // Get asset_urls first to clean storage
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('asset_urls')
        .eq('order_id', orderId)
        .single();

      // Delete from DB
      const { error } = await supabaseAdmin.from('orders').delete().eq('order_id', orderId);
      if (error) throw error;

      // Clean up storage files
      const assets = order?.asset_urls || {};
      const photos = assets.photos || [];
      const music = assets.music;
      const toDelete = [];

      for (const url of photos) {
        const path = url.split('/storage/v1/object/public/assets/')[1];
        if (path) toDelete.push(path);
      }
      if (music) {
        const path = music.split('/storage/v1/object/public/assets/')[1];
        if (path) toDelete.push(path);
      }
      if (toDelete.length > 0) {
        await supabaseAdmin.storage.from('assets').remove(toDelete);
      }

      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  } catch (err) {
    console.error('[Admin Orders Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
