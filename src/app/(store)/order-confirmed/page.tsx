'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { CheckIcon, PartyIcon, ArrowLeftIcon } from '@/components/Icons';

function OrderConfirmedContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('frutamix-whatsapp');
            if (raw) {
                const parsed = JSON.parse(raw) as { url: string; ts: number };
                // Só usa se tiver menos de 5 minutos (evita mostrar pedido antigo)
                if (parsed.url && Date.now() - parsed.ts < 5 * 60 * 1000) {
                    setWhatsappUrl(parsed.url);
                }
                localStorage.removeItem('frutamix-whatsapp');
            }
        } catch { /* ignore */ }
    }, []);

    return (
        <div className="confirmed-page">
            <div className="confirmed-icon"><CheckIcon size={48} color="var(--success)" /></div>
            <h1 className="confirmed-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Pedido Enviado! <PartyIcon size={28} color="var(--primary)" />
            </h1>
            <p className="confirmed-subtitle">
                Seu pedido foi recebido com sucesso!<br />
                Estamos preparando tudo com carinho para você.
            </p>
            {orderId && (
                <div className="confirmed-order-id">
                    <span>Pedido #{orderId.slice(0, 8).toUpperCase()}</span>
                </div>
            )}

            {whatsappUrl && (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                        maxWidth: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#25D366',
                        textDecoration: 'none',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.571a.75.75 0 0 0 .937.899l5.896-1.938A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.703 9.703 0 0 1-4.91-1.327l-.351-.208-3.641 1.197 1.154-3.546-.228-.364A9.72 9.72 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                    </svg>
                    Enviar pedido pelo WhatsApp
                </a>
            )}

            <Link href="/pedido" className="btn-primary" style={{ maxWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...(whatsappUrl ? { marginTop: 12 } : {}) }}>
                Acompanhar pedido
            </Link>
            <Link href="/" className="btn-secondary" style={{ maxWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                <ArrowLeftIcon size={18} /> Voltar ao cardápio
            </Link>
        </div>
    );
}

export default function OrderConfirmedPage() {
    return (
        <Suspense fallback={
            <div className="confirmed-page">
                <div className="loading-spinner" />
            </div>
        }>
            <OrderConfirmedContent />
        </Suspense>
    );
}
