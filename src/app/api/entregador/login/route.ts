import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { access_code } = body;

        if (!access_code?.trim()) {
            return NextResponse.json({ error: 'Código de acesso é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('delivery_drivers')
            .select('*')
            .eq('access_code', access_code.trim())
            .eq('active', true)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Código de acesso inválido' }, { status: 401 });
        }

        return NextResponse.json({ driver: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
