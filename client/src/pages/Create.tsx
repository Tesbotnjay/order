import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Music, Image, Flower2, FileText, Crown, Lock } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/ui/ProtectedRoute';
import { Navbar } from '../components/ui/Navbar';
import { Button, Input, Textarea, Card } from '../components/ui/index';
import { toast, ToastContainer } from '../components/ui/Toast';
import { useMembership } from '../hooks/useBuyerAuth';
import { sanitizeText, validateFileMagicBytes, generateSafeFilename } from '../utils/security';
import { generateOrderId } from '../utils/helpers';

type TemplateType = 'contoh' | 'demo';

interface FormData {
  template_type: TemplateType;
  nama_pengirim: string;
  nama_penerima: string;
  pesan: string;
  tanggal: string;
  highlight_title_1: string;
  highlight_desc_1: string;
  highlight_title_2: string;
  highlight_desc_2: string;
  captions: string[];
  footer_message: string;
  foto_files: File[];
  music_file: File | null;
}

const STEPS_CONTOH = ['Pilih Template', 'Data Penerima', 'Surat & Cerita', 'Foto & Musik', 'Konfirmasi'];
const STEPS_DEMO   = ['Pilih Template', 'Data Penerima', 'Isi Surat', 'Janji Mekar', 'Konfirmasi'];

