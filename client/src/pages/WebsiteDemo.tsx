
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Timing Config ────────────────────────────────────────────────────────────
// Seconds into the song when "come back" lyric hits — adjust if needed
const COME_BACK_TIME = 17.8;
// Auto-knock timestamps relative to audio start (seconds)
const KNOCK_TIMES = [5.5, 8.0, 11.0];

// ─── Constants & Types ────────────────────────────────────────────────────────
const PALETTE = {
  bg: '#fff0f3',
  accentLight: '#ffd6e7',
  accentMid: '#ffb3c6',
  accentStrong: '#ff85a1',
  text: '#3d1a24',
  card: '#fffbfc',
};

type Scene = 'door' | 'cinematic' | 'intro' | 'letter' | 'game' | 'bloom' | 'final';
interface DemoProps {
  namaPengirim: string;
  namaPenerima: string;
  letterLines: string[];
  promises: string[];
  footerMessage: string;
}


// ─── SVG Components ───────────────────────────────────────────────────────────

const CatSVG = ({
  expression = 'neutral',
  walking = false,
  waving = false,
  standing = false,
  holdingBouquet = false,
  className = '',
}: {
  expression?: 'neutral' | 'happy' | 'shy' | 'shock' | 'sorry';
  walking?: boolean;
  waving?: boolean;
  standing?: boolean;
  holdingBouquet?: boolean;
  className?: string;
}) => {
  const [blink, setBlink] = useState(false);
  const [earTwitch, setEarTwitch] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 2000);
    const twitchInterval = setInterval(() => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 400);
    }, 3000 + Math.random() * 3000);
    return () => {
      clearInterval(blinkInterval);
      clearInterval(twitchInterval);
    };
  }, []);

  const getMouthPath = () => {
    switch (expression) {
      case 'happy': return 'M 45 65 Q 50 75 55 65 Q 60 75 65 65';
      case 'shock': return 'M 52 70 A 3 3 0 1 0 58 70 A 3 3 0 1 0 52 70';
      case 'sorry': return 'M 48 70 Q 55 65 62 70';
      default: return 'M 46 65 Q 50 70 54 65 Q 58 70 62 65';
    }
  };

  const getEyeSize = () => {
    if (blink) return { rx: 5, ry: 1 };
    switch (expression) {
      case 'happy': return { rx: 6, ry: 7 };
      case 'sorry': return { rx: 5, ry: 6 };
      case 'shock': return { rx: 7, ry: 7 };
      default: return { rx: 6, ry: 8 };
    }
  };

  const eye = getEyeSize();

  return (
    <svg viewBox="0 0 120 120" className={`w-full h-full drop-shadow-lg ${className}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="catHeadGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdfcfc" />
          <stop offset="100%" stopColor="#e8d5d5" />
        </radialGradient>
        <radialGradient id="catBodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdfcfc" />
          <stop offset="100%" stopColor="#d4c0c0" />
        </radialGradient>
        <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <motion.path
        d="M 85 90 Q 115 85 105 55 Q 95 30 115 20"
        stroke="#c9b0b0" strokeWidth="12" strokeLinecap="round" fill="none"
        animate={{ rotate: expression === 'happy' ? [-15, 15, -15] : [-5, 5, -5], scaleY: [1, 1.1, 1] }}
        transition={{ duration: expression === 'happy' ? 0.6 : 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '85px 90px' }}
      />
      <motion.ellipse
        cx="60" cy="90" rx="35" ry="28" fill="url(#catBodyGrad)"
        animate={{ scaleY: [1, 1.05, 1], y: [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60px 118px' }}
      />
      <AnimatePresence>
        {(expression === 'happy' || expression === 'sorry' || expression === 'shy') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}>
            <circle cx="35" cy="62" r="6" fill="#ff85a1" filter="blur(4px)" />
            <circle cx="85" cy="62" r="6" fill="#ff85a1" filter="blur(4px)" />
          </motion.g>
        )}
      </AnimatePresence>
      <g>
        <motion.ellipse cx="35" cy="112" rx="8" ry="6" fill="#c0a8a8"
          animate={walking ? { translateY: [0, -6, 0], scaleY: [1, 0.8, 1] } : {}}
          transition={{ duration: 0.35, repeat: Infinity }} />
        <motion.ellipse cx="85" cy="112" rx="8" ry="6" fill="#c0a8a8"
          animate={walking ? { translateY: [-6, 0, -6], scaleY: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 0.35, repeat: Infinity }} />
        <motion.ellipse cx="45" cy={standing ? 85 : 114} rx="9" ry="7" fill="#c9b0b0"
          animate={walking ? { translateY: [-6, 0, -6] } : (waving ? { translateY: [0, -25, 0], rotate: [0, 20, -20, 0] } : {})}
          transition={walking ? { duration: 0.35, repeat: Infinity } : (waving ? { duration: 0.5, repeat: Infinity } : {})} />
        <motion.ellipse cx="75" cy={standing ? 85 : 114} rx="9" ry="7" fill="#c9b0b0"
          animate={walking ? { translateY: [0, -6, 0] } : {}}
          transition={{ duration: 0.35, repeat: Infinity }} />
      </g>
      <motion.g
        animate={{ y: [0, -3, 0], rotate: expression === 'shock' ? [0, -2, 2, 0] : [0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ transformOrigin: '60px 60px' }}
      >
        <motion.path d="M 35 45 L 20 10 L 55 35 Z" fill="#c9b0b0"
          animate={earTwitch ? { rotate: [-5, 10, -5] } : {}} style={{ transformOrigin: '35px 45px' }} />
        <path d="M 35 45 L 26 20 L 48 38 Z" fill="#ffccd5" opacity="0.7" />
        <motion.path d="M 85 45 L 100 10 L 65 35 Z" fill="#c9b0b0"
          animate={earTwitch ? { rotate: [5, -10, 5] } : {}} style={{ transformOrigin: '85px 45px' }} />
        <path d="M 85 45 L 94 20 L 72 38 Z" fill="#ffccd5" opacity="0.7" />
        <circle cx="60" cy="55" r="32" fill="url(#catHeadGrad)" stroke="#c9b0b0" strokeWidth="1" />
        <g filter="url(#eyeGlow)">
          <ellipse cx="46" cy="52" rx={eye.rx} ry={eye.ry} fill="#1a0d14" />
          {!blink && (<>
            <circle cx="48" cy="49" r="2.5" fill="white" />
            <circle cx="44" cy="54" r="1" fill="white" opacity="0.6" />
            {expression === 'happy' && <path d="M 48 49 L 49 47 L 50 49 L 52 50 L 50 51 L 49 53 L 48 51 L 46 50 Z" fill="white" opacity="0.8" />}
          </>)}
          <ellipse cx="74" cy="52" rx={eye.rx} ry={eye.ry} fill="#1a0d14" />
          {!blink && (<>
            <circle cx="76" cy="49" r="2.5" fill="white" />
            <circle cx="72" cy="54" r="1" fill="white" opacity="0.6" />
            {expression === 'happy' && <path d="M 76 49 L 77 47 L 78 49 L 80 50 L 78 51 L 77 53 L 76 51 L 74 50 Z" fill="white" opacity="0.8" />}
          </>)}
        </g>
        <path d="M 58 64 L 62 64 L 60 67 Z" fill="#ff85a1" />
        <path d={getMouthPath()} fill="none" stroke="#1a0d14" strokeWidth="2" strokeLinecap="round" />
        <g stroke="#1a0d14" strokeWidth="0.8" strokeLinecap="round" opacity="0.3">
          <path d="M 32 60 L 10 58 M 32 65 L 8 65 M 32 70 L 10 72" />
          <path d="M 88 60 L 110 58 M 88 65 L 112 65 M 88 70 L 110 72" />
        </g>
      </motion.g>
      {holdingBouquet && (
        <motion.g
          initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 10 }}
          style={{ originX: '60px', originY: '85px' }}
        >
          <g transform="translate(60, 85) rotate(-5)">
            <BouquetSVG scale={0.65} className="w-24 h-24" />
          </g>
        </motion.g>
      )}
    </svg>
  );
};

const BouquetSVG = ({ scale = 1, className = '' }: { scale?: number; className?: string }) => (
  <svg viewBox="0 0 100 130" className={`overflow-visible ${className}`} style={{ transform: `scale(${scale})` }}>
    <defs>
      <filter id="flowerGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M 50 120 L 10 50 Q 50 20 90 50 Z" fill="#ffccd5" stroke="#ffb3c6" strokeWidth="0.5" />
    <g stroke="#55a630" strokeWidth="1.5" fill="none" strokeLinecap="round">
      <path d="M 50 120 L 50 40" />
      <path d="M 50 120 Q 35 80 25 50" />
      <path d="M 50 120 Q 65 80 75 50" />
    </g>
    <g filter="url(#flowerGlow)">
      <g transform="translate(30, 55) rotate(-15)">
        <path d="M -6 0 Q -10 -15 0 -22 Q 10 -15 6 0 Z" fill="#ff85a1" />
        <path d="M -3 -2 Q -5 -12 0 -17 Q 5 -12 3 -2 Z" fill="#ff4d7d" opacity="0.6" />
      </g>
      <g transform="translate(70, 55) rotate(15)">
        <path d="M -6 0 Q -10 -15 0 -22 Q 10 -15 6 0 Z" fill="#ff85a1" />
        <path d="M -3 -2 Q -5 -12 0 -17 Q 5 -12 3 -2 Z" fill="#ff4d7d" opacity="0.6" />
      </g>
      <g transform="translate(50, 45)">
        <circle r="12" fill="#e8607a" />
        {[0, 72, 144, 216, 288].map(deg => (
          <path key={deg} d="M 0 0 Q -7 -10 0 -15 Q 7 -10 0 0" fill="#ffccd5" opacity="0.9" transform={`rotate(${deg})`} />
        ))}
        <circle r="4" fill="#ffe066" />
      </g>
      <g fill="white">
        <circle cx="40" cy="35" r="1.5" /><circle cx="60" cy="35" r="1.5" />
        <circle cx="15" cy="65" r="1.2" /><circle cx="85" cy="65" r="1.2" />
      </g>
    </g>
    <path d="M 50 120 L 15 60 L 30 45 Q 50 35 70 45 L 85 60 L 50 120" fill="#fff5f7" opacity="0.8" stroke="#ffccd5" strokeWidth="0.5" />
    <path d="M 32 75 Q 50 68 68 75 L 50 120 Z" fill="#ffccd5" stroke="#ffb3c6" strokeWidth="1.5" />
    <motion.g transform="translate(50, 100)" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <path d="M -2 -2 Q -15 -12 -12 -5 Q -10 2 -2 2" fill="#c9184a" />
      <path d="M 2 -2 Q 15 -12 12 -5 Q 10 2 2 2" fill="#c9184a" />
      <path d="M -3 1 L -8 15" stroke="#c9184a" strokeWidth="4" strokeLinecap="round" />
      <path d="M 3 1 L 8 15" stroke="#c9184a" strokeWidth="4" strokeLinecap="round" />
      <rect x="-4" y="-4" width="8" height="7" rx="3" fill="#ff1f66" />
    </motion.g>
  </svg>
);

// ─── Starfield Canvas ─────────────────────────────────────────────────────────

const StarfieldCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const stars = Array.from({ length: 300 }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 2,
      y: (Math.random() - 0.5) * canvas.height * 2,
      z: Math.random() * canvas.width,
      prevX: 0,
      prevY: 0,
    }));

    let frame: number;

    const render = () => {
      ctx.fillStyle = 'rgba(0,0,10,0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        const sx = (star.x / star.z) * canvas.width + cx;
        const sy = (star.y / star.z) * canvas.height + cy;
        const size = Math.max(0.2, (1 - star.z / canvas.width) * 3.5);
        const alpha = 1 - star.z / canvas.width;

        if (star.prevX && star.prevY) {
          ctx.beginPath();
          ctx.moveTo(star.prevX, star.prevY);
          ctx.lineTo(sx, sy);
          const g = ctx.createLinearGradient(star.prevX, star.prevY, sx, sy);
          g.addColorStop(0, `rgba(255,133,161,0)`);
          g.addColorStop(1, `rgba(255,200,220,${alpha * 0.85})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = size;
          ctx.stroke();
        }

        star.prevX = sx;
        star.prevY = sy;
        star.z -= 16;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = canvas.width;
          star.prevX = 0;
          star.prevY = 0;
        }
      });

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// ─── Scene: Cinematic 3D Text ─────────────────────────────────────────────────

