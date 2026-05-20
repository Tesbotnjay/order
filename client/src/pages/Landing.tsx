import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles, Heart, Image as ImageIcon, Music, QrCode, Camera } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/ui/Navbar';
import { PixelParticles } from '../components/template/PixelParticles';
import { MelodyPixel } from '../components/template/MelodyPixel';
import { ToastContainer } from '../components/ui/Toast';

const FEATURES = [
  { icon: <Heart size={24} />, title: 'Desain Romantis', desc: 'Template pixel aesthetic yang hangat, personal, dan berkesan.' },
  { icon: <ImageIcon size={24} />, title: 'Gallery Foto', desc: 'Upload hingga 11 foto kenangan dengan caption personal.' },
  { icon: <Music size={24} />, title: 'Musik Pengiring', desc: 'Tambahkan lagu favorit sebagai musik latar website.' },
  { icon: <QrCode size={24} />, title: 'QR Code & Link', desc: 'Bagikan via WhatsApp atau cetak QR code-nya.' },
];

export default function Landing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) navigate('/create');
    else navigate('/auth?redirect=/create');
  };

  return (
    <div className="min-h-screen bg-cream text-ink relative overflow-x-hidden">
      <PixelParticles />
      <Navbar />
      <ToastContainer />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-28 pb-20 z-10">
        {/* Floating decorations */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-32 left-[8%] w-28 h-28 bg-white rounded-full border-[3px] border-border shadow-[4px_4px_0_var(--color-sage)] opacity-90 z-0 hidden md:flex items-center justify-center overflow-hidden"
        >
          <MelodyPixel className="w-20 h-20 translate-y-2" delay={0.2} />
        </motion.div>
        <motion.div
          animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-36 right-[12%] w-28 h-28 bg-white rounded-3xl border-[3px] border-border shadow-[4px_4px_0_var(--color-pink-deep)] transform rotate-12 opacity-90 z-0 hidden md:flex items-center justify-center overflow-hidden"
        >
          <MelodyPixel className="w-20 h-20 translate-y-2" delay={0.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto z-10"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-white border-[3px] border-border rounded-full font-sans font-black uppercase tracking-widest text-xs text-pink-deep shadow-[4px_4px_0_var(--color-sage-dark)]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <span className="w-2 h-2 rounded-full bg-pink-deep animate-ping" />
            Buat Kenangan Jadi Website
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-pixel mb-8 text-ink leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Pixel{' '}
            <span className="relative inline-block mt-2 md:mt-0">
              <span className="relative z-10 text-white bg-pink-deep px-4 py-1 rounded-2xl inline-block -rotate-3 border-[4px] border-border shadow-[6px_6px_0_var(--color-sage)]">
                Memories
              </span>
            </span>
          </motion.h1>

          <motion.p
            className="text-base md:text-xl text-ink/80 mb-12 font-sans font-bold max-w-xl mx-auto bg-white/70 backdrop-blur-sm p-6 rounded-3xl border-2 border-dashed border-pink-deep/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Hadiah digital paling personal — website kenangan dengan foto, surat, dan musik untuk orang yang kamu sayang.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 100 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <button
              onClick={handleCTA}
              className="group flex items-center gap-3 px-8 py-4 bg-pink-deep text-white border-[4px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-ink)] font-black text-lg hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-ink)] active:translate-y-0 active:shadow-none transition-all"
            >
              Buat Sekarang
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/w/demo"
              className="flex items-center gap-2 px-8 py-4 bg-white text-ink border-[3px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)] font-bold hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-sage)] transition-all"
            >
              <Sparkles size={18} className="text-sage-dark" />
              Lihat Contoh
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-sage/20 border-y-[4px] border-border relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-white border-2 border-border font-sans font-bold uppercase tracking-widest text-pink-deep text-xs mb-4 shadow-[4px_4px_0_var(--color-pink-soft)]">
              Fitur
            </div>
            <h2 className="text-3xl md:text-4xl font-pixel text-ink">Apa yang Kamu Dapat?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white p-6 border-[3px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-sage)] hover:shadow-[8px_8px_0_var(--color-pink-soft)] hover:-translate-y-1 transition-all cursor-default"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="w-12 h-12 bg-pink-light border-[3px] border-border rounded-xl flex items-center justify-center text-pink-deep mb-4 shadow-[3px_3px_0_var(--color-sage)]">
                  {f.icon}
                </div>
                <h3 className="font-pixel text-lg text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink/70 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photobooth Banner */}
      <section className="py-20 px-4 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-pink-deep border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-ink)] p-8 md:p-12 relative overflow-hidden"
          >
            {/* Decorative dots */}
            <div className="absolute top-4 right-4 w-20 h-20 grid grid-cols-4 gap-1 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white" />
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-white/20 border-2 border-white/40 rounded-full text-white text-xs font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Fitur Gratis
                </div>
                <h2 className="font-pixel text-3xl md:text-4xl text-white mb-3 leading-tight">
                  Photobooth
                  <br />
                  <span className="text-pink-light">Online! 📸</span>
                </h2>
                <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed mb-6">
                  Foto langsung pakai kamera HP atau laptop. Pilih frame aesthetic, countdown otomatis, dan download hasilnya seketika. Gratis, tanpa daftar!
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['12 Frame Pilihan', 'Countdown Timer', 'Langsung Download', 'Gratis!'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white/15 border border-white/30 rounded-full text-white text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to="/photobooth"
                  className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-pink-deep border-[3px] border-border rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,0.3)] font-black text-sm hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,0.3)] transition-all"
                >
                  <Camera size={18} />
                  Coba Photobooth Sekarang
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Frame preview grid */}
              <div className="flex-shrink-0 grid grid-cols-3 gap-2 w-48 md:w-56">
                {['frame_01_airmail', 'frame_05_gingham_2x4', 'frame_07_vintage', 'frame_04_black_party', 'frame_08_gingham_1x4', 'frame_11_hellokitty'].map((id) => (
                  <div
                    key={id}
                    className="aspect-[2/3] rounded-xl border-2 border-white/30 overflow-hidden bg-white/10"
                  >
                    <img
                      src={`/frames/${id}.png`}
                      alt=""
                      className="w-full h-full object-cover opacity-90"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-10 border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-pink-light border-[3px] border-border rounded-full flex items-center justify-center shadow-[4px_4px_0_var(--color-pink-deep)] overflow-hidden">
              <MelodyPixel className="w-14 h-14 translate-y-2" />
            </div>
            <h2 className="font-pixel text-3xl text-ink mb-4">Mulai dari Rp 15.000</h2>
            <p className="text-ink/70 font-medium mb-8 leading-relaxed">
              Harga terjangkau untuk kenangan yang tak ternilai. Daftar gratis, bayar setelah isi data.
            </p>
            <button
              onClick={handleCTA}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-pink-deep text-white border-[4px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-ink)] font-black text-lg hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-ink)] transition-all"
            >
              <Star size={20} className="fill-white" />
              Buat Website Sekarang
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[4px] border-border py-8 px-4 text-center relative z-10">
        <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">
          Made with love & pixels — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
