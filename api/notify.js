// ⚠️ SERVER ONLY — Vercel Serverless Function
import { supabaseAdmin } from './supabaseAdmin.js';
import { checkRateLimit, getIp, isValidOrderId } from './_utils.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 5, windowMs: 3_600_000 });
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many requests', retryAfter: limit.retryAfter });
  }

  try {
    const { orderId, userEmail } = req.body || {};

    if (!orderId || !isValidOrderId(orderId)) {
      return res.status(400).json({ error: 'Order ID tidak valid' });
    }

    // Fetch order data (using service role so we get full data)
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_id, nominal, form_data, status')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const fd = order.form_data || {};

    // Compose Telegram message
    const text = [
      `🛍️ *Pesanan Baru Masuk!*`,
      ``,
      `📌 Order ID: \`${order.order_id}\``,
      `👤 Pengirim: ${fd.nama_pengirim || '—'}`,
      `💌 Penerima: ${fd.nama_penerima || '—'}`,
      `📧 Email: ${userEmail || '—'}`,
      `💰 Nominal: Rp ${order.nominal?.toLocaleString('id-ID')}`,
      ``,
      `📝 Pesan:`,
      `_${(fd.pesan || '').slice(0, 300)}${(fd.pesan || '').length > 300 ? '...' : ''}_`,
    ].join('\n');

    const inline_keyboard = [
      [
        { text: '✅ Approve', callback_data: `approve_${order.order_id}` },
        { text: '❌ Reject', callback_data: `reject_${order.order_id}` },
      ],
    ];

    if (TELEGRAM_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Notify Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
