import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Download, RotateCcw, ChevronRight, FlipHorizontal, Timer, Crown, Lock, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { useMembership } from '../hooks/useBuyerAuth';
import { useAuthStore } from '../store/authStore';

// ── Frame config ──────────────────────────────────────────────────────────────
const FRAMES = [
  // slotRects = pixel-accurate bounds of each transparent hole, measured directly from PNG alpha channel.
  // Format: [x1, y1, x2, y2] normalised 0-1 relative to frame image dimensions.
  { id: 'frame_01_airmail', name: 'Airmail Strip', slots: 2, layout: '1x2',
    // Frame has ONE wide hole — split vertically into 2 equal halves
    slotRects: [[0.341,0.277,0.671,0.492],[0.341,0.492,0.671,0.708]] },
  { id: 'frame_02_filmstrip', name: 'Film Strip', slots: 4, layout: '1x4',
    slotRects: [[0.347,0.225,0.653,0.359],[0.347,0.378,0.653,0.512],[0.347,0.532,0.653,0.666],[0.339,0.684,0.653,0.819]] },
  { id: 'frame_03_blue_polaroid', name: 'Blue Polaroid', slots: 6, layout: '2x3',
    // Each polaroid has a small window at its centre; stickers are opaque above the window
    slotRects: [[0.152,0.104,0.370,0.232],[0.609,0.104,0.826,0.232],[0.166,0.425,0.357,0.541],[0.586,0.430,0.810,0.539],[0.168,0.740,0.356,0.854],[0.655,0.746,0.806,0.851]] },
  { id: 'frame_04_black_party', name: 'Black Party', slots: 6, layout: '2x3',
    slotRects: [[0.117,0.114,0.485,0.330],[0.514,0.103,0.894,0.330],[0.117,0.362,0.485,0.578],[0.514,0.352,0.894,0.579],[0.105,0.600,0.485,0.827],[0.514,0.612,0.894,0.839]] },
  { id: 'frame_05_gingham_2x4', name: 'Blue Gingham 2x4', slots: 8, layout: '2x4',
    slotRects: [[0.092,0.271,0.443,0.409],[0.557,0.271,0.895,0.403],[0.099,0.433,0.442,0.566],[0.554,0.423,0.890,0.556],[0.109,0.586,0.447,0.719],[0.552,0.578,0.891,0.715],[0.107,0.737,0.446,0.870],[0.572,0.726,0.909,0.862]] },
  { id: 'frame_06_mymelody', name: 'My Melody', slots: 4, layout: '1x4',
    slotRects: [[0.270,0.169,0.717,0.323],[0.298,0.330,0.758,0.521],[0.293,0.533,0.723,0.693],[0.269,0.684,0.757,0.891]] },
  { id: 'frame_07_vintage', name: 'Vintage', slots: 6, layout: '2x3',
    slotRects: [[0.042,0.033,0.484,0.254],[0.522,0.032,0.964,0.255],[0.042,0.270,0.484,0.492],[0.522,0.270,0.964,0.492],[0.042,0.509,0.484,0.729],[0.522,0.509,0.964,0.729]] },
  { id: 'frame_08_gingham_1x4', name: 'Gingham Strip', slots: 4, layout: '1x4',
    // Actual holes are narrower than old rects; updated to pixel-measured bounds
    slotRects: [[0.298,0.129,0.701,0.284],[0.306,0.320,0.693,0.476],[0.298,0.521,0.701,0.681],[0.273,0.715,0.671,0.873]] },
  { id: 'frame_09_zootopia', name: 'Zootopia', slots: 2, layout: '1x2 overlap',
    slotRects: [[0.049,0.109,0.779,0.499],[0.230,0.520,0.958,0.919]] },
  { id: 'frame_10_shinchan', name: 'Shin-chan', slots: 4, layout: '1x3 + 1',
    slotRects: [[0.087,0.095,0.394,0.259],[0.080,0.290,0.408,0.669],[0.091,0.689,0.394,0.863],[0.515,0.221,0.920,0.666]] },
  { id: 'frame_11_hellokitty', name: 'Hello Kitty', slots: 8, layout: '2x4',
    slotRects: [[0.045,0.036,0.470,0.236],[0.529,0.036,0.951,0.236],[0.045,0.241,0.470,0.442],[0.529,0.242,0.951,0.442],[0.041,0.449,0.470,0.649],[0.529,0.449,0.951,0.648],[0.046,0.652,0.470,0.852],[0.529,0.652,0.952,0.852]] },
  { id: 'frame_12_hellosummer', name: 'Hello Summer', slots: 4, layout: '2x2',
    slotRects: [[0.072,0.264,0.488,0.598],[0.511,0.264,0.927,0.598],[0.072,0.613,0.488,0.947],[0.511,0.613,0.927,0.947]] },
  // ── New frames ──────────────────────────────────────────────────────────────
  { id: 'frame_13_hachiware', name: 'Hachiware', slots: 4, layout: '1x4',
    slotRects: [[0.177,0.024,0.91,0.232],[0.177,0.242,0.91,0.428],[0.177,0.438,0.91,0.633],[0.177,0.644,0.91,0.841]] },
  { id: 'frame_14_chiikawa', name: 'Chiikawa', slots: 4, layout: '1x4',
    slotRects: [[0.215,0.043,0.908,0.23],[0.179,0.242,0.91,0.435],[0.179,0.441,0.908,0.64],[0.179,0.651,0.908,0.834]] },
  { id: 'frame_15_molang', name: 'Molang Hearts', slots: 3, layout: '1x3',
    slotRects: [[0.20,0.040,0.83,0.262],[0.20,0.295,0.83,0.517],[0.20,0.550,0.83,0.772]] },
  { id: 'frame_16_christmas', name: 'Merry Christmas', slots: 4, layout: '1x4',
    slotRects: [[0.27,0.07,0.75,0.18],[0.27,0.22,0.75,0.40],[0.29,0.43,0.75,0.63],[0.25,0.82,0.75,0.94]] },
  { id: 'frame_17_mymelody', name: 'My Melody Strip', slots: 3, layout: '1x3',
    slotRects: [[0.42,0.00,0.91,0.33],[0.42,0.34,0.91,0.67],[0.42,0.68,0.91,1.00]] },
  { id: 'frame_18_sweet_piano', name: 'My Sweet Piano', slots: 3, layout: '1x3',
    slotRects: [[0.136,0.096,0.87,0.377],[0.136,0.388,0.868,0.669],[0.136,0.681,0.87,0.96]] },
  { id: 'frame_19_ricky', name: 'Photo Time Ricky', slots: 4, layout: '1x4',
    slotRects: [[0.13,0.074,0.931,0.239],[0.13,0.253,0.931,0.405],[0.13,0.454,0.931,0.624],[0.13,0.657,0.927,0.832]] },
  { id: 'frame_20_breakfast', name: 'Good Morning', slots: 6, layout: '2x3',
    slotRects: [[0.088,0.112,0.485,0.365],[0.516,0.11,0.894,0.33],[0.109,0.358,0.485,0.578],[0.516,0.356,0.894,0.578],[0.109,0.602,0.485,0.833],[0.516,0.602,0.913,0.877]] },
  { id: 'frame_21_coquette', name: 'Coquette', slots: 3, layout: 'free',
    slotRects: [[0.01,0.06,0.5,0.352],[0.496,0.322,0.94,0.581],[0.115,0.62,0.567,0.871]] },
  { id: 'frame_22_hyunjin', name: 'Hyunjin Day', slots: 3, layout: '1x3',
    slotRects: [[0.147,0.056,0.864,0.266],[0.13,0.304,0.872,0.513],[0.152,0.562,0.867,0.772]] },
  { id: 'frame_23_hellokitty_wink', name: 'Hello Kitty Wink', slots: 1, layout: '1x1',
    slotRects: [[0.192,0.131,0.804,0.788]] },
  { id: 'frame_24_kuromi_melody', name: 'Kuromi × Melody', slots: 1, layout: '1x1',
    slotRects: [[0.12,0.257,0.88,0.829]] },
] as const;

