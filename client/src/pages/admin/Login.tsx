import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { Button, Input } from '../../components/ui/index';
import { toast, ToastContainer } from '../../components/ui/Toast';
import { MelodyPixel } from '../../components/template/MelodyPixel';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setSession } = useAdminStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Email atau password salah');
        return;
      }
      setSession(data.token, data.expiresAt);
      navigate('/admin/dashboard');
    } catch {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center border-b-[3px] border-dashed border-border/20">
            <div className="w-16 h-16 mx-auto mb-4 bg-pink-light border-[3px] border-border rounded-full flex items-center justify-center overflow-hidden shadow-[4px_4px_0_var(--color-pink-deep)]">
              <MelodyPixel className="w-12 h-12 translate-y-1" />
            </div>
            <h1 className="font-pixel text-2xl text-ink mb-1">Admin Panel</h1>
            <p className="text-xs text-ink/40 font-medium uppercase tracking-widest">Pixel Memories</p>
          </div>

          <div className="p-8 space-y-5">
            <Input
              label="Email Admin"
              type="email"
              placeholder="admin@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-[34px] text-ink/40 hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              loading={loading}
              onClick={handleLogin}
            >
              <Lock size={18} />
              Masuk ke Admin
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-ink/30 mt-4 font-medium">
          Session otomatis berakhir saat browser ditutup.
        </p>
      </motion.div>
    </div>
  );
}
