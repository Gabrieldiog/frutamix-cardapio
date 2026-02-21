import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, categories(name)')
            .order('name', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ products: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const body = await request.json();
        const { name, description, price, category_id, image_url, available } = body;

        if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        if (!price || price <= 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
        if (!category_id) return NextResponse.json({ error: 'Categoria é obrigatória' }, { status: 400 });
        if (!image_url) return NextResponse.json({ error: 'Foto é obrigatória' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                price,
                category_id,
                image_url,
                available: available !== false,
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ product: data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