const SceneCinematic = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 5200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#00000d' }}>
      <StarfieldCanvas />

      {/* Center glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(255,100,155,0.1) 0%, transparent 70%)',
      }} />

      {/* 3D perspective container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '520px', perspectiveOrigin: '50% 50%' }}
      >
        {/* Main text — flies from far to past-camera */}
        <motion.div
          className="absolute text-center select-none pointer-events-none"
          initial={{ scale: 0.01, opacity: 0 }}
          animate={{
            scale: [0.01, 0.05, 0.18, 0.55, 1.6, 5.5],
            opacity: [0, 0.7, 1, 1, 0.9, 0],
          }}
          transition={{
            duration: 5,
            ease: 'linear',
            times: [0, 0.12, 0.3, 0.55, 0.8, 1],
          }}
        >
          {['COME', 'BACK'].map((word, i) => (
            <div key={i} style={{
              fontSize: 'clamp(52px, 16vw, 140px)',
              fontWeight: 900,
              fontFamily: "'Georgia', serif",
              letterSpacing: '0.3em',
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,170,200,0.92)',
              textShadow: [
                '0 0 25px rgba(255,133,161,1)',
                '0 0 70px rgba(255,133,161,0.65)',
                '0 0 140px rgba(255,133,161,0.35)',
              ].join(', '),
              lineHeight: 1.15,
              display: 'block',
            }}>
              {word}
            </div>
          ))}
        </motion.div>

        {/* Ghost / trailing glow copy */}
        <motion.div
          className="absolute text-center select-none pointer-events-none"
          initial={{ scale: 0.006, opacity: 0 }}
          animate={{
            scale: [0.006, 0.03, 0.14, 0.45, 1.4, 5],
            opacity: [0, 0, 0.3, 0.5, 0.25, 0],
          }}
          transition={{
            duration: 5,
            ease: 'linear',
            times: [0, 0.2, 0.4, 0.62, 0.84, 1],
            delay: 0.35,
          }}
        >
          {['COME', 'BACK'].map((word, i) => (
            <div key={i} style={{
              fontSize: 'clamp(52px, 16vw, 140px)',
              fontWeight: 900,
              fontFamily: "'Georgia', serif",
              letterSpacing: '0.3em',
              color: 'rgba(255,133,161,0.22)',
              textShadow: '0 0 80px rgba(255,133,161,0.7), 0 0 200px rgba(255,133,161,0.25)',
              lineHeight: 1.15,
              display: 'block',
              filter: 'blur(3px)',
            }}>
              {word}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,15,0.75) 100%)',
      }} />

      {/* Film grain scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.6) 2px, rgba(255,255,255,0.6) 4px)',
      }} />
    </div>
  );
};

// ─── Scene: Door ──────────────────────────────────────────────────────────────

const SceneDoor = ({
  onOpen,
  audioRef,
}: {
  onOpen: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [knocking, setKnocking] = useState(false);
  const [knockCount, setKnockCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [listeningPulse, setListeningPulse] = useState(false);
  const hasOpened = useRef(false);
  const knockTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerKnock = useCallback(() => {
    setKnocking(true);
    setKnockCount(prev => prev + 1);
    setTimeout(() => setKnocking(false), 350);
  }, []);

  const handleStart = () => {
    if (started) return;
    setStarted(true);

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0;
      audio.play().catch(() => {});

      // Fade audio in
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol = Math.min(1, vol + 0.05);
        if (audio) audio.volume = vol;
        if (vol >= 1) clearInterval(fadeIn);
      }, 80);
    }

    // Schedule auto-knocks
    KNOCK_TIMES.forEach(t => {
      const id = setTimeout(triggerKnock, t * 1000);
      knockTimeouts.current.push(id);
    });

    setTimeout(() => setListeningPulse(true), 1000);
  };

  useEffect(() => {
    if (!started) return;
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= COME_BACK_TIME && !hasOpened.current) {
        hasOpened.current = true;
        setIsOpen(true);
        setTimeout(onOpen, 1400);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      knockTimeouts.current.forEach(clearTimeout);
    };
  }, [started, onOpen, audioRef]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
      {/* Floor glow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,210,220,0.3) 0%, transparent 70%)' }} />

      <div className="relative w-64 h-96 [perspective:1000px]">
        {/* Knock flash */}
        <AnimatePresence>
          {knocking && (
            <motion.div
              key={knockCount}
              initial={{ opacity: 0, scale: 0.4, y: -10 }}
              animate={{ opacity: 1, scale: 1.4, y: -75 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none font-black text-5xl"
              style={{
                color: '#ffb3c6',
                textShadow: '0 0 25px rgba(255,133,161,0.9)',
              }}
            >
              TOK!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Door frame */}
        <div className="absolute inset-0 border-8 border-[#3d1f0f] rounded-sm shadow-2xl z-0" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-yellow-200/40 to-transparent blur-md translate-y-2" />

        {/* Door leaf */}
        <motion.div
          className="absolute inset-0 origin-left z-10"
          animate={
            isOpen
              ? { rotateY: -110 }
              : knocking
              ? { x: [0, -4, 4, -2, 0] }
              : {}
          }
          transition={isOpen ? { duration: 1.4, ease: 'easeInOut' } : { duration: 0.12 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 bg-[#7a3810] shadow-inner overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(90deg, #6b3010 0px, #6b3010 4px, #894020 4px, #894020 8px)' }} />
            <div className="absolute top-8 left-4 right-4 h-32 border-4 border-[#5a2a0c] shadow-lg">
              <div className="w-full h-full bg-[#8b4513]/30" />
            </div>
            <div className="absolute bottom-8 left-4 right-4 h-48 border-4 border-[#5a2a0c] shadow-lg">
              <div className="w-full h-full bg-[#8b4513]/20" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg"
              style={{ background: 'radial-gradient(circle at 30% 30%, #fff, #d4a017 50%, #8b6800)' }}>
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-6 rounded-full bg-gradient-to-b from-[#d4a017] to-[#8b6800] opacity-50" />
            </div>
          </div>
        </motion.div>

        {/* Room light behind door */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="absolute inset-2 bg-gradient-to-r from-white via-yellow-50 to-transparent blur-sm -z-10"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-10 flex flex-col items-center gap-4">
        {!started ? (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleStart}
            className="px-12 py-4 bg-[#ff85a1] text-white font-bold rounded-full text-lg tracking-wide"
            style={{ boxShadow: '0 10px 40px rgba(255,133,161,0.45)' }}
          >
            ♪ Tap to Begin
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ background: knockCount > i ? '#ff85a1' : 'rgba(255,133,161,0.2)' }}
                  animate={knockCount > i ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
            {listeningPulse && !isOpen && (
              <motion.p
                className="text-xs text-[#ffb3c6] font-semibold tracking-[0.25em] uppercase"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                ♪ listening...
              </motion.p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Scene: Intro ─────────────────────────────────────────────────────────────

const SceneIntro = ({ onNext, namaPenerima }: { onNext: () => void; namaPenerima: string }) => {
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPlaced(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="relative w-full max-w-md aspect-square">
        <motion.div
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <CatSVG walking={!placed} holdingBouquet expression={placed ? 'shy' : 'neutral'} className="w-64 h-64" />
        </motion.div>
        <AnimatePresence>
          {placed && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="absolute top-1/2 flex gap-4">
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i}
                    animate={{ y: [-20, -150], x: [(i - 3.5) * 20, (i - 3.5) * 60], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-[#ffb3c6]"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {placed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="mt-8">
          <h1 className="text-3xl font-bold text-[#3d1a24] mb-4">Untuk {namaPenerima}</h1>
          <button onClick={onNext}
            className="px-8 py-3 bg-[#ffb3c6] text-[#3d1a24] font-semibold rounded-2xl hover:bg-[#ff85a1] hover:text-white transition-colors shadow-md">
            Buka Surat
          </button>
        </motion.div>
      )}
    </div>
  );
};

// ─── Scene: Letter ────────────────────────────────────────────────────────────

const TypewriterText = ({ text, delay = 0, onComplete }: { text: string; delay?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let index = 0;
    const startTyping = () => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
        timeout = setTimeout(startTyping, 40);
      } else if (onComplete) {
        onComplete();
      }
    };
    const initialTimeout = setTimeout(startTyping, delay);
    return () => { clearTimeout(initialTimeout); clearTimeout(timeout); };
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

const SceneLetter = ({ onNext, namaPenerima, namaPengirim, letterLines }: { onNext: () => void; namaPenerima: string; namaPengirim: string; letterLines: string[] }) => {
  const [step, setStep] = useState(0);
  const letterTargetRef = useRef<HTMLDivElement>(null);

  const defaultLines = [
    'Hai, ada yang ingin aku sampaikan...',
    'Aku sudah lama menyimpan ini untukmu.',
    'Semoga kamu tahu betapa berartinya kamu.',
    'Setiap momen bersamamu terasa berharga.',
    `— ${namaPengirim || 'Aku'}`,
  ];
  const lines = letterLines.length > 0
    ? [...letterLines.slice(0, -1), letterLines[letterLines.length - 1]]
    : defaultLines;

  useEffect(() => {
    letterTargetRef.current?.scrollTo({ top: letterTargetRef.current.scrollHeight, behavior: 'smooth' });
  }, [step]);

  return (
    <div className="relative h-full flex items-center justify-center px-4 overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div key={i}
            initial={{ x: Math.random() * 600 - 300, y: -100, opacity: 0 }}
            animate={{ y: 1000, x: (Math.random() * 200 - 100) + (Math.random() * 600 - 300), rotate: 720, opacity: [0, 0.4, 0.4, 0] }}
            transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, delay: i, ease: 'linear' }}
            className="w-6 h-4 bg-[#ffb3c6] absolute"
            style={{ borderRadius: '60% 40% 70% 30% / 50%' }}
          />
        ))}
      </div>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-[#fff5f7] overflow-y-auto max-h-[85vh]"
        ref={letterTargetRef}
      >
        <div className="space-y-6 text-[#3d1a24] relative z-10">
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-2xl font-black text-[#ff85a1] mb-8 border-b-2 border-[#fff0f3] pb-4">
            Surat untuk {namaPenerima}...
          </motion.h2>
          <div className="space-y-4 font-medium text-lg leading-relaxed italic">
            {lines.map((line, i) => i <= step ? (
              <div key={i} className={i === lines.length - 1 ? 'pt-4 text-right not-italic font-bold text-[#ff85a1]' : ''}>
                <TypewriterText text={line} delay={i === 0 ? 500 : 0}
                  onComplete={() => { if (i === step && step < lines.length - 1) setTimeout(() => setStep(p => p + 1), 600); }} />
              </div>
            ) : null)}
          </div>
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 pointer-events-none">
          <CatSVG expression="sorry" className="scale-75 opacity-90" />
        </div>
        {step === lines.length - 1 && (
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={onNext}
            className="mt-12 w-full py-4 bg-[#ff85a1] text-white font-bold rounded-2xl shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all text-xl">
            Aku Mengerti
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

// ─── Scene: Game ──────────────────────────────────────────────────────────────

const SceneGame = ({ onNext }: { onNext: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'end'>('ready');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const petals = useRef<{x:number;y:number;size:number;speed:number;rot:number;rotV:number;color:string;isSpecial:boolean}[]>([]);
  const particles = useRef<{x:number;y:number;vx:number;vy:number;life:number;color:string}[]>([]);

  const updateSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }
  }, []);

  useEffect(() => { updateSize(); window.addEventListener('resize', updateSize); return () => window.removeEventListener('resize', updateSize); }, [updateSize]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.08) {
        petals.current.push({
          x: Math.random() * canvas.width, y: -20,
          size: 15 + Math.random() * 15, speed: 2 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.1,
          color: Math.random() > 0.9 ? '#ffe066' : PALETTE.accentMid,
          isSpecial: Math.random() > 0.9,
        });
      }

      petals.current = petals.current.filter(p => {
        p.y += p.speed; p.rot += p.rotV; p.x += Math.sin(p.y * 0.02) * 1.5;
        const dist = Math.sqrt((p.x - mousePos.x) ** 2 + (p.y - (mousePos.y - 20)) ** 2);
        if (dist < 40 + p.size / 2) {
          setScore(s => s + (p.isSpecial ? 5 : 1));
          for (let i = 0; i < 8; i++) particles.current.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1, color: p.color });
          return false;
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-p.size / 2, -p.size, p.size / 2, -p.size, 0, 0);
        ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
        return p.y < canvas.height + 20;
      });

      particles.current = particles.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0'); ctx.fill();
        return p.life > 0;
      });

      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [gameState, mousePos]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
      return () => clearInterval(t);
    } else if (timeLeft === 0) setGameState('end');
  }, [gameState, timeLeft]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-8 bg-[#fffefe] overflow-hidden">
      <div className="z-10 flex w-full justify-between items-center max-w-md">
        <div className="bg-white/80 backdrop-blur px-6 py-2 rounded-2xl shadow-sm border border-pink-100">
          <p className="text-xs uppercase tracking-widest font-bold text-pink-400">Score</p>
          <p className="text-2xl font-black text-[#3d1a24]">{score}</p>
        </div>
        <div className="bg-white/80 backdrop-blur px-6 py-2 rounded-2xl shadow-sm border border-pink-100">
          <p className="text-xs uppercase tracking-widest font-bold text-pink-400">Time</p>
          <p className={`text-2xl font-black ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-[#3d1a24]'}`}>{timeLeft}s</p>
        </div>
      </div>

      <div ref={containerRef} onMouseMove={handleMouseMove}
        className="relative flex-1 w-full max-w-2xl mx-auto my-6 overflow-hidden bg-gradient-to-b from-[#fff0f3]/30 to-white rounded-[3rem] border-4 border-white shadow-2xl cursor-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <motion.div className="absolute pointer-events-none" style={{ left: mousePos.x, top: mousePos.y, x: '-50%', y: '-80%' }}>
          <div className="w-32 h-32 relative">
            <CatSVG expression={score > 15 ? 'happy' : 'neutral'} standing className="w-full h-full" />
          </div>
        </motion.div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-pink-50/60 backdrop-blur-sm z-30">
            <div className="text-center p-8 bg-white rounded-[2rem] shadow-xl border-4 border-pink-100 max-w-xs">
              <CatSVG walking className="w-32 h-32 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-[#3d1a24] mb-2">Siap?</h3>
              <p className="text-pink-500 font-medium mb-6">Gunakan kucing untuk menangkap kelopak bunga!</p>
              <button onClick={() => setGameState('playing')}
                className="w-full py-4 bg-[#ff85a1] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform">Mulai!</button>
            </div>
          </div>
        )}
        {gameState === 'end' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-30">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-10">
              <CatSVG expression="happy" className="w-40 h-40 mx-auto mb-6" />
              <h2 className="text-4xl font-black text-[#3d1a24] mb-2">Hebat!</h2>
              <p className="text-xl text-pink-500 font-bold mb-8">Skor Akhir: {score}</p>
              <button onClick={onNext}
                className="px-12 py-4 bg-[#ff85a1] text-white font-bold rounded-2xl shadow-lg active:scale-95 hover:px-16 transition-all">Lanjut</button>
            </motion.div>
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-pink-300 italic">Geser mouse/sentuh jari untuk menggerakkan kucing</p>
    </div>
  );
};

// ─── Scene: Bloom ─────────────────────────────────────────────────────────────

const SceneBloom = ({ onNext, customPromises }: { onNext: () => void; customPromises: string[] }) => {
  const [bloomed, setBloomed] = useState<number[]>([]);
  const defaultPromises = ['Aku akan selalu ada', 'Aku akan lebih sabar', 'Aku akan lebih perhatian', 'Aku akan menjagamu', 'Aku mencintaimu'];
  const promises = customPromises.map((p, i) => p || defaultPromises[i] || `Janji ke-${i+1}`);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fff0f3]">
      <h2 className="text-2xl font-bold text-[#3d1a24] mb-8">Janji Mekar 🌸</h2>
      <div className="relative w-full max-w-lg flex flex-wrap justify-center gap-8">
        {promises.map((p, i) => (
          <div key={i} className="flex flex-col items-center cursor-pointer" onClick={() => !bloomed.includes(i) && setBloomed([...bloomed, i])}>
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M 50 100 Q 50 70 50 50" stroke="#4a7a2a" strokeWidth="3" fill="none" />
                <motion.g initial={{ scale: 0.2 }} animate={{ scale: bloomed.includes(i) ? 1 : 0.2 }} className="origin-center">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, j) => (
                    <motion.path key={j} d="M 50 50 Q 70 30 50 10 Q 30 30 50 50" fill={PALETTE.accentMid}
                      style={{ transformOrigin: '50px 50px', transform: `rotate(${angle}deg)` }}
                      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                      animate={{ clipPath: bloomed.includes(i) ? 'circle(100%)' : 'circle(0%)' }}
                      transition={{ delay: j * 0.05 }} />
                  ))}
                  <motion.circle cx="50" cy="50" r="8" fill="#ffe066" animate={{ scale: bloomed.includes(i) ? 1 : 0 }} />
                </motion.g>
              </svg>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: bloomed.includes(i) ? 1 : 0 }}
              className="mt-2 text-sm font-medium text-[#ff85a1] text-center">{p}</motion.p>
          </div>
        ))}
      </div>
      <div className="absolute bottom-10 right-10 w-32 h-32">
        <CatSVG expression={bloomed.length === 5 ? 'happy' : 'neutral'} />
      </div>
      {bloomed.length === 5 && (
        <motion.button
          initial={{ y: 50, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onNext}
          className="mt-12 px-12 py-3 bg-[#ff85a1] text-white font-bold rounded-full shadow-lg z-20">
          Terakhir
        </motion.button>
      )}
    </div>
  );
};

