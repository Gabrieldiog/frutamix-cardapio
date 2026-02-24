'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { OrderWithItems, OrderStatus } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ref, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/map/DeliveryMap'), { ssr: false });

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: 'Pendente' },
    { key: 'confirmed', label: 'Confirmado' },
    { key: 'preparing', label: 'Preparando' },
    { key: 'ready', label: 'Aguardando Entregador' },
    { key: 'delivering', label: 'Saiu para entrega' },
    { key: 'delivered', label: 'Entregue' },
];

const ORDERS_KEY = 'frutamix-orders';
const MAX_AGE_DAYS = 4;

interface StoredOrder {
    id: string;
    created_at: string;
}

function InlineTrackingMap({ orderId, clientPos }: { orderId: string; clientPos: [number, number] | null }) {
    const { tracking } = useDeliveryTracking(orderId);

    if (!tracking) {
        return (
            <div className="inline-map-waiting">
                <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                <span>Aguardando localização do entregador...</span>
            </div>
        );
    }

    const driverPos: [number, number] = [tracking.location.lat, tracking.location.lng];
    const center = clientPos
        ? [(driverPos[0] + clientPos[0]) / 2, (driverPos[1] + clientPos[1]) / 2] as [number, number]
        : driverPos;

    const markers = [
        { id: 'driver', position: driverPos, label: tracking.driver_name, type: 'driver' as const },
        ...(clientPos ? [{ id: 'client', position: clientPos, label: 'Você', type: 'client' as const }] : []),
    ];

    return (
        <div className="inline-map-container">
            <DeliveryMap
                center={center}
                zoom={15}
                className="inline-map"
                markers={markers}
                fitBounds={markers.length >= 2}
            />
            <div className="inline-map-driver-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{tracking.driver_name}</span>
                <span className="inline-map-live-dot" />
                <span className="inline-map-live-text">AO VIVO</span>
            </div>
        </div>
    );
}

export default function PedidoPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedMap, setExpandedMap] = useState<string | null>(null);

    // IDs of orders whose location has been cleaned from Firebase
    const cleanedOrderIds = useRef<Set<string>>(new Set());

    // Only share location for orders that are truly active AND not yet cleaned
    const activeOrderIds = orders
        .filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && !cleanedOrderIds.current.has(o.id))
        .map(o => o.id);

    const hasActiveOrders = activeOrderIds.length > 0;

    // GPS: only runs while there are active orders
    const { position: clientGeoPos } = useGeolocation(hasActiveOrders);
    const clientGeoPosRef = useRef(clientGeoPos);
    clientGeoPosRef.current = clientGeoPos;
    const activeIdsRef = useRef(activeOrderIds);
    activeIdsRef.current = activeOrderIds;

    // Write client position to Firebase on interval (every 10s), ONLY for active orders
    useEffect(() => {
        if (!hasActiveOrders) return;

        const writeLocation = () => {
            const pos = clientGeoPosRef.current;
            const ids = activeIdsRef.current;
            if (!pos || ids.length === 0) return;

            ids.forEach(orderId => {
                const clientRef = ref(db, `client_locations/${orderId}`);
                set(clientRef, {
                    lat: pos.lat,
                    lng: pos.lng,
                    timestamp: Date.now(),
                    active: true,
                });
            });
        };

        writeLocation();
        const interval = setInterval(writeLocation, 10000);
        return () => clearInterval(interval);
    }, [hasActiveOrders]);

    // Clean up Firebase IMMEDIATELY when orders are delivered/cancelled
    useEffect(() => {
        orders.forEach(order => {
            if (
                (order.status === 'delivered' || order.status === 'cancelled') &&
                !cleanedOrderIds.current.has(order.id)
            ) {
                cleanedOrderIds.current.add(order.id);
                const clientRef = ref(db, `client_locations/${order.id}`);
                remove(clientRef);
            }
        });

        if (!hasActiveOrders) {
            localStorage.removeItem('frutamix-geo-granted');
        }
    }, [orders, hasActiveOrders]);

    const clientPos: [number, number] | null = clientGeoPos
        ? [clientGeoPos.lat, clientGeoPos.lng]
        : null;

    const fetchOrders = useCallback(async () => {
        try {
            const raw = localStorage.getItem(ORDERS_KEY);
            if (!raw) { setLoading(false); return; }

            let stored: StoredOrder[] = JSON.parse(raw);

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
            validOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(validOrders);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 9000);
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

            {hasActiveOrders && clientGeoPos && (
                <div className="client-sharing-status">
                    <div className="client-sharing-dot" />
                    Compartilhando sua localização
                </div>
            )}

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
                        const isDelivering = status === 'delivering';
                        const currentStep = getStepIndex(status);
                        const isMapExpanded = expandedMap === order.id;

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

                                {isDelivering && (
                                    <>
                                        <button
                                            className={`btn-primary tracking-map-btn ${isMapExpanded ? 'active' : ''}`}
                                            onClick={() => setExpandedMap(isMapExpanded ? null : order.id)}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                            </svg>
                                            {isMapExpanded ? 'Fechar Mapa' : 'Rastrear no Mapa'}
                                        </button>

                                        {isMapExpanded && (
                                            <InlineTrackingMap orderId={order.id} clientPos={clientPos} />
                                        )}
                                    </>
                                )}

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
