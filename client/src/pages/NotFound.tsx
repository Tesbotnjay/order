import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { PixelParticles } from '../components/template/PixelParticles';
import { MelodyPixel } from '../components/template/MelodyPixel';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream text-ink relative overflow-hidden flex items-center justify-center px-4">
      <PixelParticles />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-sm"
      >
        <div className="bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] p-10">
          {/* Character */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-cream border-[3px] border-border rounded-full flex items-center justify-center overflow-hidden shadow-[4px_4px_0_var(--color-pink-deep)]">
              <MelodyPixel className="w-20 h-20 translate-y-2" />
            </div>
          </div>

          {/* 404 */}
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="font-pixel text-6xl text-pink-deep mb-4 leading-none"
          >
            404
          </motion.div>

          <h1 className="font-pixel text-xl text-ink mb-3">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-ink/60 font-medium mb-8 leading-relaxed">
            Sepertinya halaman ini hilang atau tidak pernah ada. Yuk balik ke beranda!
          </p>

          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-deep text-white font-black rounded-2xl shadow-[4px_4px_0_var(--color-pink-deep)] border-2 border-ink/10 text-sm uppercase tracking-widest"
            >
              <Home size={16} />
              Ke Beranda
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
