import DOMPurify from 'dompurify';

// ── Text sanitization ──────────────────────────────────────────────────────
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')          // strip all HTML tags
    .replace(/javascript:/gi, '')      // prevent javascript: URI
    .replace(/on\w+\s*=/gi, '')        // strip event handlers
    .trim();
}

// ── HTML sanitization (for template rendering only) ────────────────────────
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'div', 'h1', 'h2', 'h3', 'img', 'audio', 'source'],
    ALLOWED_ATTR: ['class', 'id', 'src', 'controls', 'type', 'alt', 'style'],
    ALLOWED_URI_REGEXP: /^https:\/\//i,
    FORCE_BODY: true,
  });
}

// ── Safe redirect validation ───────────────────────────────────────────────
export function isSafeRedirect(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false;
  if (/[<>"']/.test(url)) return false;
  const ALLOWED_PREFIXES = ['/create', '/status', '/my-orders'];
  return ALLOWED_PREFIXES.some((p) => url.startsWith(p));
}

// ── UUID validation ────────────────────────────────────────────────────────
export function isValidUUID(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

// ── Order ID validation ────────────────────────────────────────────────────
export function isValidOrderId(val: string): boolean {
  return /^ORD-[A-Z0-9]{8}$/.test(val);
}

// ── Slug validation ────────────────────────────────────────────────────────
export function isValidSlug(val: string): boolean {
  return /^[a-z0-9][a-z0-9-]{8,58}[a-z0-9]$/.test(val);
}

// ── File magic bytes validation ────────────────────────────────────────────
export async function validateFileMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // MP3 ID3: 49 44 33
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  // MP3 sync: FF FB / FF F3 / FF F2
  if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) return true;

  return false;
}

// ── Generate safe filename ─────────────────────────────────────────────────
export function generateSafeFilename(original: string, prefix: string): string {
  const ext = original.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/, '') || 'bin';
  const safe = ['jpg', 'jpeg', 'png', 'mp3'].includes(ext) ? ext : 'bin';
  const rand = Math.random().toString(36).slice(2, 12);
  return `${prefix}-${Date.now()}-${rand}.${safe}`;
}

// ── Nominal whitelist ──────────────────────────────────────────────────────
export function isValidNominal(val: number): boolean {
  // Will be extended with values from settings; base check
  return Number.isInteger(val) && val > 0 && val <= 10_000_000;
}
