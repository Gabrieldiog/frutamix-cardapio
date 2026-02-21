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
            .from('addon_groups')
            .select('*, addon_items(*)')
            .eq('id', id)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ group: data });
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
        const { name, items } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        // Update group name
        const { data: group, error: groupError } = await supabaseAdmin
            .from('addon_groups')
            .update({ name: name.trim() })
            .eq('id', id)
            .select()
            .single();

        if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

        // Replace items: delete all, then insert new ones
        if (items !== undefined) {
            await supabaseAdmin.from('addon_items').delete().eq('group_id', id);
            if (items && items.length > 0) {
                const itemRows = items
                    .filter((item: { name: string }) => item.name.trim())
                    .map((item: { name: string; price: number }) => ({
                        group_id: id,
                        name: item.name.trim(),
                        price: item.price || 0,
                    }));

                if (itemRows.length > 0) {
                    await supabaseAdmin.from('addon_items').insert(itemRows);
                }
            }
        }

        return NextResponse.json({ group });
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

        // CASCADE removes product_addon_groups links automatically
        const { error } = await supabaseAdmin
            .from('addon_groups')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
