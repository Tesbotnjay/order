-- =============================================
-- PIXEL MEMORIES — SUPABASE SQL SCHEMA
-- Jalankan semua SQL ini di Supabase SQL Editor
-- =============================================

-- 1. Profiles (extend Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT CHECK (char_length(full_name) BETWEEN 2 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    regexp_replace(
      coalesce(NEW.raw_user_meta_data->>'full_name', ''),
      '<[^>]*>', '', 'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Admin login attempts (brute force protection)
CREATE TABLE public.admin_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_admin_attempts_ip_time
  ON public.admin_login_attempts(ip_address, attempted_at);

CREATE OR REPLACE FUNCTION cleanup_old_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.admin_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL
    CHECK (order_id ~ '^ORD-[A-Z0-9]{8}$'),
  buyer_id UUID REFERENCES auth.users,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  nominal INT NOT NULL
    CHECK (nominal > 0 AND nominal <= 10000000),
  form_data JSONB NOT NULL,
  asset_urls JSONB,
  slug TEXT UNIQUE
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]{8,58}[a-z0-9]$'),
  reject_reason TEXT CHECK (char_length(reject_reason) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_slug ON public.orders(slug) WHERE slug IS NOT NULL;

-- 4. Settings (always 1 row)
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1
    CHECK (id = 1),
  basic_price INT DEFAULT 15000
    CHECK (basic_price BETWEEN 1000 AND 10000000),
  premium_price INT DEFAULT 20000
    CHECK (premium_price BETWEEN 1000 AND 10000000),
  basic_label TEXT DEFAULT 'Paket Basic'
    CHECK (char_length(basic_label) <= 50),
  premium_label TEXT DEFAULT 'Paket Premium'
    CHECK (char_length(premium_label) <= 50),
  basic_description TEXT DEFAULT ''
    CHECK (char_length(basic_description) <= 300),
  premium_description TEXT DEFAULT ''
    CHECK (char_length(premium_description) <= 300),
  store_open BOOLEAN DEFAULT TRUE,
  qris_image_url TEXT
    CHECK (qris_image_url IS NULL OR qris_image_url ~ '^https://'),
  whatsapp_number TEXT
    CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^[0-9]{8,15}$'),
  telegram_chat_id TEXT
    CHECK (telegram_chat_id IS NULL OR telegram_chat_id ~ '^-?[0-9]+$'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.settings (id) VALUES (1);

-- 5. Bot pending reject state
CREATE TABLE public.bot_pending_reject (
  order_id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- 6. RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_pending_reject ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Buyer lihat profil sendiri"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Buyer update profil sendiri"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Orders policies
CREATE POLICY "Buyer lihat order sendiri"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyer insert order sendiri"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND nominal > 0
    AND nominal <= 10000000
  );

-- Public can read approved orders by slug (for /w/:slug)
CREATE POLICY "Public baca order approved by slug"
  ON public.orders FOR SELECT
  USING (status = 'approved' AND slug IS NOT NULL);

-- Settings: everyone can read safe columns
CREATE POLICY "Semua bisa baca settings"
  ON public.settings FOR SELECT
  USING (true);

-- 7. Audit trigger: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- STORAGE SETUP
-- Buat di Supabase Dashboard → Storage
-- =============================================

-- Jalankan setelah membuat bucket "assets" (Public: ON, Max 10MB)
CREATE POLICY "Buyer upload ke folder sendiri"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public baca assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- Jalankan setelah membuat bucket "qris" (Public: ON, Max 2MB)
CREATE POLICY "Public baca qris"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qris');


-- =============================================
-- MEMBERSHIP SYSTEM — Tambahkan ke schema yang sudah ada
-- =============================================

-- 8. Memberships (subscription bulanan)
CREATE TABLE public.memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium')),
  -- basic: 15k → website only
  -- premium: 20k → website + photobooth
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  nominal INT NOT NULL CHECK (nominal > 0),
  reject_reason TEXT CHECK (char_length(reject_reason) <= 300),
  approved_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- starts_at + 1 month
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_expires_at ON public.memberships(expires_at);

-- Trigger updated_at
CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- User bisa lihat membership sendiri
CREATE POLICY "User lihat membership sendiri"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- User bisa insert membership baru
CREATE POLICY "User insert membership sendiri"
  ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public bisa cek apakah suatu user punya membership aktif (untuk cek expiry website)
-- Hanya expose status + expires_at + user_id, tidak boleh lihat nominal dsb
-- Dilakukan via separate RPC function agar aman

-- Function: cek apakah user_id tertentu punya membership aktif dan plan-nya apa
CREATE OR REPLACE FUNCTION public.get_user_membership_status(p_user_id UUID)
RETURNS TABLE(plan TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT m.plan, m.expires_at
    FROM public.memberships m
    WHERE m.user_id = p_user_id
      AND m.status = 'active'
      AND m.expires_at > NOW()
    ORDER BY m.expires_at DESC
    LIMIT 1;
END;
$$;

-- 9. Update orders: tambah kolom plan (dari membership)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('basic', 'premium'));

-- =============================================
-- SETTINGS UPDATE: update label untuk membership
-- =============================================
-- Jalankan ini untuk update deskripsi default:
UPDATE public.settings SET
  basic_label = 'Basic',
  premium_label = 'Premium',
  basic_description = 'Akses buat website kenangan custom selama 1 bulan.',
  premium_description = 'Akses website + Photobooth online selama 1 bulan.'
WHERE id = 1;
