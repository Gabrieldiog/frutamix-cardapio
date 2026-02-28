import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert(
                {
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
                { onConflict: 'endpoint' }
            );

        if (error) {
            console.error('Push subscribe error:', error);
            return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
