// Migração: sistema de adicionais com categorias (grupos)
// Rode o SQL abaixo no Supabase SQL Editor

console.log(`
=== COLE ESTE SQL NO SUPABASE SQL EDITOR ===

-- Categorias de adicionais (ex: Cremes, Acompanhamentos)
CREATE TABLE IF NOT EXISTS addon_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens dentro de cada categoria (ex: Ninho R$2, Granola R$3)
CREATE TABLE IF NOT EXISTS addon_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Liga produto a categoria de adicional (com limite gratis por grupo)
CREATE TABLE IF NOT EXISTS product_addon_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
    free_addon_limit INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, group_id)
);

-- Coluna de adicionais nos itens de pedido (snapshot JSONB)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]';

=== FIM DO SQL ===
`);
