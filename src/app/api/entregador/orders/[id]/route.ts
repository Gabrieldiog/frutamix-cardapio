import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OrderStatus } from '@/types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, driver_id } = body;

        const validStatuses: OrderStatus[] = ['delivering', 'delivered'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Status inválido para entregador' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        if (status === 'delivered' && driver_id) {
            await supabaseAdmin.rpc('increment_deliveries', { driver_uuid: driver_id }).single();
        }

        return NextResponse.json({ order: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
