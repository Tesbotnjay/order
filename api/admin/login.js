// ⚠️ SERVER ONLY
import {
  checkAdminBruteForce,
  recordLoginAttempt,
  generateAdminToken,
  getIp,
  checkRateLimit,
} from '../_utils.js';
import { timingSafeEqual } from 'crypto';

function safeCompare(a, b) {
  const bufA = Buffer.from(String(a).padEnd(256));
  const bufB = Buffer.from(String(b).padEnd(256));
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limit: 10 attempts per IP per 15 min
  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.', retryAfter: limit.retryAfter });
  }

  // Artificial delay to slow brute force
  await new Promise((r) => setTimeout(r, 500));

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    // Check brute force from Supabase
    const locked = await checkAdminBruteForce(ip);
    if (locked) {
      return res.status(429).json({ error: 'Akun terkunci 15 menit karena terlalu banyak percobaan gagal.' });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

    const emailMatch = safeCompare(email, ADMIN_EMAIL);
    const passwordMatch = safeCompare(password, ADMIN_PASSWORD);

    if (!emailMatch || !passwordMatch) {
      await recordLoginAttempt(ip, false);
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    await recordLoginAttempt(ip, true);

    const { token, expiresAt } = generateAdminToken();
    return res.status(200).json({ token, expiresAt });
  } catch (err) {
    console.error('[Admin Login Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
