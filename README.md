# Pixel Memories 🎮💕

Website kenangan romantis bergaya pixel art. Beli, isi data, bayar — dapat link + QR code untuk dibagikan.

**Total biaya: Rp 0/bulan** (semua free tier)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + Vite + TailwindCSS v4 + Framer Motion |
| Auth + DB + Storage | Supabase FREE TIER |
| Bot notifikasi | Telegram Bot via Vercel Serverless |
| Deploy | Vercel FREE TIER |

---

## Setup Step-by-Step

### 1. Supabase

1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat: **Project URL**, **Anon Key**, **Service Role Key**
3. Buka **SQL Editor** → paste & jalankan isi `supabase-schema.sql`
4. Buka **Storage** → buat 2 bucket:
   - `assets` → Public: ON, Max file size: 10MB
   - `qris` → Public: ON, Max file size: 2MB
5. Di bucket `assets` → Policies → tambahkan policy dari SQL schema

### 2. Telegram Bot

```bash
# 1. Buka Telegram → cari @BotFather → /newbot
# 2. Ikuti instruksi → catat Bot Token

# 3. Dapatkan Chat ID kamu
curl "https://api.telegram.org/bot{TOKEN}/getUpdates"

# 4. Generate WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install & Jalankan Lokal

```bash
# Clone & install
cd client
npm install

# Copy env
cp ../.env.example .env.local
# Isi semua variable di .env.local

# Dev server
npm run dev
```

### 4. Deploy ke Vercel

```bash
# Push ke GitHub, lalu:
# 1. Buka vercel.com → Import repository
# 2. Set Environment Variables (SEMUA dari .env.example)
#    ⚠️ Pastikan SERVER ONLY vars tidak diset sebagai "Exposed to Browser"
# 3. Deploy
```

### 5. Setup Telegram Webhook

Setelah deploy, jalankan:

```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.vercel.app/api/bot",
    "secret_token": "TELEGRAM_WEBHOOK_SECRET_KAMU",
    "allowed_updates": ["callback_query", "message"]
  }'

# Verifikasi
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
```

---

## Environment Variables

Lihat `.env.example` untuk list lengkap.

**CLIENT (VITE_ prefix — aman di browser):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

**SERVER ONLY (tanpa VITE_ — jangan expose ke browser):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ADMIN_CHAT_ID`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`

---

## Flow Pengguna

```
Landing Page
  ↓ klik "Buat Sekarang"
/auth (login/register)
  ↓
/create (form multi-step)
  → Step 1: Nama pengirim + penerima + tanggal
  → Step 2: Pesan + cerita highlight
  → Step 3: Upload foto (max 11) + musik (opsional)
  → Step 4: Pilih paket + scan QRIS + konfirmasi bayar
  ↓
/status/:orderId (polling realtime)
  ↓ admin approve via Telegram / panel
Dapat link /w/:slug + QR Code
  ↓
/my-orders (riwayat semua pesanan)
```

---

## Admin Panel

URL: `/admin/login`

Fitur:
- **Dashboard** — statistik realtime, grafik order & pendapatan
- **Transaksi** — tabel order dengan search/filter, approve/reject/hapus
- **Analitik** — bar chart, area chart, heatmap jam sibuk
- **Pengaturan** — harga paket, QRIS, status toko, kontak

---

## Security Checklist

Sebelum launch, verifikasi:

- [ ] `npm audit` — tidak ada vulnerability high/critical
- [ ] Test RLS: login buyer A, akses order buyer B → harus blocked
- [ ] Upload file .exe → harus ditolak
- [ ] Input `<script>alert(1)</script>` di form → tidak boleh jalan di website
- [ ] `/auth?redirect=https://evil.com` → harus blocked (hanya path internal)
- [ ] Salah password admin 5x → locked 15 menit
- [ ] Service Role Key tidak muncul di DevTools → Network tab

---

## Struktur Folder

```
project/
├── client/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Button, Modal, Toast, Input, Navbar, ProtectedRoute
│   │   │   ├── admin/       # Sidebar, StatCard, OrderTable
│   │   │   └── template/   # MelodyPixel, PixelParticles
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Auth.tsx
│   │   │   ├── Create.tsx
│   │   │   ├── Status.tsx
│   │   │   ├── MyOrders.tsx
│   │   │   ├── Website.tsx  # /w/:slug — render template
│   │   │   └── admin/
│   │   │       ├── Login.tsx
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Orders.tsx
│   │   │       ├── OrderDetail.tsx
│   │   │       ├── Analytics.tsx
│   │   │       └── Settings.tsx
│   │   ├── store/           # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # supabase, security, helpers, schemas
│   └── package.json
├── api/                     # Vercel Serverless Functions
│   ├── bot.js               # Telegram webhook
│   ├── notify.js            # Order notification
│   ├── supabaseAdmin.js     # Admin Supabase client
│   ├── _utils.js            # Shared utilities
│   └── admin/
│       ├── login.js
│       ├── stats.js
│       ├── analytics.js
│       ├── orders.js
│       ├── settings.js
│       └── upload-qris.js
├── supabase-schema.sql
├── .env.example
├── vercel.json
└── README.md
```

---

## Lisensi

MIT — Free to use.
