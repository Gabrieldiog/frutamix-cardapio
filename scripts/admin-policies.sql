-- ==========================================
-- Admin RLS Policies for FrutaMix
-- Run this in Supabase SQL Editor
-- ==========================================

-- Produtos: CRUD para usuários autenticados
CREATE POLICY "auth_insert_products" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_products" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_products" ON products
  FOR DELETE TO authenticated USING (true);

-- Categorias: CRUD para usuários autenticados
CREATE POLICY "auth_insert_categories" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_categories" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_categories" ON categories
  FOR DELETE TO authenticated USING (true);

-- ==========================================
-- Storage bucket para imagens de produtos
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Upload: apenas autenticados
CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Update: apenas autenticados
CREATE POLICY "auth_update_storage" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

-- Delete: apenas autenticados
CREATE POLICY "auth_delete_storage" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Leitura pública (para as imagens aparecerem no cardápio)
CREATE POLICY "public_read_storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
