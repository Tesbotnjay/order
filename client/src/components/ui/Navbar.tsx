import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, LogOut, Package, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/helpers';
import { MelodyPixel } from '../template/MelodyPixel';

export function Navbar() {
  const { user, profile, signOut } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 h-16 md:h-20 bg-white/90 backdrop-blur-md border-[4px] border-border rounded-2xl z-40 px-4 md:px-8 flex items-center justify-between shadow-[4px_4px_0_var(--color-sage)] transition-all duration-300">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 cursor-pointer group">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-light border-[3px] border-border rounded-xl flex items-center justify-center shadow-[4px_4px_0_var(--color-pink-deep)] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 overflow-hidden">
          <MelodyPixel className="w-8 h-8 md:w-10 md:h-10 translate-y-1" />
        </div>
        <span className="font-pixel text-lg md:text-2xl text-ink font-black tracking-widest hidden sm:block mt-1">
          Pixel Memories
        </span>
      </Link>

      {/* Right side */}
      <nav className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-white border-[3px] border-border rounded-xl hover:bg-pink-light transition-all shadow-[3px_3px_0_var(--color-sage)]"
            >
              <div className="w-8 h-8 bg-pink-deep border-2 border-border rounded-lg flex items-center justify-center text-white text-xs font-black">
                {profile?.full_name ? getInitials(profile.full_name) : <User size={14} />}
              </div>
              <span className="hidden sm:block text-sm font-bold text-ink max-w-[120px] truncate">
                {profile?.full_name || user.email}
              </span>
              <ChevronDown
                size={14}
                className={`text-ink/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white border-[3px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-sage)] overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b-2 border-border/20">
                    <p className="text-xs font-bold text-ink/50 uppercase tracking-widest">Akun</p>
                    <p className="text-sm font-bold text-ink truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/my-orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-pink-light transition-colors text-sm font-bold text-ink"
                    >
                      <Package size={16} className="text-pink-deep" />
                      Pesanan Saya
                    </Link>
                    <Link
                      to="/membership"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-sm font-bold text-ink"
                    >
                      <Crown size={16} className="text-amber-500" />
                      Membership
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm font-bold text-red-600"
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {dropdownOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-bold text-ink border-[2px] border-border/50 rounded-xl hover:border-border hover:bg-pink-light transition-all"
            >
              Masuk
            </Link>
            <Link
              to="/auth?tab=register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-pink-deep border-[3px] border-border rounded-xl shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-y-0 transition-all"
            >
              Daftar
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
