import { useState, useEffect, useRef } from 'react';
import { Save, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/Sidebar';
import { Button, Input } from '../../components/ui/index';
import { toast, ToastContainer } from '../../components/ui/Toast';
import { useAdminStore } from '../../store/adminStore';

interface Settings {
  basic_price: number;
  premium_price: number;
  basic_label: string;
  premium_label: string;
  basic_description: string;
  premium_description: string;
  store_open: boolean;
  qris_image_url: string | null;
  whatsapp_number: string | null;
  telegram_chat_id: string | null;
}

export default function AdminSettings() {
  const { token } = useAdminStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const headers = { 'X-Admin-Token': token || '' };

  useEffect(() => {
    fetch('/api/admin/settings', { headers })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Settings) => (val: string | boolean | number) =>
    setSettings((s) => s ? { ...s, [k]: val } : s);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success('Pengaturan berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleQrisUpload = async (file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error('File QRIS: JPG/PNG max 2MB');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload-qris', {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setSettings((s) => s ? { ...s, qris_image_url: url } : s);
      toast.success('QR QRIS berhasil diupload!');
    } catch {
      toast.error('Gagal upload QRIS');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="font-pixel text-ink/40">Memuat...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <AdminSidebar />
      <ToastContainer />

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto admin-scroll">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-pixel text-2xl md:text-3xl text-ink">Pengaturan</h1>
              <p className="text-sm text-ink/50 font-medium mt-1">Konfigurasi toko dan harga</p>
            </div>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Save size={16} />
              Simpan
            </Button>
          </div>

          <div className="space-y-6">
            {/* Store status */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-4">Status Toko</h2>
              <div className="flex items-center justify-between p-4 bg-cream rounded-xl border-2 border-admin-border">
                <div>
                  <p className="font-bold text-ink">Terima Pesanan</p>
                  <p className="text-xs text-ink/50 font-medium">
                    {settings?.store_open ? 'Toko sedang buka — form /create aktif' : 'Toko tutup — form /create dinonaktifkan'}
                  </p>
                </div>
                <button
                  onClick={() => set('store_open')(!settings?.store_open)}
                  className="transition-colors"
                >
                  {settings?.store_open ? (
                    <ToggleRight size={40} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={40} className="text-ink/30" />
                  )}
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-4">Harga Paket</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-black text-ink/60 uppercase tracking-widest border-b border-admin-border pb-2">Paket Basic</p>
                  <Input
                    label="Nama Paket"
                    value={settings?.basic_label || ''}
                    onChange={(e) => set('basic_label')(e.target.value)}
                    maxLength={50}
                  />
                  <Input
                    label="Harga (Rp)"
                    type="number"
                    value={String(settings?.basic_price || '')}
                    onChange={(e) => set('basic_price')(Number(e.target.value))}
                    min="1000"
                    max="10000000"
                  />
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink/70">Deskripsi</label>
                    <textarea
                      value={settings?.basic_description || ''}
                      onChange={(e) => set('basic_description')(e.target.value)}
                      rows={3}
                      maxLength={300}
                      className="w-full mt-1.5 px-4 py-3 bg-white border-[3px] border-border/50 rounded-xl text-sm font-medium focus:outline-none focus:border-pink-deep resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-black text-ink/60 uppercase tracking-widest border-b border-admin-border pb-2">Paket Premium</p>
                  <Input
                    label="Nama Paket"
                    value={settings?.premium_label || ''}
                    onChange={(e) => set('premium_label')(e.target.value)}
                    maxLength={50}
                  />
                  <Input
                    label="Harga (Rp)"
                    type="number"
                    value={String(settings?.premium_price || '')}
                    onChange={(e) => set('premium_price')(Number(e.target.value))}
                    min="1000"
                    max="10000000"
                  />
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink/70">Deskripsi</label>
                    <textarea
                      value={settings?.premium_description || ''}
                      onChange={(e) => set('premium_description')(e.target.value)}
                      rows={3}
                      maxLength={300}
                      className="w-full mt-1.5 px-4 py-3 bg-white border-[3px] border-border/50 rounded-xl text-sm font-medium focus:outline-none focus:border-pink-deep resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QRIS */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-4">QR QRIS</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {settings?.qris_image_url ? (
                  <img
                    src={settings.qris_image_url}
                    alt="QRIS"
                    className="w-40 h-40 object-contain border-[3px] border-border rounded-2xl shadow-[4px_4px_0_var(--color-sage)]"
                  />
                ) : (
                  <div className="w-40 h-40 bg-cream border-[3px] border-dashed border-border rounded-2xl flex items-center justify-center">
                    <p className="text-xs text-ink/30 text-center font-medium px-3">Belum ada QRIS</p>
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink/70">Upload gambar QR QRIS baru. Akan menggantikan yang lama secara otomatis.</p>
                  <input
                    ref={qrisInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleQrisUpload(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" onClick={() => qrisInputRef.current?.click()} loading={saving}>
                    <Upload size={16} />
                    Ganti QRIS
                  </Button>
                  <p className="text-xs text-ink/40">JPG/PNG, max 2MB</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white border-2 border-admin-border rounded-2xl p-6">
              <h2 className="font-black text-sm uppercase tracking-widest text-ink/50 mb-4">Kontak & Integrasi</h2>
              <div className="space-y-4">
                <Input
                  label="Nomor WhatsApp Admin"
                  placeholder="628123456789"
                  value={settings?.whatsapp_number || ''}
                  onChange={(e) => set('whatsapp_number')(e.target.value)}
                  hint="Format: 628xxx... tanpa + atau spasi"
                />
                <Input
                  label="Telegram Chat ID"
                  placeholder="-100123456789"
                  value={settings?.telegram_chat_id || ''}
                  onChange={(e) => set('telegram_chat_id')(e.target.value)}
                  hint="Chat ID group/channel (bisa negatif untuk group)"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} loading={saving} size="lg">
                <Save size={18} />
                Simpan Semua Perubahan
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
