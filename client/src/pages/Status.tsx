import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Download, Share2, ExternalLink, RefreshCw, Heart } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/ui/ProtectedRoute';
import { Navbar } from '../components/ui/Navbar';
import { Button, StatusBadge, PageLoader } from '../components/ui/index';
import { toast, ToastContainer } from '../components/ui/Toast';
import { formatDate, formatRupiah, copyToClipboard, buildWhatsAppUrl } from '../utils/helpers';
import { isValidOrderId } from '../utils/security';
import type { Order } from '../store/orderStore';
import QRCode from 'qrcode';

function StatusInner() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrFrame, setQrFrame] = useState<'square' | 'heart'>('square');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Validate orderId format
  if (!orderId || !isValidOrderId(orderId)) {
    navigate('/my-orders');
    return null;
  }

  const fetchOrder = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('buyer_id', user.id)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setOrder(data as Order);
    setLoading(false);

    if (data.slug) {
      const url = `${import.meta.env.VITE_APP_URL || window.location.origin}/w/${data.slug}`;
      QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#4A4444', light: '#FDFBF7' } })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchOrder();

    // Realtime subscription
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setOrder(payload.new as Order);
        if (payload.new.status === 'approved') toast.success('🎉 Pesananmu disetujui!');
        if (payload.new.status === 'rejected') toast.error('Pesanan ditolak. Cek alasannya di bawah.');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, orderId]);

  const websiteUrl = order?.slug
    ? `${import.meta.env.VITE_APP_URL || window.location.origin}/w/${order.slug}`
    : '';

  const handleCopyLink = async () => {
    await copyToClipboard(websiteUrl);
    toast.success('Link berhasil disalin!');
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    if (qrFrame !== 'heart') {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `qr-${orderId}.png`;
      link.click();
      return;
    }
    // Heart-shaped QR download via canvas
    const size = 400;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // Pink background
    ctx.fillStyle = '#fff0f3';
    ctx.fillRect(0, 0, size, size);
    // Heart clip path
    ctx.save();
    ctx.beginPath();
    const s = size;
    ctx.moveTo(s * 0.5, s * 0.85);
    ctx.bezierCurveTo(s * 0.1, s * 0.6, s * 0.0, s * 0.3, s * 0.25, s * 0.2);
    ctx.bezierCurveTo(s * 0.37, s * 0.13, s * 0.5, s * 0.18, s * 0.5, s * 0.28);
    ctx.bezierCurveTo(s * 0.5, s * 0.18, s * 0.63, s * 0.13, s * 0.75, s * 0.2);
    ctx.bezierCurveTo(s * 1.0, s * 0.3, s * 0.9, s * 0.6, s * 0.5, s * 0.85);
    ctx.closePath();
    ctx.clip();
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, s * 0.06, s * 0.1, s * 0.88, s * 0.88);
      ctx.restore();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-love-${orderId}.png`;
      link.click();
    };
    img.src = qrDataUrl;
  };

  const handleShareWA = () => {
    if (!websiteUrl) return;
    const settings = { whatsapp_number: '' };
    const msg = `Hai! Aku punya website spesial untukmu!\n${websiteUrl}`;
    window.open(buildWhatsAppUrl('', msg).replace('wa.me/', 'wa.me/'), '_blank');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <PageLoader />;

  if (notFound) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-pixel text-xl text-ink mb-3">Bukan Pesananmu</h2>
          <p className="text-sm text-ink/60 font-medium mb-6">Pesanan ini tidak ditemukan atau bukan milikmu.</p>
          <Link to="/my-orders">
            <Button variant="primary">Lihat Pesananku</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fd = order?.form_data as Record<string, string>;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <ToastContainer />

      <div className="pt-28 md:pt-36 pb-20 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-pixel text-3xl text-ink mb-2">Status Pesanan</h1>
          <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{orderId}</p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] p-6 md:p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-2">Status Pesanan</p>
              {order && <StatusBadge status={order.status} />}
            </div>
            <button onClick={fetchOrder} className="p-2 rounded-xl border-2 border-border hover:bg-pink-light transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-1">Penerima</p>
              <p className="font-bold text-ink">{fd?.nama_penerima || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-1">Nominal</p>
              <p className="font-bold text-ink">{order && formatRupiah(order.nominal)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-1">Tanggal Order</p>
              <p className="text-sm font-medium text-ink/70">{order && formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Pending */}
          {order?.status === 'pending' && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="animate-spin text-yellow-500">⏳</div>
              <div>
                <p className="font-bold text-sm text-yellow-800">Menunggu Konfirmasi Admin</p>
                <p className="text-xs text-yellow-600">Biasanya diproses dalam 1x24 jam. Halaman ini otomatis update!</p>
              </div>
            </div>
          )}

          {/* Rejected */}
          {order?.status === 'rejected' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="font-bold text-sm text-red-700 mb-1">Pesanan Ditolak</p>
                {order.reject_reason && (
                  <p className="text-xs text-red-600">{order.reject_reason}</p>
                )}
              </div>
              <Link to="/create">
                <Button variant="secondary" className="w-full">
                  <RefreshCw size={16} />
                  Buat Ulang Pesanan
                </Button>
              </Link>
            </div>
          )}

          {/* Approved */}
          {order?.status === 'approved' && websiteUrl && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
                
                <div>
                  <p className="font-bold text-sm text-green-800">Website Kamu Sudah Siap!</p>
                  <p className="text-xs text-green-600">Bagikan link atau QR code di bawah ini.</p>
                </div>
              </div>

              {/* Link */}
              <div className="flex gap-3">
                <div className="flex-1 px-4 py-3 bg-cream border-[3px] border-border rounded-xl text-sm font-medium text-ink/70 truncate">
                  {websiteUrl}
                </div>
                <Button variant="secondary" onClick={handleCopyLink}>
                  <Copy size={16} />
                </Button>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary">
                    <ExternalLink size={16} />
                  </Button>
                </a>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-ink/50 mb-4">QR Code</p>

                  {/* Frame toggle */}
                  <div className="flex gap-2 justify-center mb-4">
                    {(['square', 'heart'] as const).map((frame) => (
                      <button
                        key={frame}
                        onClick={() => setQrFrame(frame)}
                        className={`px-4 py-2 text-xs font-black rounded-xl border-[2px] transition-all ${
                          qrFrame === frame
                            ? 'bg-pink-deep text-white border-border shadow-[3px_3px_0_var(--color-border)]'
                            : 'bg-white text-ink border-border/50 hover:border-border'
                        }`}
                      >
                        {frame === 'square' ? 'Kotak' : 'Hati'}
                      </button>
                    ))}
                  </div>

                  {qrFrame === 'heart' ? (
                    /* Heart QR — pure SVG, works semua browser termasuk Safari */
                    <svg
                      width="220" height="220"
                      viewBox="0 0 220 220"
                      style={{ filter: 'drop-shadow(0 8px 24px rgba(255,133,161,0.5))' }}
                    >
                      <defs>
                        <clipPath id="heartQrClip">
                          {/* Heart path dalam koordinat 0-220 */}
                          <path d="M110,185 C30,135 5,70 50,45 C74,28 110,40 110,62 C110,40 146,28 170,45 C215,70 190,135 110,185 Z" />
                        </clipPath>
                        <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ffb3c6" />
                          <stop offset="100%" stopColor="#ff85a1" />
                        </linearGradient>
                      </defs>
                      {/* Pink heart background */}
                      <rect width="220" height="220" fill="url(#heartGrad)" clipPath="url(#heartQrClip)" />
                      {/* QR code image clipped to heart */}
                      <image
                        href={qrDataUrl}
                        x="20" y="25"
                        width="180" height="180"
                        clipPath="url(#heartQrClip)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </svg>
                  ) : (
                    <div className="inline-block p-4 bg-white border-[4px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-sage)] relative">
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                      <div className="absolute top-2 left-2 w-4 h-4 border-l-4 border-t-4 border-pink-deep" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-r-4 border-t-4 border-pink-deep" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-4 border-b-4 border-pink-deep" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-4 border-b-4 border-pink-deep" />
                    </div>
                  )}

                  <div className="flex gap-3 justify-center mt-4">
                    <Button variant="secondary" onClick={handleDownloadQR}>
                      <Download size={16} />
                      Download QR
                    </Button>
                    <Button variant="primary" onClick={handleShareWA}>
                      <Share2 size={16} />
                      Share WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="text-center">
          <Link to="/my-orders" className="text-sm font-bold text-ink/50 hover:text-pink-deep transition-colors underline">
            Lihat Semua Pesanan →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Status() {
  return (
    <ProtectedRoute>
      <StatusInner />
    </ProtectedRoute>
  );
}
