'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckIcon, PartyIcon, ArrowLeftIcon } from '@/components/Icons';

function OrderConfirmedContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

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
            <Link href="/" className="btn-primary" style={{ maxWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
