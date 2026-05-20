import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { statusBadgeClass } from '../../utils/helpers';

// ── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl border-2 border-border select-none focus:outline-none focus:ring-2 focus:ring-pink-deep/50 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-pink-deep text-white border-border shadow-[4px_4px_0_var(--color-border)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-border)] active:translate-y-0 active:shadow-[0px_0px_0_var(--color-border)]',
    secondary:
      'bg-white text-ink border-border shadow-[4px_4px_0_var(--color-sage)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-sage)] active:translate-y-0 active:shadow-none',
    ghost:
      'bg-transparent text-ink border-transparent hover:bg-pink-light hover:border-border',
    danger:
      'bg-red-100 text-red-700 border-red-300 shadow-[4px_4px_0_#fca5a5] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#fca5a5]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(253,251,247,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={`w-full ${maxWidth} bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-dashed border-border/30">
                <h3 className="font-pixel text-lg text-ink">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl border-2 border-border hover:bg-pink-light transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-pink-deep ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
      <Spinner size={40} />
      <p className="font-pixel text-ink/60 text-sm">Loading...</p>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: '⏳ Menunggu',
    approved: '✅ Disetujui',
    rejected: '❌ Ditolak',
  };
  return (
    <span className={`${statusBadgeClass(status)} text-xs font-bold px-2.5 py-1 rounded-full`}>
      {labels[status] || status}
    </span>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-ink/70">{label}</label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border-[3px] rounded-xl text-ink font-medium placeholder:text-ink/30 focus:outline-none focus:border-pink-deep transition-colors ${
          error ? 'border-red-400' : 'border-border/50 hover:border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-ink/70">{label}</label>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-white border-[3px] rounded-xl text-ink font-medium placeholder:text-ink/30 focus:outline-none focus:border-pink-deep transition-colors resize-none ${
          error ? 'border-red-400' : 'border-border/50 hover:border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white border-[3px] border-border rounded-2xl shadow-[6px_6px_0_var(--color-sage)] ${className}`}
    >
      {children}
    </div>
  );
}
