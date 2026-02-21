import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, categories(name)')
            .eq('id', id)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ product: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const body = await request.json();
        const { name, description, price, category_id, image_url, available, old_image_path } = body;

        if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        if (!price || price <= 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
        if (!category_id) return NextResponse.json({ error: 'Categoria é obrigatória' }, { status: 400 });
        if (!image_url) return NextResponse.json({ error: 'Foto é obrigatória' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('products')
            .update({
                name: name.trim(),
                description: description?.trim() || null,
                price,
                category_id,
                image_url,
                available,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Delete old image from storage if replaced
        if (old_image_path) {
            await supabaseAdmin.storage.from('product-images').remove([old_image_path]);
        }

        return NextResponse.json({ product: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        // Get product to find image path
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('image_url')
            .eq('id', id)
            .single();

        // Delete related order_items first (foreign key)
        await supabaseAdmin
            .from('order_items')
            .delete()
            .eq('product_id', id);

        // Delete product
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Delete image from storage
        if (product?.image_url) {
            const path = extractStoragePath(product.image_url);
            if (path) {
                await supabaseAdmin.storage.from('product-images').remove([path]);
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

function extractStoragePath(url: string): string | null {
    const marker = '/storage/v1/object/public/product-images/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
}
