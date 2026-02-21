import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('addon_groups')
            .select('*, addon_items(*)')
            .order('name', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ groups: data });
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
        const { name, items } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        // Create the group
        const { data: group, error: groupError } = await supabaseAdmin
            .from('addon_groups')
            .insert({ name: name.trim() })
            .select()
            .single();

        if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

        // Insert items if provided
        if (items && items.length > 0) {
            const itemRows = items
                .filter((item: { name: string }) => item.name.trim())
                .map((item: { name: string; price: number }) => ({
                    group_id: group.id,
                    name: item.name.trim(),
                    price: item.price || 0,
                }));

            if (itemRows.length > 0) {
                await supabaseAdmin.from('addon_items').insert(itemRows);
            }
        }

        return NextResponse.json({ group }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
