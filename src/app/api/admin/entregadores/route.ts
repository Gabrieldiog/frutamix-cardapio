import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

function generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('delivery_drivers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ drivers: data });
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
        const { name, phone } = body;

        if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        if (!phone?.trim()) return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });

        let access_code = generateAccessCode();
        let attempts = 0;
        while (attempts < 10) {
            const { data: existing } = await supabaseAdmin
                .from('delivery_drivers')
                .select('id')
                .eq('access_code', access_code)
                .single();
            if (!existing) break;
            access_code = generateAccessCode();
            attempts++;
        }

        const { data, error } = await supabaseAdmin
            .from('delivery_drivers')
            .insert({ name: name.trim(), phone: phone.trim(), access_code })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ driver: data }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
