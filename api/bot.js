// ⚠️ SERVER ONLY — Vercel Serverless Function
import { supabaseAdmin } from './supabaseAdmin.js';
import { generateSlug, isValidOrderId } from './_utils.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.VITE_APP_URL || '';

async function tgApi(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// FIX: authorize if the message is in admin chat OR the clicker is the admin user
function isAuthorized(chatId, fromId) {
  const allowed = String(ALLOWED_CHAT_ID);
  return String(chatId) === allowed || String(fromId) === allowed;
}

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') return res.status(405).end();

  // Verify webhook secret (skip check if WEBHOOK_SECRET is not configured)
  if (WEBHOOK_SECRET) {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (!secret || secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const update = req.body;

  try {
    // ── Handle callback_query (Approve / Reject buttons) ──
    if (update.callback_query) {
      const { id: cbId, message, data: callbackData, from } = update.callback_query;
      const chatId = String(message?.chat?.id);
      const fromId = String(from?.id);

      // Only allow from admin chat or admin user
      if (!isAuthorized(chatId, fromId)) {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: '⛔ Not authorized' });
        return res.status(200).end();
      }

      // Validate callback data strictly
      const VALID_CALLBACK = /^(approve|reject)_ORD-[A-Z0-9]{8}$/;
      if (!VALID_CALLBACK.test(callbackData)) {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId });
        return res.status(200).end();
      }

      const [action, orderId] = callbackData.split('_ORD-');
      const fullOrderId = `ORD-${orderId}`;

      if (action === 'approve') {
        const slug = generateSlug();
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ status: 'approved', slug })
          .eq('order_id', fullOrderId)
          .eq('status', 'pending'); // only approve if still pending

        if (error) {
          await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: '❌ Gagal update order' });
        } else {
          await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: '✅ Order diapprove!' });
          await tgApi('sendMessage', {
            chat_id: chatId,
            text: `✅ Order *${fullOrderId}* telah diapprove!\n\nLink: ${APP_URL}/w/${slug}`,
            parse_mode: 'Markdown',
          });
          // Edit original message to remove buttons
          await tgApi('editMessageReplyMarkup', {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: { inline_keyboard: [] },
          });
        }
      } else if (action === 'reject') {
        // Store pending reject state in Supabase (10 min TTL)
        await supabaseAdmin.from('bot_pending_reject').upsert({
          order_id: fullOrderId,
          chat_id: chatId,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: 'Ketik alasan penolakan' });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `❌ Balas pesan ini dengan alasan penolakan untuk order *${fullOrderId}*:`,
          parse_mode: 'Markdown',
        });
        await tgApi('editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: message.message_id,
          reply_markup: { inline_keyboard: [] },
        });
      }

      return res.status(200).end();
    }

    // ── Handle text message (reject reason) ──
    if (update.message?.text) {
      const { chat, text, from } = update.message;
      const chatId = String(chat.id);
      const fromId = String(from?.id);

      if (!isAuthorized(chatId, fromId)) return res.status(200).end();

      // Check pending reject
      const { data: pending } = await supabaseAdmin
        .from('bot_pending_reject')
        .select('order_id')
        .eq('chat_id', chatId)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (pending?.order_id) {
        const reason = text.slice(0, 500);
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ status: 'rejected', reject_reason: reason })
          .eq('order_id', pending.order_id);

        // Clean up
        await supabaseAdmin.from('bot_pending_reject').delete().eq('order_id', pending.order_id);

        if (!error) {
          await tgApi('sendMessage', {
            chat_id: chatId,
            text: `✅ Order *${pending.order_id}* ditolak dengan alasan:\n_${reason}_`,
            parse_mode: 'Markdown',
          });
        }
      }
    }
  } catch (err) {
    console.error('[Bot Error]', err.message);
  }

  return res.status(200).end();
}