function CreateInner() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isActive, activeMembership, loading: memberLoading } = useMembership();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    template_type: 'contoh',
    nama_pengirim: '',
    nama_penerima: '',
    pesan: '',
    tanggal: '',
    highlight_title_1: '',
    highlight_desc_1: '',
    highlight_title_2: '',
    highlight_desc_2: '',
    captions: Array(11).fill(''),
    footer_message: '',
    foto_files: [],
    music_file: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const STEPS = form.template_type === 'demo' ? STEPS_DEMO : STEPS_CONTOH;

  // Membership gate
  if (memberLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-deep border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border-[4px] border-border rounded-3xl shadow-[8px_8px_0_var(--color-sage)] max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-pink-light border-[3px] border-border rounded-full flex items-center justify-center">
            <Lock size={28} className="text-pink-deep" />
          </div>
          <h2 className="font-pixel text-xl text-ink mb-3">Butuh Membership</h2>
          <p className="text-sm text-ink/60 font-medium mb-6 leading-relaxed">
            Kamu perlu membership aktif untuk membuat website kenangan. Mulai dari Rp 15.000/bulan.
          </p>
          <Link
            to="/membership"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-deep text-white font-black rounded-xl border-[3px] border-border shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all text-sm"
          >
            <Crown size={16} /> Beli Membership
          </Link>
        </div>
      </div>
    );
  }

  const setField = (k: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [k]: val }));

  const setCaption = (idx: number, val: string) =>
    setForm((f) => {
      const captions = [...f.captions];
      captions[idx] = val;
      return { ...f, captions };
    });

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 11 - form.foto_files.length);
    const valid: File[] = [];
    for (const file of arr) {
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Hanya JPG/PNG max 5MB`); continue;
      }
      const ok = await validateFileMagicBytes(file);
      if (!ok) { toast.error(`${file.name}: File tidak valid`); continue; }
      valid.push(file);
    }
    setForm((f) => ({ ...f, foto_files: [...f.foto_files, ...valid].slice(0, 11) }));
  };

  const handleMusicUpload = async (file: File | null) => {
    if (!file) return;
    if (file.type !== 'audio/mpeg' || file.size > 10 * 1024 * 1024) {
      toast.error('Hanya MP3 max 10MB'); return;
    }
    const ok = await validateFileMagicBytes(file);
    if (!ok) { toast.error('File musik tidak valid'); return; }
    setForm((f) => ({ ...f, music_file: file }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.nama_pengirim || form.nama_pengirim.length < 2) errs.nama_pengirim = 'Nama pengirim wajib diisi (min 2 karakter)';
      if (!form.nama_penerima || form.nama_penerima.length < 2) errs.nama_penerima = 'Nama penerima wajib diisi (min 2 karakter)';
    }
    if (step === 2) {
      if (!form.pesan || form.pesan.length < 10) errs.pesan = 'Pesan wajib diisi (min 10 karakter)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!user) return;
    setSubmitting(true);
    try {
      const orderId = generateOrderId();
      const assetUrls: Record<string, string | string[]> = {};

      if (form.template_type === 'contoh') {
        if (form.foto_files.length > 0) {
          const photoUrls: string[] = [];
          for (const file of form.foto_files) {
            const fname = generateSafeFilename(file.name, `${user.id}/${orderId}/photo`);
            const { data, error } = await supabase.storage.from('assets').upload(fname, file, { contentType: file.type, upsert: false });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
            photoUrls.push(publicUrl);
          }
          assetUrls.photos = photoUrls;
        }
        if (form.music_file) {
          const fname = generateSafeFilename(form.music_file.name, `${user.id}/${orderId}/music`);
          const { data, error } = await supabase.storage.from('assets').upload(fname, form.music_file, { contentType: 'audio/mpeg', upsert: false });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
          assetUrls.music = publicUrl;
        }
      }

      const formData: Record<string, unknown> = {
        template_type: form.template_type,
        nama_pengirim: sanitizeText(form.nama_pengirim, 100),
        nama_penerima: sanitizeText(form.nama_penerima, 100),
        pesan: sanitizeText(form.pesan, 2000),
        tanggal: form.tanggal,
        footer_message: sanitizeText(form.footer_message, 300),
      };

      if (form.template_type === 'contoh') {
        formData.highlight_title_1 = sanitizeText(form.highlight_title_1, 80);
        formData.highlight_desc_1  = sanitizeText(form.highlight_desc_1, 500);
        formData.highlight_title_2 = sanitizeText(form.highlight_title_2, 80);
        formData.highlight_desc_2  = sanitizeText(form.highlight_desc_2, 500);
        formData.captions = form.captions.map((c) => sanitizeText(c, 200));
      } else {
        formData.captions = form.captions.slice(0, 5).map((c) => sanitizeText(c, 200));
      }

      const { error: orderError } = await supabase.from('orders').insert({
        order_id: orderId,
        buyer_id: user.id,
        status: 'pending',
        nominal: activeMembership?.nominal ?? 0,
        plan: activeMembership?.plan ?? 'basic',
        form_data: formData,
        asset_urls: assetUrls,
      });
      if (orderError) throw orderError;

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userEmail: user.email }),
      });

      navigate(`/status/${orderId}`);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <ToastContainer />

      <div className="pt-28 md:pt-36 pb-20 px-4 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-xl border-[3px] border-border text-xs font-black flex items-center justify-center transition-all flex-shrink-0 ${
                  i < step ? 'step-done' : i === step ? 'step-active' : 'step-inactive'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-pink-deep' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
            Langkah {step + 1} dari {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── STEP 0: Pilih Template ── */}
            {step === 0 && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-2">Pilih Template</h2>
                <p className="text-sm text-ink/60 font-medium mb-8">Pilih jenis website kenangan yang ingin kamu buat.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setForm((f) => ({ ...f, template_type: 'contoh' }))}
                    className={`text-left p-5 rounded-2xl border-[3px] transition-all ${
                      form.template_type === 'contoh'
                        ? 'border-pink-deep bg-pink-light shadow-[4px_4px_0_var(--color-pink-deep)]'
                        : 'border-border bg-white hover:border-pink-deep/50 shadow-[3px_3px_0_var(--color-sage)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        form.template_type === 'contoh' ? 'bg-pink-deep text-white' : 'bg-sage/40 text-ink'
                      }`}><Image size={20} /></div>
                      <div>
                        <p className="font-black text-sm text-ink">Foto & Cerita</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Album Kenangan</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {['Gallery foto hingga 11 foto', 'Caption per foto', 'Surat & cerita spesial', 'Musik pengiring pilihanmu', 'Highlight dua momen'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-ink/70 font-medium">
                          <span className="text-pink-deep">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </button>

                  <button
                    onClick={() => setForm((f) => ({ ...f, template_type: 'demo' }))}
                    className={`text-left p-5 rounded-2xl border-[3px] transition-all ${
                      form.template_type === 'demo'
                        ? 'border-pink-deep bg-pink-light shadow-[4px_4px_0_var(--color-pink-deep)]'
                        : 'border-border bg-white hover:border-pink-deep/50 shadow-[3px_3px_0_var(--color-sage)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        form.template_type === 'demo' ? 'bg-pink-deep text-white' : 'bg-sage/40 text-ink'
                      }`}><FileText size={20} /></div>
                      <div>
                        <p className="font-black text-sm text-ink">Surat Interaktif</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Cat Story</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {['Animasi kucing lucu', 'Intro 3D sinematik', 'Surat dengan efek ketik', 'Mini-game kelopak', 'Adegan mekar & akhir romantis'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-ink/70 font-medium">
                          <span className="text-pink-deep">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-start gap-1.5 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-amber-500 text-xs mt-0.5">🎵</span>
                      <p className="text-[10px] font-bold text-amber-700 leading-relaxed">Musik & teks 3D sudah disinkronkan — tidak bisa diganti</p>
                    </div>
                  </button>
                </div>
              </Card>
            )}

            {/* ── STEP 1: Data Penerima ── */}
            {step === 1 && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-6">Data Penerima</h2>
                <div className="space-y-5">
                  <Input label="Nama Pengirim (Kamu)" placeholder="Namamu" value={form.nama_pengirim}
                    onChange={(e) => setField('nama_pengirim')(e.target.value)} error={errors.nama_pengirim} maxLength={100} />
                  <Input label="Nama Penerima" placeholder="Nama orang tersayang" value={form.nama_penerima}
                    onChange={(e) => setField('nama_penerima')(e.target.value)} error={errors.nama_penerima} maxLength={100} />
                  {form.template_type === 'contoh' && (
                    <Input label="Tanggal Spesial (Opsional)" type="date" value={form.tanggal}
                      onChange={(e) => setField('tanggal')(e.target.value)} />
                  )}
                </div>
              </Card>
            )}

            {/* ── STEP 2 Contoh: Surat & Cerita ── */}
            {step === 2 && form.template_type === 'contoh' && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-6">Surat & Cerita</h2>
                <div className="space-y-5">
                  <Textarea label="Surat / Pesan Utama" placeholder="Tulis perasaanmu di sini... (min 10 karakter)"
                    value={form.pesan} onChange={(e) => setField('pesan')(e.target.value)}
                    error={errors.pesan} rows={6} maxLength={2000} hint={`${form.pesan.length}/2000 karakter`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-ink/70">Cerita 1</p>
                      <Input placeholder="Judul cerita" value={form.highlight_title_1} onChange={(e) => setField('highlight_title_1')(e.target.value)} maxLength={80} />
                      <Textarea placeholder="Ceritanya..." value={form.highlight_desc_1} onChange={(e) => setField('highlight_desc_1')(e.target.value)} rows={3} maxLength={500} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-ink/70">Cerita 2</p>
                      <Input placeholder="Judul cerita" value={form.highlight_title_2} onChange={(e) => setField('highlight_title_2')(e.target.value)} maxLength={80} />
                      <Textarea placeholder="Ceritanya..." value={form.highlight_desc_2} onChange={(e) => setField('highlight_desc_2')(e.target.value)} rows={3} maxLength={500} />
                    </div>
                  </div>
                  <Input label="Pesan Penutup (Footer)" placeholder="Semoga masih banyak momen indah ke depannya 🤍"
                    value={form.footer_message} onChange={(e) => setField('footer_message')(e.target.value)} maxLength={300} />
                </div>
              </Card>
            )}

            {/* ── STEP 2 Demo: Isi Surat ── */}
            {step === 2 && form.template_type === 'demo' && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-2">Isi Surat</h2>
                <p className="text-sm text-ink/60 font-medium mb-6">
                  Tulis isi surat — setiap baris akan muncul satu per satu dengan efek mesin ketik.
                </p>
                <div className="space-y-5">
                  <Textarea
                    label="Isi Surat (Enter = baris baru)"
                    placeholder={`Baris pertama suratmu...\nUngkapan perasaan...\nAlasan kamu menulis ini...\nHarapanmu ke depan...\n— Namamu`}
                    value={form.pesan} onChange={(e) => setField('pesan')(e.target.value)}
                    error={errors.pesan} rows={8} maxLength={2000}
                    hint={`${form.pesan.length}/2000 — pisahkan baris dengan Enter`} />
                  <Input label="Teks Penutup Layar Akhir"
                    placeholder="Makasih sudah mau baca sampai sini..."
                    value={form.footer_message} onChange={(e) => setField('footer_message')(e.target.value)} maxLength={200} />
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-1.5">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">Info Template Cat Story</p>
                    <p className="text-xs text-amber-800 font-medium">🎵 <strong>Musik</strong>: disinkronkan dengan alur — tidak bisa diganti.</p>
                    <p className="text-xs text-amber-800 font-medium">✨ <strong>Teks 3D sinematik</strong>: bagian dari animasi — tidak bisa diganti.</p>
                    <p className="text-xs text-amber-800 font-medium">🐱 <strong>Animasi, game & adegan</strong>: sudah dikurasi — fixed.</p>
                    <p className="text-xs text-amber-800 font-medium">📝 <strong>Yang bisa kamu isi</strong>: nama, isi surat, janji mekar, teks penutup.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* ── STEP 3 Contoh: Foto & Musik ── */}
            {step === 3 && form.template_type === 'contoh' && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-6">Foto & Musik</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-ink/70 mb-3">Foto Gallery ({form.foto_files.length}/11)</p>
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files)} />
                    <button onClick={() => photoInputRef.current?.click()} disabled={form.foto_files.length >= 11}
                      className="w-full border-[3px] border-dashed border-border/50 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-pink-deep hover:bg-pink-light/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      <Image size={32} className="text-pink-deep" />
                      <p className="font-bold text-sm text-ink/70">Klik untuk upload foto</p>
                      <p className="text-xs text-ink/40">JPG/PNG, max 5MB per file</p>
                    </button>
                    {form.foto_files.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                        {form.foto_files.map((f, i) => (
                          <div key={i} className="relative group">
                            <div className="aspect-square">
                              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl border-[3px] border-border" />
                            </div>
                            <button onClick={() => setForm((fd) => ({ ...fd, foto_files: fd.foto_files.filter((_, j) => j !== i) }))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white">
                              <X size={12} />
                            </button>
                            <div className="mt-2">
                              <input type="text" placeholder="Caption..." value={form.captions[i] || ''}
                                onChange={(e) => setCaption(i, e.target.value)} maxLength={200}
                                className="w-full text-xs px-2 py-1 border-2 border-border/30 rounded-lg focus:outline-none focus:border-pink-deep" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-ink/70 mb-3">Musik Pengiring (Opsional)</p>
                    <input ref={musicInputRef} type="file" accept="audio/mpeg" className="hidden"
                      onChange={(e) => handleMusicUpload(e.target.files?.[0] || null)} />
                    {form.music_file ? (
                      <div className="flex items-center gap-4 p-4 bg-sage/30 border-[3px] border-border rounded-xl">
                        <Music size={24} className="text-sage-dark flex-shrink-0" />
                        <span className="text-sm font-bold text-ink flex-1 truncate">{form.music_file.name}</span>
                        <button onClick={() => setForm((f) => ({ ...f, music_file: null }))} className="text-ink/40 hover:text-red-500 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => musicInputRef.current?.click()}
                        className="w-full border-[3px] border-dashed border-border/50 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-sage-dark hover:bg-sage/20 transition-all">
                        <Music size={28} className="text-sage-dark" />
                        <p className="font-bold text-sm text-ink/70">Upload lagu (MP3)</p>
                        <p className="text-xs text-ink/40">Max 10MB</p>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* ── STEP 3 Demo: Janji Mekar ── */}
            {step === 3 && form.template_type === 'demo' && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-2">Janji Mekar 🌸</h2>
                <p className="text-sm text-ink/60 font-medium mb-6">
                  Isi 5 janji yang akan mekar satu per satu saat penerima menyentuh bunga. Bisa dikosongkan.
                </p>
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-light border-2 border-border flex items-center justify-center flex-shrink-0">
                        <Flower2 size={14} className="text-pink-deep" />
                      </div>
                      <Input placeholder={`Janji ke-${i + 1}... (contoh: Aku akan selalu ada buatmu)`}
                        value={form.captions[i] || ''} onChange={(e) => setCaption(i, e.target.value)} maxLength={120} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-ink/40 font-medium mt-4">Janji yang dikosongkan akan tampil teks default</p>
              </Card>
            )}

            {/* ── STEP 4: Konfirmasi ── */}
            {step === STEPS.length - 1 && (
              <Card className="p-6 md:p-8">
                <h2 className="font-pixel text-2xl text-ink mb-2">Konfirmasi</h2>
                <p className="text-sm text-ink/60 font-medium mb-6">Cek kembali data sebelum dikirim.</p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-4 bg-pink-light/30 rounded-xl border-2 border-border/40">
                    <span className="text-xs font-black text-ink/50 uppercase tracking-widest">Template</span>
                    <span className="text-sm font-bold text-ink">
                      {form.template_type === 'demo' ? 'Surat Interaktif' : 'Foto & Cerita'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-pink-light/30 rounded-xl border-2 border-border/40">
                    <span className="text-xs font-black text-ink/50 uppercase tracking-widest">Dari → Untuk</span>
                    <span className="text-sm font-bold text-ink">
                      {form.nama_pengirim} → {form.nama_penerima}
                    </span>
                  </div>
                  {form.template_type === 'contoh' && (
                    <div className="flex items-center justify-between p-4 bg-pink-light/30 rounded-xl border-2 border-border/40">
                      <span className="text-xs font-black text-ink/50 uppercase tracking-widest">Foto</span>
                      <span className="text-sm font-bold text-ink">{form.foto_files.length} foto</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-pink-light/30 rounded-xl border-2 border-border/40">
                    <span className="text-xs font-black text-ink/50 uppercase tracking-widest">Membership</span>
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded-full border ${
                      activeMembership?.plan === 'premium'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-pink-light text-pink-deep border-pink-deep/30'
                    }`}>
                      {activeMembership?.plan === 'premium' ? '⭐ Premium' : '✦ Basic'}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium text-ink/50 leading-relaxed">
                  Setelah dikirim, admin akan mereview dan mengaktifkan website kamu. Kamu akan dapat notifikasi via pesanan.
                </p>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
            <ChevronLeft size={18} /> Sebelumnya
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={nextStep}>
              Selanjutnya <ChevronRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} loading={submitting} size="lg">
              ✅ Kirim Website
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Create() {
  return (
    <ProtectedRoute>
      <CreateInner />
    </ProtectedRoute>
  );
}
