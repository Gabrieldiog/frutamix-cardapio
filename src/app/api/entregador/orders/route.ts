import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .in('status', ['ready', 'preparing', 'delivering'])
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ orders: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
