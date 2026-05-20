// ⚠️ SERVER ONLY — /api/memberships.js
import { supabaseAdmin } from './supabaseAdmin.js';
import { getIp, checkRateLimit } from './_utils.js';

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
  const limit = checkRateLimit(ip, { maxReq: 10, windowMs: 60_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Terlalu banyak permintaan' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth via Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token tidak valid' });

  const { plan } = req.body || {};
  if (!['basic', 'premium'].includes(plan)) {
    return res.status(400).json({ error: 'Plan tidak valid' });
  }

  // Get prices from settings
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('basic_price, premium_price')
    .eq('id', 1)
    .single();

  const nominal = plan === 'premium'
    ? (settings?.premium_price || 20000)
    : (settings?.basic_price  || 15000);

  // Block duplicate pending
  const { data: existing } = await supabaseAdmin
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Kamu sudah punya membership yang menunggu konfirmasi.' });
  }

  const { data: membership, error: insertErr } = await supabaseAdmin
    .from('memberships')
    .insert({ user_id: user.id, plan, nominal, status: 'pending' })
    .select('id')
    .single();

  if (insertErr) throw insertErr;

  // Notify admin
  const planLabel = plan === 'premium' ? 'Premium 🌟' : 'Basic ⭐';
  await tgSend(
    `💳 *Membership Baru!*\nUser: ${user.email}\nPlan: ${planLabel}\nNominal: Rp ${nominal.toLocaleString('id-ID')}\n\nKonfirmasi di panel admin.`
  );

  return res.status(201).json({ success: true, membershipId: membership.id });
}
