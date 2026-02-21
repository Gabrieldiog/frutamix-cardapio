import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        // Clean up orders older than 4 days
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

        // Delete old order_items first (foreign key)
        const { data: oldOrders } = await supabaseAdmin
            .from('orders')
            .select('id')
            .lt('created_at', fourDaysAgo);

        if (oldOrders && oldOrders.length > 0) {
            const oldIds = oldOrders.map(o => o.id);
            await supabaseAdmin.from('order_items').delete().in('order_id', oldIds);
            await supabaseAdmin.from('orders').delete().in('id', oldIds);
        }

        // Fetch remaining orders
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ orders: data });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
