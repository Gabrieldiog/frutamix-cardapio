import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Inicialização lazy: NÃO chamar setVapidDetails no topo do módulo.
// Se as env vars não existirem no momento do build, o web-push lança
// "No key set vapidDetails.publicKey" e derruba o `next build` inteiro
// ao coletar dados de /api/orders. Fazendo isso sob demanda, o build
// nunca quebra por falta das chaves (mesmo padrão do lazy init do Supabase).
let vapidConfigured = false;

function ensureVapid() {
    if (vapidConfigured) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
        throw new Error(
            'VAPID keys ausentes: defina NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nas variáveis de ambiente.'
        );
    }
    webpush.setVapidDetails('mailto:admin@frutamix.vercel.app', publicKey, privateKey);
    vapidConfigured = true;
}

export async function notifyAdmins(title: string, body: string) {
    try {
        ensureVapid();
        console.log('[PUSH] Sending notification:', title, body);

        const { data: subscriptions, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*');

        if (error) {
            console.error('[PUSH] DB error:', error);
            return;
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('[PUSH] No subscriptions found');
            return;
        }

        console.log(`[PUSH] Found ${subscriptions.length} subscription(s)`);

        const payload = JSON.stringify({
            title,
            body,
            url: '/admin/orders',
        });

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        payload
                    );
                    console.log('[PUSH] Sent successfully to:', sub.endpoint.slice(0, 50));
                } catch (err: unknown) {
                    console.error('[PUSH] Send error:', err);
                    const statusCode = (err as { statusCode?: number })?.statusCode;
                    if (statusCode === 404 || statusCode === 410) {
                        await supabaseAdmin
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint);
                    }
                }
            })
        );
    } catch (err) {
        console.error('Push notification error:', err);
    }
}
