import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';
import { isSafeRedirect, sanitizeText } from '../utils/security';
import { registerSchema, loginSchema } from '../utils/schemas';
import { Button, Input } from '../components/ui/index';
import { toast, ToastContainer } from '../components/ui/Toast';
import { MelodyPixel } from '../components/template/MelodyPixel';

type Tab = 'login' | 'register';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setSession } = useAuthStore();
  const redirect = searchParams.get('redirect');
  const tabParam = searchParams.get('tab') as Tab | null;

  const [tab, setTab] = useState<Tab>(tabParam === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Already logged in
  useEffect(() => {
    if (user) {
      const target = redirect && isSafeRedirect(redirect) ? redirect : '/create';
      navigate(target, { replace: true });
    }
  }, [user]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = async () => {
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: sanitizeText(form.full_name, 100) },
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      toast.success('Cek email kamu untuk verifikasi akun! 🎉');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email: form.email, password: form.password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      setSession(data.session);
      const target = redirect && isSafeRedirect(redirect) ? redirect : '/create';
      navigate(target, { replace: true });
    } catch (err: unknown) {
      toast.error('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!form.email) { setErrors({ email: 'Email wajib diisi' }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth` },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success('Magic link dikirim! Cek email kamu ✨');
    } catch (err: unknown) {
      toast.error('Gagal mengirim magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <ToastContainer />

      <div className="w-full max-w-md">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={16} />
          Kembali
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center border-b-[3px] border-dashed border-border/20">
            <div className="w-16 h-16 mx-auto mb-4 bg-pink-light border-[3px] border-border rounded-full flex items-center justify-center overflow-hidden shadow-[4px_4px_0_var(--color-pink-deep)]">
              <MelodyPixel className="w-12 h-12 translate-y-1" />
            </div>
            <h1 className="font-pixel text-2xl text-ink mb-1">Pixel Memories</h1>
            <p className="text-xs text-ink/50 font-medium">Masuk atau daftar untuk melanjutkan</p>
          </div>

          {/* Tab Toggle */}
          <div className="flex border-b-[3px] border-border/20">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); setMagicSent(false); }}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${
                  tab === t
                    ? 'text-pink-deep border-b-[3px] border-pink-deep -mb-[3px] bg-pink-light/50'
                    : 'text-ink/40 hover:text-ink'
                }`}
              >
                {t === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {magicSent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="font-pixel text-lg text-ink mb-2">Cek Emailmu!</h3>
                <p className="text-sm text-ink/60 font-medium">
                  Magic link sudah dikirim ke <strong>{form.email}</strong>. Klik link di email untuk masuk.
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="mt-6 text-xs font-bold text-pink-deep underline"
                >
                  Kirim ulang
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {tab === 'register' && (
                  <Input
                    label="Nama Lengkap"
                    type="text"
                    placeholder="Nama kamu"
                    value={form.full_name}
                    onChange={set('full_name')}
                    error={errors.full_name}
                    autoComplete="name"
                  />
                )}

                <Input
                  label="Email"
                  type="email"
                  placeholder="email@kamu.com"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    label={tab === 'register' ? 'Password (min 8 karakter)' : 'Password'}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    error={errors.password}
                    autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-[34px] text-ink/40 hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {tab === 'login' ? (
                  <>
                    <Button
                      variant="primary"
                      className="w-full"
                      size="lg"
                      loading={loading}
                      onClick={handleLogin}
                    >
                      <Lock size={18} />
                      Masuk
                    </Button>
                    <div className="relative text-center">
                      <span className="text-xs text-ink/30 bg-white px-3">atau</span>
                      <div className="absolute inset-x-0 top-1/2 border-t border-border/20 -z-10" />
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="lg"
                      loading={loading}
                      onClick={handleMagicLink}
                    >
                      <Mail size={18} />
                      Kirim Magic Link
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    loading={loading}
                    onClick={handleRegister}
                  >
                    <User size={18} />
                    Daftar Sekarang
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-ink/40 mt-6 font-medium">
          Dengan mendaftar, kamu setuju dengan ketentuan layanan kami.
        </p>
      </div>
    </div>
  );
}
