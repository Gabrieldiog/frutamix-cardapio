import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { customer_name, customer_address, payment_method, change_for, items, total } = body;

        // Validation
        if (!customer_name || !customer_address || !payment_method || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Dados incompletos. Preencha todos os campos obrigatórios.' },
                { status: 400 }
            );
        }

        const validMethods = ['pix', 'cartao', 'dinheiro'];
        if (!validMethods.includes(payment_method)) {
            return NextResponse.json(
                { error: 'Método de pagamento inválido.' },
                { status: 400 }
            );
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_name,
                customer_address,
                payment_method,
                change_for: payment_method === 'dinheiro' ? change_for : null,
                total,
                status: 'pending',
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order error:', orderError);
            return NextResponse.json({ error: 'Erro ao criar pedido.' }, { status: 500 });
        }

        // Create order items
        const orderItems = items.map((item: {
            product_id: string;
            product_name: string;
            quantity: number;
            unit_price: number;
            subtotal: number;
        }) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Items error:', itemsError);
            // Rollback: delete created order
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ error: 'Erro ao salvar itens do pedido.' }, { status: 500 });
        }

        return NextResponse.json({ order }, { status: 201 });
    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
