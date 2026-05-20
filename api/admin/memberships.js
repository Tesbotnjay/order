// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdminToken, getIp, checkRateLimit } from '../_utils.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID  = process.env.TELEGRAM_ADMIN_CHAT_ID;

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

  // Vercel dynamic params: /api/admin/memberships/[id]/[action]
  const membershipId = req.query?.id || null;
  const action = req.query?.action || null;

  try {
    // ── GET /api/admin/memberships ── List
    if (req.method === 'GET' && !membershipId) {
      const { status, page = '1', limit: lim = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(lim, 10)));
      const from = (pageNum - 1) * limitNum;

      let query = supabaseAdmin
        .from('memberships')
        .select('*', { count: 'exact' })
        .order('status', { ascending: true })   // pending first (p < a alphabetically... use created_at)
        .order('created_at', { ascending: false })
        .range(from, from + limitNum - 1);

      if (status && ['pending', 'active', 'expired', 'rejected'].includes(status)) {
        query = query.eq('status', status);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // Fetch profile names separately to avoid FK dependency
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
      }

      const enriched = (data || []).map(m => ({
        ...m,
        profiles: { full_name: profileMap[m.user_id] || null },
      }));

      return res.status(200).json({ memberships: enriched, total: count || 0 });
    }

    // ── POST /api/admin/memberships/:id/approve ──
    if (req.method === 'POST' && membershipId && action === 'approve') {
      // Validate UUID format
      if (!/^[0-9a-f-]{36}$/.test(membershipId)) {
        return res.status(400).json({ error: 'ID tidak valid' });
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { data: membership, error: fetchErr } = await supabaseAdmin
        .from('memberships')
        .select('user_id, plan, nominal')
        .eq('id', membershipId)
        .eq('status', 'pending')
        .single();

      if (fetchErr || !membership) {
        return res.status(404).json({ error: 'Membership tidak ditemukan atau sudah diproses' });
      }

      // Expire any currently active memberships for this user
      await supabaseAdmin
        .from('memberships')
        .update({ status: 'expired', updated_at: now.toISOString() })
        .eq('user_id', membership.user_id)
        .eq('status', 'active');

      // Activate this membership
      const { error: updateErr } = await supabaseAdmin
        .from('memberships')
        .update({
          status: 'active',
          approved_at: now.toISOString(),
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', membershipId);

      if (updateErr) throw updateErr;

      // Notify via Telegram
      const planLabel = membership.plan === 'premium' ? 'Premium 🌟' : 'Basic ⭐';
      await tgSend(
        `✅ Membership *${planLabel}* diaktifkan.\nExpiry: ${expiresAt.toLocaleDateString('id-ID')}`
      );

      return res.status(200).json({
        success: true,
        expires_at: expiresAt.toISOString(),
      });
    }

    // ── POST /api/admin/memberships/:id/reject ──
    if (req.method === 'POST' && membershipId && action === 'reject') {
      if (!/^[0-9a-f-]{36}$/.test(membershipId)) {
        return res.status(400).json({ error: 'ID tidak valid' });
      }

      const { reason } = req.body || {};
      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ error: 'Alasan penolakan wajib diisi' });
      }

      const { error } = await supabaseAdmin
        .from('memberships')
        .update({
          status: 'rejected',
          reject_reason: reason.trim().slice(0, 300),
          updated_at: new Date().toISOString(),
        })
        .eq('id', membershipId)
        .eq('status', 'pending');

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  } catch (err) {
    console.error('[admin/memberships]', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
