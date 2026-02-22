'use client';

import { useEffect, useState, useCallback } from 'react';
import { OrderWithItems, OrderStatus } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: 'Pendente' },
    { key: 'confirmed', label: 'Confirmado' },
    { key: 'preparing', label: 'Preparando' },
    { key: 'delivering', label: 'Saiu para entrega' },
    { key: 'delivered', label: 'Entregue' },
];

const ORDERS_KEY = 'frutamix-orders';
const MAX_AGE_DAYS = 4;

interface StoredOrder {
    id: string;
    created_at: string;
}

export default function PedidoPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const raw = localStorage.getItem(ORDERS_KEY);
            if (!raw) { setLoading(false); return; }

            let stored: StoredOrder[] = JSON.parse(raw);

            // Remove pedidos antigos (>4 dias)
            const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
            stored = stored.filter(o => new Date(o.created_at).getTime() > cutoff);
            localStorage.setItem(ORDERS_KEY, JSON.stringify(stored));

            if (stored.length === 0) { setLoading(false); return; }

            const results = await Promise.all(
                stored.map(async (o) => {
                    try {
                        const res = await fetch(`/api/orders/${o.id}`);
                        if (!res.ok) return null;
                        const data = await res.json();
                        return data.order as OrderWithItems;
                    } catch {
                        return null;
                    }
                })
            );

            const validOrders = results.filter((o): o is OrderWithItems => o !== null);
            // Mais recentes primeiro
            validOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(validOrders);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const formatPrice = (price: number) =>
        price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${day} às ${time}`;
    };

    const getStepIndex = (status: OrderStatus) => {
        const idx = STATUS_STEPS.findIndex(s => s.key === status);
        return idx === -1 ? 0 : idx;
    };

    if (loading) {
        return (
            <div className="tracking-page">
                <div className="tracking-header">
                    <Link href="/" className="tracking-back"><ArrowLeftIcon size={20} /></Link>
                    <h1 className="tracking-title">Meus Pedidos</h1>
                </div>
                <div className="tracking-loading">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="tracking-page">
            <div className="tracking-header">
                <Link href="/" className="tracking-back"><ArrowLeftIcon size={20} /></Link>
                <h1 className="tracking-title">Meus Pedidos</h1>
            </div>

            {orders.length === 0 ? (
                <div className="tracking-empty">
                    <p>Nenhum pedido encontrado neste dispositivo.</p>
                    <Link href="/" className="btn-primary" style={{ maxWidth: 280, margin: '16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <ArrowLeftIcon size={18} /> Ir para o cardápio
                    </Link>
                </div>
            ) : (
                <div className="tracking-list">
                    {orders.map(order => {
                        const status = order.status as OrderStatus;
                        const isCancelled = status === 'cancelled';
                        const isDelivered = status === 'delivered';
                        const currentStep = getStepIndex(status);

                        return (
                            <div key={order.id} className="tracking-card">
                                <div className="tracking-card-header">
                                    <div>
                                        <div className="tracking-order-id">
                                            Pedido #{order.id.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div className="tracking-order-time">
                                            {formatDateTime(order.created_at)}
                                        </div>
                                    </div>
                                    <div className="tracking-order-total">
                                        {formatPrice(order.total)}
                                    </div>
                                </div>

                                {isCancelled ? (
                                    <div className="tracking-cancelled">
                                        Pedido cancelado
                                    </div>
                                ) : (
                                    <div className="tracking-progress">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const isDone = idx <= currentStep;
                                            const isCurrent = idx === currentStep;
                                            return (
                                                <div key={step.key} className="tracking-step-wrapper">
                                                    <div className={`tracking-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                                        <div className="tracking-step-dot">
                                                            {isDone && (
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {idx < STATUS_STEPS.length - 1 && (
                                                            <div className={`tracking-step-line ${idx < currentStep ? 'done' : ''}`} />
                                                        )}
                                                    </div>
                                                    <span className={`tracking-step-label ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="tracking-items">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="tracking-item">
                                            <span className="tracking-item-qty">{item.quantity}x</span>
                                            <span className="tracking-item-name">{item.product_name}</span>
                                            {item.addons && item.addons.length > 0 && (
                                                <span className="tracking-item-addons">
                                                    ({item.addons.map(a => a.name).join(', ')})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {isDelivered && (
                                    <div className="tracking-delivered">
                                        Pedido entregue!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
