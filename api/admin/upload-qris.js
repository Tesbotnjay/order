// ⚠️ SERVER ONLY
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdminToken, getIp, checkRateLimit } from '../_utils.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getIp(req);
  const limit = checkRateLimit(ip, { maxReq: 10, windowMs: 3_600_000 });
  if (!limit.allowed) return res.status(429).json({ error: 'Rate limit exceeded' });
  if (!requireAdminToken(req, res)) return;

  try {
    // Parse multipart form data
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Simple multipart parse — find file boundary
    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary' });

    // Extract file bytes (simple heuristic: find double CRLF after headers)
    const boundaryBuf = Buffer.from(`--${boundary}`);
    const sep = Buffer.from('\r\n\r\n');
    let start = -1;
    for (let i = 0; i < buffer.length - sep.length; i++) {
      if (buffer.slice(i, i + sep.length).equals(sep)) { start = i + sep.length; break; }
    }
    if (start === -1) return res.status(400).json({ error: 'Cannot parse file' });

    const end = buffer.lastIndexOf(Buffer.from(`\r\n--${boundary}`));
    if (end === -1) return res.status(400).json({ error: 'Cannot parse file end' });

    const fileBuffer = buffer.slice(start, end);

    // Validate magic bytes
    const bytes = new Uint8Array(fileBuffer);
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    if (!isJpeg && !isPng) return res.status(400).json({ error: 'File harus JPG atau PNG' });
    if (fileBuffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'File terlalu besar (max 2MB)' });

    const ext = isJpeg ? 'jpg' : 'png';
    const fileName = `qris-${Date.now()}.${ext}`;
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';

    const { data, error } = await supabaseAdmin.storage
      .from('qris')
      .upload(fileName, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('qris').getPublicUrl(data.path);

    // Save to settings
    await supabaseAdmin.from('settings').update({ qris_image_url: publicUrl }).eq('id', 1);

    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error('[Upload QRIS Error]', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
}
