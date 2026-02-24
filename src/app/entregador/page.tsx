'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useGeolocation } from '@/hooks/useGeolocation';
import { OrderWithItems, DeliveryDriver, OrderStatus } from '@/types';
import GeolocationModal from '@/components/GeolocationModal';

const STATUS_LABELS: Record<string, string> = {
    ready: 'Aguardando Você',
    preparing: 'Preparando',
    delivering: 'Em Entrega',
};

export default function EntregadorPage() {
    const [driver, setDriver] = useState<DeliveryDriver | null>(null);
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showGeoModal, setShowGeoModal] = useState(false);
    const [pendingDeliveryId, setPendingDeliveryId] = useState<string | null>(null);
    const router = useRouter();

    const { position, error: geoError } = useGeolocation(activeOrderId !== null);
    const lastWriteRef = useRef<number>(0);

    useEffect(() => {
        const stored = localStorage.getItem('frutamix-driver');
        if (!stored) {
            router.replace('/entregador/login');
            return;
        }
        try {
            setDriver(JSON.parse(stored));
        } catch {
            router.replace('/entregador/login');
        }
    }, [router]);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/entregador/orders');
            const data = await res.json();
            setOrders(data.orders || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (driver) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 15000);
            return () => clearInterval(interval);
        }
    }, [driver, fetchOrders]);

    useEffect(() => {
        if (!activeOrderId || !position || !driver) return;

        const now = Date.now();
        if (now - lastWriteRef.current < 3000) return;
        lastWriteRef.current = now;

        const deliveryRef = ref(db, `deliveries/${activeOrderId}`);
        set(deliveryRef, {
            driver_id: driver.id,
            driver_name: driver.name,
            location: {
                lat: position.lat,
                lng: position.lng,
                timestamp: now,
            },
            active: true,
        });
    }, [activeOrderId, position, driver]);

    const handleStartDelivery = async (orderId: string) => {
        const geoGranted = localStorage.getItem('frutamix-driver-geo-granted');
        if (!geoGranted) {
            setPendingDeliveryId(orderId);
            setShowGeoModal(true);
            return;
        }
        await doStartDelivery(orderId);
    };

    const handleGeoAllow = () => {
        localStorage.setItem('frutamix-driver-geo-granted', 'true');
        setShowGeoModal(false);
        if (pendingDeliveryId) {
            doStartDelivery(pendingDeliveryId);
            setPendingDeliveryId(null);
        }
    };

    const handleGeoDismiss = () => {
        localStorage.setItem('frutamix-driver-geo-granted', 'true');
        setShowGeoModal(false);
        if (pendingDeliveryId) {
            doStartDelivery(pendingDeliveryId);
            setPendingDeliveryId(null);
        }
    };

    const doStartDelivery = async (orderId: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/entregador/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'delivering' as OrderStatus }),
            });

            if (res.ok) {
                setActiveOrderId(orderId);
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'delivering' } : o
                ));
            }
        } catch { /* ignore */ }
        setUpdatingId(null);
    };

    const handleDelivered = async (orderId: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/entregador/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'delivered' as OrderStatus, driver_id: driver?.id }),
            });

            if (res.ok) {
                const deliveryRef = ref(db, `deliveries/${orderId}`);
                await remove(deliveryRef);
                const clientLocRef = ref(db, `client_locations/${orderId}`);
                await remove(clientLocRef);
                if (activeOrderId === orderId) setActiveOrderId(null);
                setOrders(prev => prev.filter(o => o.id !== orderId));
                localStorage.removeItem('frutamix-driver-geo-granted');
            }
        } catch { /* ignore */ }
        setUpdatingId(null);
    };

    const handleLogout = () => {
        if (activeOrderId) {
            const deliveryRef = ref(db, `deliveries/${activeOrderId}`);
            remove(deliveryRef);
        }
        localStorage.removeItem('frutamix-driver');
        router.replace('/entregador/login');
    };

    const formatPrice = (price: number) =>
        price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!driver) return null;

    return (
        <div className="driver-page">
            {showGeoModal && (
                <GeolocationModal
                    theme="dark"
                    onAllow={handleGeoAllow}
                    onDismiss={handleGeoDismiss}
                />
            )}
            <header className="driver-header">
                <div className="driver-header-info">
                    <div className="driver-header-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <div className="driver-header-name">{driver.name}</div>
                        <div className="driver-header-role">Entregador</div>
                    </div>
                </div>
                <button className="driver-logout-btn" onClick={handleLogout}>Sair</button>
            </header>

            <div className="driver-content">
                <h2 className="driver-section-title">
                    Pedidos para Entrega
                    {orders.length > 0 && <span className="driver-order-count">{orders.length}</span>}
                </h2>

                {geoError && activeOrderId && (
                    <div className="driver-geo-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {geoError}
                    </div>
                )}

                {activeOrderId && position && (
                    <div className="driver-gps-status">
                        <div className="driver-gps-dot" />
                        GPS ativo — compartilhando localização
                    </div>
                )}

                {loading ? (
                    <div className="driver-loading">Carregando pedidos...</div>
                ) : orders.length === 0 ? (
                    <div className="driver-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                        </svg>
                        <p>Nenhum pedido para entrega no momento</p>
                    </div>
                ) : (
                    <div className="driver-orders">
                        {orders.map(order => {
                            const isActive = activeOrderId === order.id;
                            const isDelivering = order.status === 'delivering';
                            const isUpdating = updatingId === order.id;

                            return (
                                <div key={order.id} className={`driver-order-card ${isActive ? 'active' : ''}`}>
                                    <div className="driver-order-header">
                                        <div>
                                            <span className="driver-order-id">
                                                Pedido #{order.id.slice(0, 8).toUpperCase()}
                                            </span>
                                            <span className="driver-order-time">{formatTime(order.created_at)}</span>
                                        </div>
                                        <span className={`driver-status-badge ${order.status}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </div>

                                    <div className="driver-order-customer">
                                        <div className="driver-order-name">{order.customer_name}</div>
                                        <div className="driver-order-address">{order.customer_address}</div>
                                        {order.customer_phone && (
                                            <a href={`tel:${order.customer_phone}`} className="driver-order-phone">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                                {order.customer_phone}
                                            </a>
                                        )}
                                    </div>

                                    <div className="driver-order-items">
                                        {order.order_items.map(item => (
                                            <div key={item.id} className="driver-order-item">
                                                <span className="driver-item-qty">{item.quantity}x</span>
                                                <span className="driver-item-name">{item.product_name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="driver-order-footer">
                                        <div className="driver-order-total">{formatPrice(order.total)}</div>
                                        <div className="driver-order-payment">
                                            {order.payment_method === 'pix' ? 'Pix' :
                                                order.payment_method === 'cartao' ? 'Cartão' : 'Dinheiro'}
                                            {order.payment_method === 'dinheiro' && order.change_for && (
                                                <> (troco p/ {formatPrice(order.change_for)})</>
                                            )}
                                        </div>
                                    </div>

                                    <div className="driver-order-actions">
                                        {order.status === 'ready' && (
                                            <button
                                                className="driver-btn-start"
                                                onClick={() => handleStartDelivery(order.id)}
                                                disabled={isUpdating || (activeOrderId !== null && activeOrderId !== order.id)}
                                            >
                                                {isUpdating ? (
                                                    <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                                    </svg>
                                                )}
                                                {isUpdating ? 'Iniciando...' : 'Pegar Entrega'}
                                            </button>
                                        )}
                                        {isDelivering && (
                                            <button
                                                className="driver-btn-delivered"
                                                onClick={() => handleDelivered(order.id)}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                                {isUpdating ? 'Finalizando...' : 'Pedido Entregue'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
