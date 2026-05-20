import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, Star, Sparkles, Heart, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isValidSlug } from '../utils/security';
import { PageLoader } from '../components/ui/index';
import { MelodyPixel } from '../components/template/MelodyPixel';
import { PixelParticles } from '../components/template/PixelParticles';
import WebsiteDemo from './WebsiteDemo';

interface OrderData {
  form_data: {
    template_type?: string;
    nama_pengirim: string;
    nama_penerima: string;
    pesan: string;
    tanggal?: string;
    highlight_title_1?: string;
    highlight_desc_1?: string;
    highlight_title_2?: string;
    highlight_desc_2?: string;
    captions?: string[];
    footer_message?: string;
  };
  asset_urls: {
    photos?: string[];
    music?: string;
  } | null;
}

interface LightboxState {
  open: boolean;
  idx: number;
}

export default function Website() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState>({ open: false, idx: 0 });
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) { setNotFound(true); setLoading(false); return; }

    supabase
      .from('orders')
      .select('form_data, asset_urls, buyer_id')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()
      .then(async ({ data: row, error }) => {
        if (error || !row) { setNotFound(true); setLoading(false); return; }

        // Check if buyer's membership is still active
        if (row.buyer_id) {
          const { data: memberRows } = await supabase
            .rpc('get_user_membership_status', { p_user_id: row.buyer_id });
          const hasActive = Array.isArray(memberRows) && memberRows.length > 0 &&
            new Date(memberRows[0].expires_at) > new Date();
          if (!hasActive) {
            setMembershipExpired(true);
            setLoading(false);
            return;
          }
        }

        setData(row as OrderData);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (data?.form_data) {
      const fd = data.form_data;
      document.title = `${fd.nama_pengirim} → ${fd.nama_penerima} | Pixel Memories`;
    }
  }, [data]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  if (loading) return <PageLoader />;

  if (membershipExpired) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-pixel text-xl text-ink mb-3">Membership Habis</h2>
          <p className="text-sm text-ink/60 font-medium leading-relaxed">
            Website ini sementara tidak bisa diakses karena membership pemiliknya sudah berakhir.
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm">
          <div className="text-4xl mb-4">💔</div>
          <h2 className="font-pixel text-xl text-ink mb-3">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-ink/60 font-medium">Website ini belum ada atau sudah tidak aktif.</p>
        </div>
      </div>
    );
  }

  const fd = data!.form_data;
  const assets = data!.asset_urls || {};
  const photos = assets.photos || [];
  const highlights = [
    { title: fd.highlight_title_1, desc: fd.highlight_desc_1, align: 'left' },
    { title: fd.highlight_title_2, desc: fd.highlight_desc_2, align: 'right' },
  ].filter((h) => h.title);

  // ── Route to Demo template ──────────────────────────────────────────────────
  if (fd.template_type === 'demo') {
    const letterLines = (fd.pesan || '').split('\n').filter(Boolean);
    const promises = (fd.captions || []).slice(0, 5);
    return (
      <WebsiteDemo
        namaPengirim={fd.nama_pengirim || ''}
        namaPenerima={fd.nama_penerima || ''}
        letterLines={letterLines}
        promises={promises}
        footerMessage={fd.footer_message || ''}
      />
    );
  }

  // ── Default: Contoh / Album template ───────────────────────────────────────
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans selection:bg-pink-soft selection:text-ink relative overflow-x-hidden">
      <PixelParticles />

      {/* Audio */}
      {assets.music && (
        <>
          <audio ref={audioRef} src={assets.music} loop />
          <motion.button
            className="fixed bottom-8 left-8 z-[60] w-14 h-14 bg-white border-[4px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)] flex items-center justify-center gap-1 cursor-pointer hover:scale-110 transition-all"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            onClick={toggleAudio}
            aria-label={playing ? 'Pause musik' : 'Play musik'}
          >
            {playing ? (
              <div className="flex items-end gap-0.5 h-5">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="music-bar" style={{ height: `${Math.random() * 12 + 8}px` }} />
                ))}
              </div>
            ) : (
              <span className="text-xl">🎵</span>
            )}
          </motion.button>
        </>
      )}

      {/* HEADER */}
      <header className="fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 h-16 md:h-20 bg-white/90 backdrop-blur-md border-[4px] border-border rounded-2xl z-40 px-4 md:px-8 flex items-center justify-between shadow-[4px_4px_0_var(--color-sage)] transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollTo('hero')}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-light border-[3px] border-border rounded-xl flex items-center justify-center shadow-[4px_4px_0_var(--color-pink-deep)] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 overflow-hidden">
            <MelodyPixel className="w-8 h-8 md:w-10 md:h-10 translate-y-1" />
          </div>
          <span className="font-pixel text-lg md:text-2xl text-ink font-black tracking-widest hidden sm:block mt-1">Archive</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-6 font-sans font-black text-xs md:text-sm uppercase tracking-widest">
          <button onClick={() => scrollTo('hero')} className="hover:text-pink-deep transition-colors px-3 py-2 rounded-xl hover:bg-pink-light border-2 border-transparent hover:border-border">Home</button>
          {highlights.length > 0 && (
            <button onClick={() => scrollTo('highlights')} className="hover:text-pink-deep transition-colors px-3 py-2 rounded-xl hover:bg-pink-light border-2 border-transparent hover:border-border hidden md:block">Stories</button>
          )}
          {photos.length > 0 && (
            <button onClick={() => scrollTo('gallery')} className="bg-pink-deep text-white px-5 py-2.5 border-[3px] border-border rounded-xl shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-y-0 active:shadow-[0px_0px_0_var(--color-ink)] transition-all">Gallery</button>
          )}
        </nav>
      </header>

      {/* Floating scroll-to-top */}
      <motion.div
        className="fixed bottom-8 right-8 z-[60] w-16 h-16 md:w-20 md:h-20 bg-white border-[4px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-sage)] flex items-center justify-center p-2 hidden sm:flex cursor-pointer hover:scale-110 active:scale-95 transition-all"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <MelodyPixel className="w-full h-full" />
      </motion.div>

      <main className="pt-24 md:pt-32">
        {/* HERO */}
        <section id="hero" className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 z-10 overflow-hidden">
          <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-24 left-[10%] w-32 h-32 bg-white rounded-full border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] opacity-90 z-0 hidden md:flex items-center justify-center overflow-hidden">
            <MelodyPixel className="w-20 h-20 translate-y-2" delay={0.2} />
            <motion.div className="absolute -top-2 -right-4 bg-white border-2 border-border px-3 py-1 rounded-xl text-[10px] font-pixel text-pink-deep shadow-[2px_2px_0_var(--color-sage)] whitespace-nowrap" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>Konichiwa!</motion.div>
          </motion.div>
          <motion.div animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-32 right-[15%] w-32 h-32 bg-white rounded-3xl border-[3px] border-border shadow-[4px_4px_0_var(--color-pink-deep)] transform rotate-12 opacity-90 z-0 hidden md:flex items-center justify-center overflow-hidden">
            <MelodyPixel className="w-20 h-20 translate-y-2" delay={0.5} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto relative z-10">
            <motion.div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-white border-[3px] border-border rounded-full font-sans font-black uppercase tracking-widest text-xs text-pink-deep shadow-[4px_4px_0_var(--color-sage-dark)] cursor-default hover:scale-105 transition-transform"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
              <span className="w-2 h-2 rounded-full bg-pink-deep animate-ping" />
              Kenangan Baru Terbuka
            </motion.div>

            <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-pixel mb-8 text-ink leading-tight drop-shadow-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
              Pixel{' '}
              <span className="relative inline-block mt-2 md:mt-0">
                <span className="relative z-10 text-white bg-pink-deep px-4 py-1 rounded-2xl inline-block -rotate-3 border-[4px] border-border shadow-[6px_6px_0_var(--color-sage)]">Memories</span>
              </span>
            </motion.h1>

            <motion.p className="text-base md:text-xl md:leading-relaxed text-ink/80 mb-12 font-sans font-bold max-w-xl mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-3xl border-2 border-dashed border-pink-deep/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}>
              {fd.pesan}
            </motion.p>

            <motion.div className="mt-2 text-sm font-serif italic text-ink/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              — {fd.nama_pengirim}
              {fd.tanggal && `, ${new Date(fd.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </motion.div>
          </motion.div>

          {photos.length > 0 && (
            <motion.div className="mt-12 z-10" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: 'spring', stiffness: 100 }}>
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="p-5 bg-white border-[4px] border-border rounded-full cursor-pointer hover:bg-pink-soft hover:scale-110 active:scale-95 transition-all shadow-[6px_6px_0_var(--color-sage)] group"
                onClick={() => scrollTo('gallery')}>
                <ArrowDown className="text-pink-deep group-hover:text-ink transition-colors" size={32} strokeWidth={4} />
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* HIGHLIGHTS */}
        {highlights.length > 0 && (
          <section id="highlights" className="py-24 px-4 relative z-10 bg-sage/20 border-y-4 border-border">
            <div className="max-w-6xl mx-auto">
              <motion.div className="text-center mb-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <div className="inline-block px-4 py-1 bg-white border-2 border-border font-sans font-bold uppercase tracking-widest text-pink-deep text-xs mb-4 shadow-[4px_4px_0_var(--color-pink-soft)]">Highlights</div>
                <h2 className="text-3xl md:text-4xl font-serif font-black uppercase tracking-widest text-ink mt-2">Cerita di Baliknya</h2>
              </motion.div>
              <div className="space-y-32">
                {highlights.map((h, idx) => (
                  <motion.div key={idx} className={`flex flex-col ${h.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20`}
                    initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8 }}>
                    {photos[idx] && (
                      <div className="w-full md:w-1/2 relative group">
                        <div className="absolute inset-0 bg-pink-deep translate-x-4 translate-y-4 border-4 border-border" />
                        <img src={photos[idx]} alt={h.title} className="relative z-10 w-full aspect-video object-cover border-4 border-border sepia-[0.3] contrast-125 group-hover:sepia-[0.1] transition-all duration-700" loading="lazy" />
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-border z-20" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-border z-20" />
                      </div>
                    )}
                    <div className="w-full md:w-1/2 space-y-6">
                      <h3 className="text-2xl md:text-3xl font-serif font-black uppercase text-ink tracking-wider">{h.title}</h3>
                      <p className="text-md text-ink/80 font-sans leading-relaxed border-l-2 border-pink-deep pl-4 italic">{h.desc}</p>
                      <motion.div className="bg-white p-4 border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] inline-block mt-4" whileHover={{ scale: 1.05, x: 10 }}>
                        <span className="font-sans font-bold text-[10px] uppercase text-pink-deep block mb-1 tracking-widest">RECORDED MEMORY</span>
                        <p className="font-serif text-sm italic text-ink/70">Terima kasih sudah ada di sini.</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* GALLERY */}
        {photos.length > 0 && (
          <section id="gallery" className="py-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20 px-4 relative">
              <motion.div animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute left-[10%] top-0 hidden md:block">
                <Star className="text-sage-dark fill-sage" size={40} />
              </motion.div>
              <motion.h2 className="text-4xl md:text-6xl font-pixel text-ink inline-block relative py-2"
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                Gallery of Moments
                <span className="absolute -bottom-4 left-[-5%] w-[110%] h-[12px] rounded-full bg-pink-deep opacity-30 transform -skew-x-12" />
                <Sparkles className="absolute -top-8 -right-8 text-pink-deep fill-pink-soft animate-bounce" size={40} />
              </motion.h2>
              <motion.p className="mt-8 text-ink/80 font-sans font-bold max-w-lg mx-auto bg-white border-[3px] border-border rounded-xl p-4 shadow-[4px_4px_0_var(--color-sage)]"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                Koleksi foto kita. Klik buat lihat lebih besar!
              </motion.p>
            </div>

            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-x-8 md:gap-y-12">
              {photos.map((url, i) => (
                <motion.div key={i}
                  variants={{ hidden: { opacity: 0, y: 30, scale: 0.8, rotate: -5 }, show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } } }}
                  whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 3 : -3, y: -10 }}
                  className="group relative cursor-pointer" onClick={() => setLightbox({ open: true, idx: i })}>
                  <div className="bg-white p-3 pb-8 md:pb-6 border-[4px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-pink-soft)] transition-all group-hover:shadow-[8px_8px_0_var(--color-pink-deep)] group-hover:border-pink-deep z-10 relative">
                    <div className="aspect-square overflow-hidden border-[3px] border-border rounded-xl bg-pink-soft relative group-hover:border-pink-deep transition-colors">
                      <img src={url} alt="Memory" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-pink-soft/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <span className="bg-white px-5 py-2.5 font-sans font-black tracking-wider text-xs text-pink-deep border-[3px] border-border rounded-full shadow-[4px_4px_0_var(--color-pink-deep)] animate-bounce inline-flex items-center gap-2">
                          <ImageIcon size={14} strokeWidth={3} /> OPEN
                        </span>
                      </div>
                    </div>
                    {fd.captions?.[i] && (
                      <p className="mt-5 text-sm font-sans font-bold text-center text-ink/90 line-clamp-2 px-2 group-hover:text-pink-deep transition-colors">{fd.captions[i]}</p>
                    )}
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-100 transition-opacity transform rotate-12 bg-white rounded-full p-2 border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] z-20">
                    <Star size={20} className="fill-pink-deep text-pink-deep" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Lightbox */}
            {lightbox.open && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
                style={{ backgroundColor: 'rgba(253,251,247,0.9)', backdropFilter: 'blur(12px)' }}
                onClick={() => setLightbox((l) => ({ ...l, open: false }))}>
                <motion.div initial={{ scale: 0.8, rotate: -3 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8, rotate: 3 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="relative max-w-3xl w-full bg-white border-[5px] border-border rounded-3xl shadow-[12px_12px_0_var(--color-pink-soft)] p-4 sm:p-8"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5 border-b-[3px] border-dashed border-border/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-light p-2 rounded-xl border-[3px] border-border">
                        <Heart size={24} className="text-pink-deep fill-pink-deep animate-pulse" />
                      </div>
                      <span className="font-pixel text-lg uppercase font-black text-ink">Memory Archive</span>
                    </div>
                    <button className="text-ink bg-white border-[3px] border-border rounded-xl p-2.5 hover:bg-pink-deep hover:text-white transition-all shadow-[4px_4px_0_var(--color-sage)]"
                      onClick={() => setLightbox((l) => ({ ...l, open: false }))}>
                      <X size={24} strokeWidth={4} />
                    </button>
                  </div>
                  <img src={photos[lightbox.idx]} alt="Memory" className="w-full max-h-[55vh] object-contain rounded-xl border-[3px] border-border mb-6" />
                  <div className="flex items-center gap-4">
                    <button onClick={() => setLightbox((l) => ({ ...l, idx: (l.idx - 1 + photos.length) % photos.length }))}
                      className="p-4 bg-white border-[3px] border-border rounded-xl shadow-[4px_4px_0_var(--color-sage)] hover:bg-pink-light transition-all">
                      <ChevronLeft size={24} strokeWidth={4} />
                    </button>
                    <div className="flex-1 bg-pink-light/50 border-[3px] border-border rounded-xl p-4 shadow-[4px_4px_0_var(--color-sage)]">
                      <p className="text-sm font-black text-ink/90 text-center">{fd.captions?.[lightbox.idx] || `Foto ${lightbox.idx + 1} dari ${photos.length}`}</p>
                    </div>
                    <button onClick={() => setLightbox((l) => ({ ...l, idx: (l.idx + 1) % photos.length }))}
                      className="p-4 bg-white border-[3px] border-border rounded-xl shadow-[4px_4px_0_var(--color-sage)] hover:bg-pink-light transition-all">
                      <ChevronRight size={24} strokeWidth={4} />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </section>
        )}

        {/* FOOTER */}
        <footer className="py-24 px-4 mt-20 relative z-10 bg-white border-y-[6px] border-border overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-pink-soft) 0, var(--color-pink-soft) 20px, transparent 20px, transparent 40px)' }} />
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, type: 'spring' }}
            className="max-w-2xl mx-auto flex flex-col items-center relative z-10 bg-white p-8 md:p-12 rounded-3xl border-[4px] border-border shadow-[8px_8px_0_var(--color-sage)]">
            <motion.div animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="mb-8 relative cursor-pointer">
              <div className="w-24 h-24 bg-pink-light border-[4px] border-border rounded-full flex items-center justify-center shadow-[6px_6px_0_var(--color-pink-deep)] relative z-10 overflow-hidden">
                <MelodyPixel className="w-16 h-16 translate-y-2" delay={1} />
              </div>
              <Sparkles className="absolute -top-4 -right-4 text-sage-dark animate-spin-slow z-20" size={32} />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-pixel text-ink mb-6 py-2">Level Complete</h2>
            <p className="text-lg text-ink/80 font-sans font-bold leading-relaxed mb-10 max-w-lg">
              {fd.footer_message || 'Semoga masih banyak momen lucu dan random yang kita buat ke depannya. 🤍'}
            </p>
            <div className="font-sans font-black text-xs text-ink uppercase tracking-widest flex flex-col items-center gap-8 w-full">
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-pink-deep border-[3px] border-border rounded-full text-white shadow-[6px_6px_0_var(--color-ink)] hover:bg-pink-warm transition-all"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                PLAY AGAIN
              </motion.button>
              <p className="mt-8 pt-6 w-full border-t-[3px] border-dashed border-border/20 text-ink/60">
                Made with love & pixels — {new Date().getFullYear()}
              </p>
            </div>
          </motion.div>
        </footer>
      </main>
    </div>
  );
}