type FrameType = typeof FRAMES[number];
// Steps: select frame → shoot photos → review each shot → composite final
type Step = 'select' | 'shoot' | 'review-shots' | 'composite';

interface CapturedPhoto { dataUrl: string; slotIdx: number; }

export default function Photobooth() {
  const { user } = useAuthStore();
  const { isPremium, isActive, loading: memberLoading } = useMembership();

  const [step, setStep] = useState<Step>('select');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>(FRAMES[0]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [compositeUrl, setCompositeUrl] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [retakeSlot, setRetakeSlot] = useState(-1); // -1 = not retaking
  const [flashActive, setFlashActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number>(0);
  // Tracks current slot AR so captureShot can read it without stale closure
  const slotArRef = useRef<number>(1);

  // ── Frame natural AR — loaded once per selected frame ──────────────────────
  // slotRects are normalized [0..1] coords. To get correct pixel AR we MUST
  // multiply by the frame image's own aspect ratio (width/height).
  // Without this, a portrait frame (e.g. 500×1600) would have its slots
  // computed with the wrong AR → camera crops face/head incorrectly.
  const [frameNaturalAR, setFrameNaturalAR] = useState<number>(1);
  const frameNaturalARRef = useRef<number>(1); // stays in sync for closures

  useEffect(() => {
    let cancelled = false;
    setFrameNaturalAR(1); // reset while loading
    frameNaturalARRef.current = 1;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const ar = img.naturalWidth / img.naturalHeight;
      setFrameNaturalAR(ar);
      frameNaturalARRef.current = ar;
    };
    img.onerror = () => {
      // Fallback: assume portrait 3:4 which covers most photo frames
      if (!cancelled) { setFrameNaturalAR(0.75); frameNaturalARRef.current = 0.75; }
    };
    img.src = `/frames/${selectedFrame.id}.png`;
    return () => { cancelled = true; };
  }, [selectedFrame.id]);

  // ── Helper: compute aspect ratio (w/h) for a specific slot ──
  // Must account for the frame image's own AR so normalized coords map correctly
  const getSlotAR = (frame: FrameType, slotIdx: number, frameAR: number): number => {
    const rect = frame.slotRects[Math.min(slotIdx, frame.slotRects.length - 1)];
    const normW = rect[2] - rect[0]; // normalized width  (0-1)
    const normH = rect[3] - rect[1]; // normalized height (0-1)
    // pixel_w / pixel_h = (normW * framePixelW) / (normH * framePixelH)
    //                   = (normW / normH) * (framePixelW / framePixelH)
    //                   = (normW / normH) * frameAR
    return (normW / normH) * frameAR;
  };

  // ── Derived: active slot index & AR ──
  const activeSlotIdx = retakeSlot >= 0 ? retakeSlot : currentSlot;
  const slotAR = getSlotAR(selectedFrame, activeSlotIdx, frameNaturalAR);
  // Keep ref in sync so captureShot sees current value
  slotArRef.current = slotAR;

  // ── Canvas dimensions that match the current slot's shape ──
  // Use 1080 as the fixed "long side" for HD quality
  const LONG = 1080;
  const canvasW = slotAR >= 1 ? LONG : Math.round(LONG * slotAR);
  const canvasH = slotAR >= 1 ? Math.round(LONG / slotAR) : LONG;

  // Sync canvas element dims imperatively so the draw loop gets correct W/H immediately
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
  }, [canvasW, canvasH]);

  const releaseAllTracks = useCallback(async () => {
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    await new Promise((r) => setTimeout(r, 300));
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser kamu tidak mendukung akses kamera. Coba Chrome atau Safari terbaru.');
      return;
    }
    await releaseAllTracks();
    const strategies: MediaStreamConstraints[] = [
      // Try Full HD first (portrait-aware: some phones give 1080x1920 natively)
      { video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: true, audio: false },
    ];
    let lastError: unknown = null;
    for (const constraint of strategies) {
      try {
        const s = await navigator.mediaDevices.getUserMedia(constraint);
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await new Promise<void>((resolve) => {
            const v = videoRef.current!;
            const onReady = () => { v.removeEventListener('canplay', onReady); resolve(); };
            v.addEventListener('canplay', onReady);
            v.play().catch(() => resolve());
          });
          setCameraReady(true);
        }
        return;
      } catch (err) {
        lastError = err;
        const name = (err as DOMException)?.name;
        if (name === 'NotReadableError' || name === 'TrackStartError') await new Promise((r) => setTimeout(r, 500));
      }
    }
    const err = lastError as DOMException | null;
    if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError')
      setCameraError('Akses kamera ditolak. Klik ikon kunci di address bar → izinkan Kamera → coba lagi.');
    else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError')
      setCameraError('Tidak ada kamera yang terdeteksi. Pastikan kamera terpasang dan driver-nya aktif.');
    else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError')
      setCameraError('Browser gagal membuka kamera. Refresh halaman ini, atau tutup tab lain yang pakai kamera.');
    else
      setCameraError(`Kamera tidak bisa dibuka (${err?.name || 'unknown'}). Coba refresh halaman lalu izinkan akses kamera.`);
  }, [releaseAllTracks]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setCameraReady(false);
  }, [stream]);

  useEffect(() => {
    if (step === 'shoot') startCamera();
    return () => { if (step !== 'shoot') stopCamera(); };
  }, [step]);

  // Draw CLEAN camera preview (NO frame overlay during shooting)
  useEffect(() => {
    if (step !== 'shoot' || !stream || !cameraReady) return;
    const canvas = previewCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d')!;
    const draw = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        // Cover-fit video
        const vAR = video.videoWidth / video.videoHeight;
        const cAR = W / H;
        let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
        if (vAR > cAR) { sw = video.videoHeight * cAR; sx = (video.videoWidth - sw) / 2; }
        else { sh = video.videoWidth / cAR; sy = (video.videoHeight - sh) / 2; }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [step, stream, mirrored, cameraReady]);

  // Capture one clean shot (no frame baked in)
  const captureShot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    // Capture at the exact same AR as the target slot — zero unexpected crop
    const ar = slotArRef.current;
    const snap = document.createElement('canvas');
    snap.width  = ar >= 1 ? LONG : Math.round(LONG * ar);
    snap.height = ar >= 1 ? Math.round(LONG / ar) : LONG;
    const ctx = snap.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Cover-fit video into snap at slot AR
    const vAR = video.videoWidth / video.videoHeight;
    const cAR = snap.width / snap.height;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (vAR > cAR) { sw = video.videoHeight * cAR; sx = (video.videoWidth - sw) / 2; }
    else { sh = video.videoWidth / cAR; sy = (video.videoHeight - sh) / 2; }
    ctx.save();
    if (mirrored) { ctx.translate(snap.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, snap.width, snap.height);
    ctx.restore();

    const dataUrl = snap.toDataURL('image/jpeg', 0.92);
    const targetSlot = retakeSlot >= 0 ? retakeSlot : currentSlot;

    setPhotos((prev) => {
      const next = [...prev];
      const existing = next.findIndex((p) => p.slotIdx === targetSlot);
      if (existing >= 0) next[existing] = { dataUrl, slotIdx: targetSlot };
      else next.push({ dataUrl, slotIdx: targetSlot });
      return next;
    });

    if (retakeSlot >= 0) {
      setRetakeSlot(-1);
      stopCamera();
      setStep('review-shots');
    } else {
      const nextSlot = currentSlot + 1;
      if (nextSlot >= selectedFrame.slots) { stopCamera(); setStep('review-shots'); }
      else setCurrentSlot(nextSlot);
    }
  }, [currentSlot, selectedFrame, mirrored, retakeSlot, stopCamera]);

  const startCountdown = useCallback((secs = 3) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(secs);
    let remaining = secs;
    countdownRef.current = setInterval(() => {
      remaining--;
      if (remaining <= 0) { clearInterval(countdownRef.current!); setCountdown(null); captureShot(); }
      else setCountdown(remaining);
    }, 1000);
  }, [captureShot]);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // Build composite ONLY when entering composite step
  useEffect(() => {
    if (step !== 'composite' || photos.length === 0) return;
    const frameImg = new window.Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.src = `/frames/${selectedFrame.id}.png`;
    frameImg.onload = () => {
      // Render at 2× natural size so photos stay sharp inside slots
      const SCALE = 2;
      const W = frameImg.naturalWidth * SCALE, H = frameImg.naturalHeight * SCALE;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);

      const loadPhoto = (idx: number): Promise<void> => new Promise((res) => {
        const ph = photos[idx];
        if (!ph) { res(); return; }
        const img = new window.Image();
        img.onload = () => {
          const [x1n, y1n, x2n, y2n] = selectedFrame.slotRects[ph.slotIdx];
          const sx = x1n * W, sy = y1n * H, sw = (x2n - x1n) * W, sh = (y2n - y1n) * H;
          const srcAR = img.width / img.height, dstAR = sw / sh;
          let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
          if (srcAR > dstAR) { srcW = img.height * dstAR; srcX = (img.width - srcW) / 2; }
          else { srcH = img.width / dstAR; srcY = (img.height - srcH) / 2; }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, srcX, srcY, srcW, srcH, sx, sy, sw, sh);
          res();
        };
        img.src = ph.dataUrl;
      });

      Promise.all(photos.map((_, i) => loadPhoto(i))).then(() => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(frameImg, 0, 0, W, H);
        // High quality JPEG at 97%
        setCompositeUrl(canvas.toDataURL('image/jpeg', 0.97));
      });
    };
  }, [step, photos, selectedFrame]);

  const handleDownload = () => {
    if (!compositeUrl) return;
    const a = document.createElement('a');
    a.href = compositeUrl;
    a.download = `photobooth-${selectedFrame.id}-${Date.now()}.jpg`;
    a.click();
  };

  const handleRetakeSlot = (slotIdx: number) => {
    setRetakeSlot(slotIdx);
    setCompositeUrl('');
    setStep('shoot');
  };

  const totalSlots = selectedFrame.slots;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 md:pt-28 pb-16 px-4 max-w-2xl mx-auto">

        {memberLoading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-pink-deep border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!memberLoading && !user && (
          <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 bg-pink-light border-[3px] border-border rounded-full flex items-center justify-center">
              <Lock size={24} className="text-pink-deep" />
            </div>
            <h2 className="font-pixel text-xl text-ink mb-3">Login Dulu</h2>
            <p className="text-sm text-ink/60 font-medium mb-5">Photobooth memerlukan akun dengan membership Premium.</p>
            <Link to="/auth?redirect=/photobooth" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-deep text-white font-black rounded-xl border-[3px] border-border shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all text-sm">
              Masuk / Daftar
            </Link>
          </div>
        )}

        {!memberLoading && user && !isPremium && (
          <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-50 border-[3px] border-amber-300 rounded-full flex items-center justify-center">
              <Crown size={24} className="text-amber-600" />
            </div>
            <h2 className="font-pixel text-xl text-ink mb-2">Fitur Premium</h2>
            <p className="text-sm text-ink/60 font-medium mb-2 leading-relaxed">
              Photobooth hanya tersedia untuk membership <strong>Premium</strong> (Rp 20.000/bulan).
            </p>
            {isActive && <p className="text-xs text-ink/40 font-medium mb-4">Kamu saat ini punya Basic — upgrade ke Premium untuk akses photobooth.</p>}
            <Link to="/membership" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-white font-black rounded-xl border-[3px] border-border shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all text-sm">
              <Crown size={16} /> {isActive ? 'Upgrade ke Premium' : 'Beli Premium'}
            </Link>
          </div>
        )}

        {!memberLoading && user && isPremium && (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-pixel text-3xl text-ink mb-2">Photobooth</h1>
              <p className="text-sm font-medium text-ink/60">Pilih frame, foto pakai kamera HP, download hasilnya.</p>
            </div>

            {/* ── SELECT FRAME ── */}
            {step === 'select' && (
              <div>
                <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide mb-6">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFrame(f)}
                      className={`flex-shrink-0 snap-center w-28 rounded-2xl border-[3px] overflow-hidden transition-all ${
                        selectedFrame.id === f.id
                          ? 'border-pink-deep shadow-[4px_4px_0_var(--color-pink-deep)] scale-105'
                          : 'border-border shadow-[3px_3px_0_var(--color-sage)] hover:border-pink-deep/50'
                      }`}
                    >
                      <img src={`/frames/${f.id}.png`} alt={f.name} className="w-full h-36 object-cover bg-white" />
                      <div className="bg-white px-2 py-1.5">
                        <p className="text-[10px] font-black text-ink truncate">{f.name}</p>
                        <p className="text-[9px] text-ink/50 font-medium">{f.slots} foto</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-white border-[4px] border-border rounded-3xl shadow-[6px_6px_0_var(--color-sage)] p-6 mb-6">
                  <div className="flex items-start gap-6">
                    <img src={`/frames/${selectedFrame.id}.png`} alt={selectedFrame.name} className="w-32 rounded-xl border-2 border-border bg-pink-light/30 object-contain" />
                    <div className="flex-1">
                      <h3 className="font-pixel text-xl text-ink mb-1">{selectedFrame.name}</h3>
                      <p className="text-xs font-bold text-ink/50 uppercase tracking-widest mb-4">{selectedFrame.layout} &middot; {selectedFrame.slots} foto</p>
                      <div className="space-y-1.5 text-xs font-medium text-ink/70">
                        <p>📸 Foto {selectedFrame.slots}x dengan countdown</p>
                        <p>👀 Cek setiap foto sebelum disusun</p>
                        <p>✨ Foto otomatis fit ke frame</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slot shape preview — shows the actual camera crop AR for each slot */}
                <div className="mb-4 p-3 bg-pink-light/40 border-2 border-border rounded-2xl">
                  <p className="text-[10px] font-black text-ink/50 uppercase tracking-widest mb-2 text-center">Bentuk kamera tiap slot</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {selectedFrame.slotRects.map((rect, i) => {
                      const normW = rect[2] - rect[0];
                      const normH = rect[3] - rect[1];
                      const ar = (normW / normH) * frameNaturalAR;
                      const dW = ar >= 1 ? 36 : Math.round(36 * ar);
                      const dH = ar >= 1 ? Math.round(36 / ar) : 36;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="bg-pink-deep/20 border-2 border-pink-deep/40 rounded" style={{ width: dW, height: dH }} />
                          <span className="text-[9px] font-bold text-ink/40">{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => { setPhotos([]); setCurrentSlot(0); setRetakeSlot(-1); setCompositeUrl(''); setStep('shoot'); }}
                  className="w-full py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-ink)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Mulai Foto
                </button>
              </div>
            )}

            {/* ── SHOOT ── */}
            {step === 'shoot' && (
              <div>
                {cameraError ? (
                  <div className="bg-white border-[4px] border-border rounded-3xl p-8 text-center shadow-[6px_6px_0_var(--color-sage)]">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 border-[3px] border-red-200 rounded-full flex items-center justify-center">
                      <Camera size={28} className="text-red-400" />
                    </div>
                    <h3 className="font-pixel text-lg text-ink mb-2">Kamera Tidak Terdeteksi</h3>
                    <p className="text-sm font-medium text-ink/60 mb-4 leading-relaxed">{cameraError}</p>
                    <div className="space-y-1 text-xs text-ink/50 font-medium mb-6 bg-pink-light/30 rounded-xl p-4 text-left">
                      <p className="font-bold text-ink/70 mb-2">💡 Cara izinkan kamera:</p>
                      <p>• Klik ikon 🔒 di address bar browser</p>
                      <p>• Pilih "Izinkan" untuk Kamera</p>
                      <p>• Lalu klik tombol "Coba Lagi" di bawah</p>
                    </div>
                    <button onClick={startCamera} className="w-full px-6 py-3 bg-pink-deep text-white font-black rounded-xl text-sm border-[3px] border-border shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all">
                      Coba Lagi
                    </button>
                    <button
                      onClick={() => { stopCamera(); setRetakeSlot(-1); setStep(photos.length > 0 ? 'review-shots' : 'select'); }}
                      className="mt-3 w-full py-2 text-xs font-bold text-ink/40 hover:text-ink transition-colors"
                    >
                      {photos.length > 0 ? '← Kembali ke Review' : '← Ganti Frame'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-3">
                      {Array.from({ length: totalSlots }).map((_, i) => {
                        const targetIdx = retakeSlot >= 0 ? retakeSlot : currentSlot;
                        const isDone = photos.some((p) => p.slotIdx === i) && i !== targetIdx;
                        return (
                          <div key={i} className={`h-2 flex-1 rounded-full transition-all ${isDone ? 'bg-pink-deep' : i === targetIdx ? 'bg-pink-deep/40 animate-pulse' : 'bg-border'}`} />
                        );
                      })}
                    </div>
                    <p className="text-xs font-bold text-center text-ink/50 uppercase tracking-widest mb-3">
                      {retakeSlot >= 0 ? `Foto ulang slot ${retakeSlot + 1}` : `Foto ${currentSlot + 1} dari ${totalSlots}`}
                    </p>

                    {/* Clean camera — shape matches current slot AR exactly */}
                    <div className="relative rounded-2xl overflow-hidden border-[4px] border-border shadow-[6px_6px_0_var(--color-sage)] bg-black mb-4">
                      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                      {!cameraReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                          <div className="w-10 h-10 border-4 border-pink-deep border-t-transparent rounded-full animate-spin mb-3" />
                          <p className="text-white/60 text-xs font-medium">Memuat kamera...</p>
                        </div>
                      )}
                      {/* AR badge — tells user how to pose */}
                      <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <p className="text-white text-[10px] font-bold tracking-wider">
                          {slotAR >= 1.7 ? '📐 Landscape lebar' : slotAR >= 1.2 ? '📐 Landscape' : slotAR >= 0.9 ? '📐 Kotak' : slotAR >= 0.7 ? '📐 Portrait' : '📐 Portrait sempit'}
                          {' · '}slot {activeSlotIdx + 1}
                        </p>
                      </div>
                      <canvas
                        ref={previewCanvasRef}
                        width={canvasW}
                        height={canvasH}
                        className="w-full"
                        style={{ aspectRatio: String(slotAR) }}
                      />
                      <AnimatePresence>
                        {flashActive && (
                          <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-white pointer-events-none" />
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {countdown !== null && (
                          <motion.div key={countdown} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                            <div className="w-28 h-28 bg-black/60 rounded-full flex items-center justify-center">
                              <span className="font-pixel text-6xl text-white">{countdown}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => setMirrored((m) => !m)} className="p-3 bg-white border-[3px] border-border rounded-xl shadow-[3px_3px_0_var(--color-sage)] hover:bg-pink-light transition-all" title="Mirror">
                        <FlipHorizontal size={20} className="text-ink" />
                      </button>
                      <button
                        onClick={() => startCountdown(3)}
                        disabled={countdown !== null || !cameraReady}
                        className="flex-1 py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Camera size={18} />
                        {countdown !== null ? `${countdown}...` : 'Ambil Foto'}
                      </button>
                      <button
                        onClick={() => startCountdown(10)}
                        disabled={countdown !== null || !cameraReady}
                        className="p-3 bg-white border-[3px] border-border rounded-xl shadow-[3px_3px_0_var(--color-sage)] hover:bg-pink-light transition-all"
                        title="Timer 10 detik"
                      >
                        <Timer size={20} className="text-ink" />
                      </button>
                    </div>
                    <button
                      onClick={() => { stopCamera(); if (countdownRef.current) { clearInterval(countdownRef.current); setCountdown(null); } setRetakeSlot(-1); setStep(photos.length > 0 ? 'review-shots' : 'select'); }}
                      className="mt-3 w-full py-2 text-xs font-bold text-ink/50 hover:text-ink transition-colors"
                    >
                      {photos.length > 0 ? '← Kembali ke Review' : '← Ganti Frame'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── REVIEW SHOTS ── */}
            {step === 'review-shots' && (
              <div>
                <div className="bg-white border-[4px] border-border rounded-3xl shadow-[6px_6px_0_var(--color-sage)] p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-pixel text-lg text-ink">Cek Hasil Foto</h2>
                    <span className="text-xs font-bold text-ink/40 uppercase tracking-widest">{photos.length}/{totalSlots} foto</span>
                  </div>

                  <div className={`grid gap-3 ${totalSlots <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                      const photo = photos.find((p) => p.slotIdx === slotIdx);
                      return (
                        <div key={slotIdx} className="relative">
                          <div className={`rounded-xl overflow-hidden border-[3px] aspect-[9/16] ${photo ? 'border-pink-deep/60' : 'border-dashed border-border'} bg-pink-light/20`}>
                            {photo ? (
                              <img src={photo.dataUrl} alt={`Foto ${slotIdx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <Camera size={20} className="text-ink/30" />
                                <span className="text-[10px] font-bold text-ink/30">Belum ada</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${photo ? 'bg-pink-deep text-white' : 'bg-black/30 text-white'}`}>{slotIdx + 1}</span>
                          </div>
                          {photo && (
                            <>
                              <div className="absolute top-1.5 right-1.5">
                                <CheckCircle size={16} className="text-pink-deep drop-shadow" />
                              </div>
                              <button
                                onClick={() => handleRetakeSlot(slotIdx)}
                                className="absolute bottom-1.5 right-1.5 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-all"
                                title={`Foto ulang slot ${slotIdx + 1}`}
                              >
                                <RefreshCw size={12} className="text-white" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {photos.length < totalSlots && (
                    <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 text-center">
                        Masih ada {totalSlots - photos.length} slot yang belum difoto
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const nextEmpty = Array.from({ length: totalSlots }).findIndex((_, i) => !photos.some((p) => p.slotIdx === i));
                      setCurrentSlot(nextEmpty >= 0 ? nextEmpty : 0);
                      setRetakeSlot(-1);
                      setStep('shoot');
                    }}
                    className="flex-1 py-4 bg-white text-ink font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    {photos.length < totalSlots ? 'Lanjut Foto' : 'Foto Ulang'}
                  </button>
                  <button
                    onClick={() => { setCompositeUrl(''); setStep('composite'); }}
                    disabled={photos.length < totalSlots}
                    className="flex-1 py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronRight size={16} /> Buat Frame
                  </button>
                </div>
                <button
                  onClick={() => { setStep('select'); setPhotos([]); setCurrentSlot(0); setCompositeUrl(''); }}
                  className="mt-3 w-full py-2 text-xs font-bold text-ink/50 hover:text-ink transition-colors"
                >
                  Mulai Ulang
                </button>
              </div>
            )}

            {/* ── COMPOSITE RESULT ── */}
            {step === 'composite' && (
              <div>
                <div className="bg-white border-[4px] border-border rounded-3xl shadow-[6px_6px_0_var(--color-sage)] p-4 mb-5">
                  {compositeUrl ? (
                    <img src={compositeUrl} alt="Hasil photobooth" className="w-full rounded-xl border-2 border-border" />
                  ) : (
                    <div className="aspect-[3/4] bg-pink-light/30 rounded-xl flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-4 border-pink-deep border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium text-ink/50">Menyusun foto ke frame...</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('review-shots')}
                    className="flex-1 py-4 bg-white text-ink font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} /> Edit Foto
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!compositeUrl}
                    className="flex-1 py-4 bg-pink-deep text-white font-black text-sm uppercase tracking-widest rounded-2xl border-[3px] border-border shadow-[6px_6px_0_var(--color-ink)] hover:-translate-y-1 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
                <button
                  onClick={() => { setStep('select'); setPhotos([]); setCurrentSlot(0); setCompositeUrl(''); }}
                  className="mt-3 w-full py-2 text-xs font-bold text-ink/50 hover:text-ink transition-colors"
                >
                  Mulai dari Awal
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
