// ⚠️ SERVER ONLY
import { createHmac, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin.js';

// ── Rate limiting (in-memory, good enough for free tier scale) ──
const rateStore = new Map();

export function checkRateLimit(ip, { maxReq = 5, windowMs = 3_600_000 } = {}) {
  const now = Date.now();
  const entry = rateStore.get(ip) ?? { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  rateStore.set(ip, entry);
  if (entry.count > maxReq) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

export function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

// ── Admin token verification ──
export function generateAdminToken() {
  const ts = Math.floor(Date.now() / 1000);
  const secret = process.env.ADMIN_TOKEN_SECRET || 'fallback-secret';
  const payload = `${process.env.ADMIN_EMAIL}:${ts}`;
  const token = createHmac('sha256', secret).update(payload).digest('hex');
  const expiresAt = (ts + 8 * 3600) * 1000; // 8 hours in ms
  return { token: `${ts}.${token}`, expiresAt };
}

export function verifyAdminToken(tokenHeader) {
  if (!tokenHeader) return false;
  try {
    const [tsStr, hash] = tokenHeader.split('.');
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts)) return false;
    // Check expiry
    if (Date.now() > (ts + 8 * 3600) * 1000) return false;
    // Recompute HMAC
    const secret = process.env.ADMIN_TOKEN_SECRET || 'fallback-secret';
    const payload = `${process.env.ADMIN_EMAIL}:${ts}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    // Constant-time compare
    const a = Buffer.from(expected.padEnd(128));
    const b = Buffer.from(hash.padEnd(128));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function requireAdminToken(req, res) {
  const token = req.headers['x-admin-token'];
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ── Input validation ──
export function isValidOrderId(v) { return /^ORD-[A-Z0-9]{8}$/.test(v); }
export function isValidSlug(v) { return /^[a-z0-9][a-z0-9-]{8,58}[a-z0-9]$/.test(v); }
export function isValidUUID(v) { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }

// ── Brute force check for admin login ──
export async function checkAdminBruteForce(ip) {
  const { count } = await supabaseAdmin
    .from('admin_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());
  return (count || 0) >= 5;
}

export async function recordLoginAttempt(ip, success) {
  await supabaseAdmin.from('admin_login_attempts').insert({ ip_address: ip, success });
}

// ── Generate slug ──
export function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'mem-';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  s += '-love';
  return s;
}

// ── Sanitize text ──
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
