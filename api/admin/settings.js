// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdminToken, getIp, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 60, windowMs: 60_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limit exceeded' });
  if (!requireAdminToken(req, res)) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return res.status(200).json({ settings: data });
    }

    if (req.method === 'PUT') {
      const {
        basic_price, premium_price,
        basic_label, premium_label,
        basic_description, premium_description,
        store_open, whatsapp_number, telegram_chat_id,
        qris_image_url,
      } = req.body || {};

      // Validate
      const payload = {};
      if (basic_price !== undefined) {
        const p = parseInt(basic_price, 10);
        if (isNaN(p) || p < 1000 || p > 10_000_000) return res.status(400).json({ error: 'Harga basic tidak valid' });
        payload.basic_price = p;
      }
      if (premium_price !== undefined) {
        const p = parseInt(premium_price, 10);
        if (isNaN(p) || p < 1000 || p > 10_000_000) return res.status(400).json({ error: 'Harga premium tidak valid' });
        payload.premium_price = p;
      }
      if (basic_label) payload.basic_label = String(basic_label).slice(0, 50);
      if (premium_label) payload.premium_label = String(premium_label).slice(0, 50);
      if (basic_description !== undefined) payload.basic_description = String(basic_description).slice(0, 300);
      if (premium_description !== undefined) payload.premium_description = String(premium_description).slice(0, 300);
      if (typeof store_open === 'boolean') payload.store_open = store_open;
      if (whatsapp_number !== undefined) {
        if (whatsapp_number && !/^[0-9]{8,15}$/.test(whatsapp_number)) {
          return res.status(400).json({ error: 'Nomor WhatsApp tidak valid' });
        }
        payload.whatsapp_number = whatsapp_number || null;
      }
      if (telegram_chat_id !== undefined) {
        if (telegram_chat_id && !/^-?[0-9]+$/.test(telegram_chat_id)) {
          return res.status(400).json({ error: 'Telegram Chat ID tidak valid' });
        }
        payload.telegram_chat_id = telegram_chat_id || null;
      }
      if (qris_image_url !== undefined) {
        if (qris_image_url && !qris_image_url.startsWith('https://')) {
          return res.status(400).json({ error: 'QRIS URL tidak valid' });
        }
        payload.qris_image_url = qris_image_url || null;
      }

      const { error } = await supabaseAdmin.from('settings').update(payload).eq('id', 1);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error('[Settings Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