// ─── Scene: Final ─────────────────────────────────────────────────────────────

const SceneFinal = ({ namaPenerima, footerMessage }: { namaPenerima: string; footerMessage: string }) => {
  const [yesClicked, setYesClicked] = useState(false);
  const [noPos, setNoPos] = useState({ top: 50, left: 65 });
  const [noHoverCount, setNoHoverCount] = useState(0);
  const [loveLevel, setLoveLevel] = useState(85);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleNoInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let cx: number, cy: number;
    if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else { cx = (e as React.MouseEvent).clientX; cy = (e as React.MouseEvent).clientY; }
    const dist = Math.hypot(cx - (rect.left + rect.width / 2), cy - (rect.top + rect.height / 2));
    if (dist < 100) {
      setNoHoverCount(p => { const n = p + 1; setLoveLevel(Math.max(10, 85 - n * 5)); return n; });
      setNoPos({ top: Math.max(15, Math.min(80, Math.random() * 65 + 10)), left: Math.max(15, Math.min(80, Math.random() * 65 + 10)) });
    }
  };

  useEffect(() => {
    if (!yesClicked || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ps = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 6 + 2, speed: Math.random() * 3 + 1,
      color: `hsla(${Math.random() * 20 + 340},100%,75%,${Math.random()})`,
    }));
    let req: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); p.y -= p.speed; if (p.y < -10) p.y = canvas.height + 10; });
      req = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(req);
  }, [yesClicked]);

  return (
    <div ref={containerRef} className="relative h-full w-full flex flex-col items-center justify-between py-10 px-6 overflow-hidden bg-[#fffafd]">
      {yesClicked && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-50" />}

      {!yesClicked ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center max-w-sm mx-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-56 h-56 md:w-64 md:h-64 mb-14 bg-white rounded-[40px] border-4 border-[#fff0f3] p-4 relative shadow-[0_30px_70px_rgba(255,180,200,0.2)]">
            <CatSVG standing expression={noHoverCount > 4 ? 'sorry' : 'neutral'} className="w-full h-full" />
            <div className="absolute inset-x-0 -bottom-8 bg-white/95 backdrop-blur-md border-2 border-[#ffd6e7] py-4 px-4 rounded-3xl shadow-xl z-20">
              <motion.p key={noHoverCount} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm font-black text-[#3d1a24] tracking-tight leading-tight uppercase">
                {noHoverCount === 0 && `Bunga ini buat ${namaPenerima || 'kamu'}... dimaafin?`}
                {noHoverCount > 0 && noHoverCount <= 3 && 'Waduh... kok Belum sih?'}
                {noHoverCount > 3 && noHoverCount <= 6 && 'Sedih banget nih...'}
                {noHoverCount > 6 && 'Tolong beri kesempatan lagi'}
              </motion.p>
            </div>
          </motion.div>

          <div className="mb-14 w-full">
            <div className="flex justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em]">Forgiveness Level</span>
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{loveLevel}%</span>
            </div>
            <div className="h-4 w-full bg-pink-50/50 rounded-full overflow-hidden border-2 border-pink-100/50 p-[2px]">
              <motion.div animate={{ width: `${loveLevel}%` }}
                className="h-full bg-gradient-to-r from-pink-300 via-[#ff85a1] to-pink-400 rounded-full"
                transition={{ type: 'spring', stiffness: 60, damping: 15 }} />
            </div>
          </div>

          <div className="relative h-20 w-full max-w-[280px]">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setYesClicked(true); setLoveLevel(100); }}
              className="absolute left-1/2 -translate-x-1/2 -ml-16 top-0 w-32 py-5 bg-[#ff85a1] text-white font-black rounded-3xl shadow-[0_15px_30px_rgba(255,133,161,0.4)] z-30 text-lg tracking-widest">
              IYA
            </motion.button>
            <motion.button ref={btnRef} onMouseEnter={handleNoInteraction} onTouchStart={handleNoInteraction}
              style={{ position: 'absolute', top: `${noPos.top}%`, left: `${noPos.left}%`, transform: 'translate(-50%,-50%)' }}
              className="w-32 py-5 bg-white text-[#3d1a24] font-black rounded-3xl shadow-lg z-20 border-2 border-pink-50 select-none pointer-events-auto uppercase tracking-widest text-xs">
              Belum
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full h-full flex flex-col items-center justify-between py-12 px-6 text-center z-10">
          <div className="flex-1 flex flex-col items-center justify-center space-y-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }} className="relative">
              <motion.div animate={{ scale: [1, 1.03, 1], y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <CatSVG waving expression="happy" className="w-64 h-64 md:w-72 md:h-72" />
              </motion.div>
              <div className="absolute -inset-8 bg-pink-100/30 rounded-full blur-[80px] -z-10" />
            </motion.div>
            <div className="space-y-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <h1 className="text-5xl font-black text-[#3d1a24] tracking-tight leading-tight uppercase">
                  TERIMA KASIH 🩷
                </h1>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm text-pink-400 font-black tracking-[0.2em] uppercase bg-white/80 backdrop-blur-md py-3 px-8 rounded-full border border-pink-100 shadow-sm">
{footerMessage || 'Terima kasih sudah membaca sampai sini...'}
              </motion.p>
            </div>
          </div>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }}
            className="w-full flex flex-col items-center pb-4">
            <BouquetSVG scale={1.8} className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_20px_40px_rgba(255,133,161,0.25)]" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Particle Background ──────────────────────────────────────────────────────

const ParticleBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#fff0f3] to-white">
    <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,182,193,0.2)]" />
    <motion.div animate={{ scale: [1, 1.2, 1], x: [-20, 20, -20], y: [-20, 20, -20] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-pink-100/30 rounded-full blur-[100px]" />
    <motion.div animate={{ scale: [1.2, 1, 1.2], x: [20, -20, 20], y: [20, -20, 20] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-pink-100/20 rounded-full blur-[120px]" />
    {[...Array(25)].map((_, i) => (
      <motion.div key={i}
        initial={{ opacity: 0, x: Math.random() * 100 + '%', y: '110%', scale: Math.random() * 0.4 + 0.4 }}
        animate={{ opacity: [0, 0.5, 0], y: '-10%', x: (Math.random() * 100) + (Math.random() * 30 - 15) + '%', rotate: Math.random() * 360 }}
        transition={{ duration: 12 + Math.random() * 12, repeat: Infinity, delay: i * 1.5, ease: 'easeInOut' }}
        className="absolute">
        {i % 3 === 0 ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffb3c6" className="opacity-30">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : i % 3 === 1 ? (
          <div className="w-1 h-1 bg-pink-300 rounded-full shadow-[0_0_8px_#ffb3c6]" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-pink-200/20 blur-[2px]" />
        )}
      </motion.div>
    ))}
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function WebsiteDemo({ namaPengirim, namaPenerima, letterLines, promises, footerMessage }: DemoProps) {
  const [scene, setScene] = useState<Scene>('door');
  const audioRef = useRef<HTMLAudioElement>(null);

  const renderScene = () => {
    switch (scene) {
      case 'door':
        return <SceneDoor onOpen={() => setScene('cinematic')} audioRef={audioRef as React.RefObject<HTMLAudioElement>} />;
      case 'cinematic':
        return <SceneCinematic onComplete={() => setScene('intro')} />;
      case 'intro':
        return <SceneIntro onNext={() => setScene('letter')} namaPenerima={namaPenerima} />;
      case 'letter':
        return <SceneLetter onNext={() => setScene('game')} namaPenerima={namaPenerima} namaPengirim={namaPengirim} letterLines={letterLines} />;
      case 'game':
        return <SceneGame onNext={() => setScene('bloom')} />;
      case 'bloom':
        return <SceneBloom onNext={() => setScene('final')} customPromises={promises} />;
      case 'final':
        return <SceneFinal namaPenerima={namaPenerima} footerMessage={footerMessage} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fff0f3] font-['Inter',sans-serif] text-[#3d1a24] overflow-hidden">
      {/* Background music — plays through all scenes */}
      <audio ref={audioRef} src="/come-back.mp3" preload="auto" style={{ display: 'none' }} />

      {scene !== 'cinematic' && <ParticleBackground />}

      <div className="relative z-10 w-full h-full max-w-lg mx-auto overflow-hidden shadow-2xl bg-white/5 backdrop-blur-[1px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene}
            initial={scene === 'cinematic'
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={scene === 'cinematic'
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={scene === 'cinematic'
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: scene === 'cinematic' ? 0.4 : 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {renderScene()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
