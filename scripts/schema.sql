-- FrutaMix Digital Menu Schema
-- Run this SQL in your Supabase SQL Editor

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  change_for DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories and products
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);

-- Allow public insert on orders and order_items (customers creating orders)
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);

-- Seed Data: Categories
INSERT INTO categories (name, display_order) VALUES
  ('Açaí', 1),
  ('Salada de Frutas', 2),
  ('Cremes', 3),
  ('Bebidas', 4),
  ('Complementos', 5);

-- Seed Data: Products
INSERT INTO products (category_id, name, description, price) VALUES
  -- Açaí
  ((SELECT id FROM categories WHERE name = 'Açaí'), 'Açaí 300ml', 'Açaí puro batido na hora', 12.00),
  ((SELECT id FROM categories WHERE name = 'Açaí'), 'Açaí 500ml', 'Açaí puro batido na hora', 18.00),
  ((SELECT id FROM categories WHERE name = 'Açaí'), 'Açaí 700ml', 'Açaí puro batido na hora com banana', 24.00),
  ((SELECT id FROM categories WHERE name = 'Açaí'), 'Açaí 1L', 'Açaí puro batido na hora com frutas', 32.00),
  -- Salada de Frutas
  ((SELECT id FROM categories WHERE name = 'Salada de Frutas'), 'Salada de Frutas P', 'Mix de frutas frescas da estação', 10.00),
  ((SELECT id FROM categories WHERE name = 'Salada de Frutas'), 'Salada de Frutas M', 'Mix de frutas frescas com creme', 15.00),
  ((SELECT id FROM categories WHERE name = 'Salada de Frutas'), 'Salada de Frutas G', 'Mix generoso de frutas com creme e granola', 20.00),
  -- Cremes
  ((SELECT id FROM categories WHERE name = 'Cremes'), 'Creme de Cupuaçu', 'Creme artesanal de cupuaçu', 14.00),
  ((SELECT id FROM categories WHERE name = 'Cremes'), 'Creme de Tapioca', 'Creme de tapioca com leite condensado', 12.00),
  -- Bebidas
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Suco Natural 300ml', 'Suco de fruta natural da estação', 8.00),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Suco Natural 500ml', 'Suco de fruta natural da estação', 12.00),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Água Mineral', 'Água mineral sem gás 500ml', 3.50),
  -- Complementos
  ((SELECT id FROM categories WHERE name = 'Complementos'), 'Granola', 'Porção extra de granola', 3.00),
  ((SELECT id FROM categories WHERE name = 'Complementos'), 'Leite Condensado', 'Porção extra de leite condensado', 2.50),
  ((SELECT id FROM categories WHERE name = 'Complementos'), 'Leite em Pó', 'Porção extra de leite em pó', 2.00),
  ((SELECT id FROM categories WHERE name = 'Complementos'), 'Paçoca', 'Porção extra de paçoca triturada', 3.00);
