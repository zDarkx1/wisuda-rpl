-- ============================================================================
-- SKEMA DATABASE: BUKU TAMU DIGITAL WISUDA
-- Aplikasi ini dirancang untuk mencatat kehadiran tamu wisuda jurusan RPL.
-- 
-- FITUR:
-- 1. Daftar tamu terdaftar (dari kelas 10, 11, 12)
-- 2. Check-in dengan nama dan foto webcam
-- 3. Dashboard Admin (melihat statistik & list tamu)
-- 4. Input data tamu oleh Admin
-- ============================================================================

-- Tabel utama untuk menyimpan daftar tamu dan status kehadiran mereka
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                          -- Nama lengkap tamu
  class_group TEXT NOT NULL DEFAULT 'Umum',    -- Kelompok kelas (contoh: '12 RPL 1', '10 RPL', 'Undangan')
  has_attended BOOLEAN DEFAULT false NOT NULL, -- Status kehadiran
  attended_at TIMESTAMP WITH TIME ZONE,        -- Timestamp check-in
  photo_url TEXT,                              -- Foto (URL Storage atau Base64 data)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk mempercepat pencarian query di dropdown nama
CREATE INDEX IF NOT EXISTS idx_guests_not_attended ON guests(name) WHERE has_attended = false;
CREATE INDEX IF NOT EXISTS idx_guests_class ON guests(class_group);

-- Update kolom updated_at secara otomatis pada setiap perubahan data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mengatur izin akses ke data
-- ============================================================================

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Izinkan semua orang bisa melihat daftar tamu
CREATE POLICY "Allow public read access" ON guests
  FOR SELECT USING (true);

-- Izinkan tamu untuk melakukan check-in/update
CREATE POLICY "Allow public check-in" ON guests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow guest update on check-in" ON guests
  FOR UPDATE USING (true) WITH CHECK (true);

-- Izinkan admin/tamu untuk menghapus data jika terjadi kesalahan input
CREATE POLICY "Allow delete access" ON guests
  FOR DELETE USING (true);


-- ============================================================================
-- DATA SEEDING (DATA CONTOH)
-- Data ini bisa ditambahkan/diedit lewat Dashboard Admin nanti
-- ============================================================================

-- Masukkan beberapa nama contoh
INSERT INTO guests (name, class_group, has_attended) VALUES
  ('Aditya Pratama', '12 RPL 1', false),
  ('Bella Sari', '12 RPL 1', true),
  ('Candra Wijaya', '11 RPL 2', false),
  ('Dina Kirana', '10 RPL 1', false),
  ('Eko Prasetyo', 'VIP / Undangan', false),
  ('Fani Amalia', '12 RPL 2', false),
  ('Gilang Ramadhan', '11 RPL 1', false),
  ('Hana Pertiwi', '10 RPL 2', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KETENTUAN PENGGUNAAN DATABASE INI
-- 1. Jalankan script ini di Supabase SQL Editor agar tabel siap digunakan
-- 2. Kolom `has_attended` akan berubah menjadi TRUE setelah tamu melakukan check-in
-- 3. Kolom `photo_url` dapat berisi URL gambar dari Supabase Storage atau string Base64 langsung
-- ============================================================================
