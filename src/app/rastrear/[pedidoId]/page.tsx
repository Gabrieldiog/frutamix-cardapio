'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { OrderWithItems, OrderStatus } from '@/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/map/DeliveryMap'), { ssr: false });

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'pending', label: 'Recebido', icon: '📋' },
    { key: 'confirmed', label: 'Confirmado', icon: '✅' },
    { key: 'preparing', label: 'Preparando', icon: '👨‍🍳' },
    { key: 'delivering', label: 'Em Entrega', icon: '🛵' },
    { key: 'delivered', label: 'Entregue', icon: '🎉' },
];

export default function RastrearPage() {
    const params = useParams();
    const pedidoId = params.pedidoId as string;
    const { tracking, loading: trackingLoading } = useDeliveryTracking(pedidoId);
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pedidoId) return;
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${pedidoId}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data.order);
                }
            } catch { /* ignore */ }
            setLoading(false);
        }
        fetchOrder();
        const interval = setInterval(fetchOrder, 15000);
        return () => clearInterval(interval);
    }, [pedidoId]);

    const getStepIndex = (status: string) => {
        const idx = STATUS_STEPS.findIndex(s => s.key === status);
        return idx === -1 ? 0 : idx;
    };

    if (loading || trackingLoading) {
        return (
            <div className="tracking-page-full">
                <div className="tracking-loading-full">
                    <div className="loading-spinner" />
                    <span>Carregando rastreamento...</span>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="tracking-page-full">
                <div className="tracking-not-found">
                    <h2>Pedido não encontrado</h2>
                    <p>Este pedido pode não existir ou já foi removido.</p>
                    <Link href="/" className="btn-primary">Voltar ao cardápio</Link>
                </div>
            </div>
        );
    }

    const currentStep = getStepIndex(order.status);
    const isDelivering = order.status === 'delivering';
    const isDelivered = order.status === 'delivered';

    const defaultCenter: [number, number] = tracking
        ? [tracking.location.lat, tracking.location.lng]
        : [-15.7801, -47.9292];

    const markers = tracking ? [{
        id: 'driver',
        position: [tracking.location.lat, tracking.location.lng] as [number, number],
        label: tracking.driver_name,
    }] : [];

    return (
        <div className="tracking-page-full">
            {isDelivering && tracking ? (
                <div className="tracking-map-container">
                    <DeliveryMap
                        center={defaultCenter}
                        zoom={16}
                        className="tracking-map-full"
                        markers={markers}
                    />
                </div>
            ) : (
                <div className="tracking-map-placeholder">
                    {isDelivered ? (
                        <div className="tracking-delivered-big">
                            <span className="tracking-delivered-icon">🎉</span>
                            <span>Pedido entregue!</span>
                        </div>
                    ) : (
                        <div className="tracking-waiting">
                            <div className="tracking-waiting-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <p>Aguardando entregador sair para entrega...</p>
                            <p className="tracking-waiting-sub">O mapa aparecerá quando a entrega iniciar</p>
                        </div>
                    )}
                </div>
            )}

            <div className="tracking-info-panel">
                <div className="tracking-info-header">
                    <div>
                        <h2 className="tracking-info-title">
                            Pedido #{pedidoId.slice(0, 8).toUpperCase()}
                        </h2>
                        {tracking && isDelivering && (
                            <div className="tracking-driver-name">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {tracking.driver_name}
                            </div>
                        )}
                    </div>
                    <Link href="/pedido" className="tracking-back-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </Link>
                </div>

                <div className="tracking-progress-bar">
                    {STATUS_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                            <div key={step.key} className="tracking-pb-step-wrapper">
                                <div className={`tracking-pb-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="tracking-pb-dot">
                                        {isDone ? (
                                            <span className="tracking-pb-emoji">{step.icon}</span>
                                        ) : (
                                            <span className="tracking-pb-number">{idx + 1}</span>
                                        )}
                                    </div>
                                    {idx < STATUS_STEPS.length - 1 && (
                                        <div className={`tracking-pb-line ${idx < currentStep ? 'done' : ''}`} />
                                    )}
                                </div>
                                <span className={`tracking-pb-label ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="tracking-order-items-mini">
                    {order.order_items.map(item => (
                        <div key={item.id} className="tracking-mini-item">
                            <span className="tracking-mini-qty">{item.quantity}x</span>
                            <span className="tracking-mini-name">{item.product_name}</span>
                        </div>
                    ))}
                    <div className="tracking-mini-total">
                        Total: {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>
            </div>
        </div>
    );
}
