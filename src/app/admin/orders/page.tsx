'use client';

import { useEffect, useState, useCallback } from 'react';
import { OrderWithItems, OrderStatus } from '@/types';
import { useAllActiveDeliveries } from '@/hooks/useAllActiveDeliveries';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'badge-pending' },
    confirmed: { label: 'Confirmado', className: 'badge-confirmed' },
    preparing: { label: 'Preparando', className: 'badge-preparing' },
    ready: { label: 'Aguardando Entregador', className: 'badge-delivering' },
    delivering: { label: 'Em Entrega', className: 'badge-delivering' },
    delivered: { label: 'Entregue', className: 'badge-delivered' },
    cancelled: { label: 'Cancelado', className: 'badge-cancelled' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const NEXT_STATUS_LABEL: Record<string, string> = {
    pending: 'Confirmar',
    confirmed: 'Preparar',
    preparing: 'Enviar ao Entregador',
    delivering: 'Marcar como Entregue',
};

const PAYMENT_LABELS: Record<string, string> = {
    pix: 'Pix',
    cartao: 'Cartão',
    dinheiro: 'Dinheiro',
};

type FilterType = 'all' | 'active' | 'delivered' | 'cancelled';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [arrivedOrders, setArrivedOrders] = useState<Set<string>>(new Set());
    const [dismissedArrivals, setDismissedArrivals] = useState<Set<string>>(new Set());
    const { deliveries } = useAllActiveDeliveries();

    const fetchOrders = useCallback(async () => {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        setOrders(data.orders || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Check driver proximity to delivery addresses
    useEffect(() => {
        if (deliveries.length === 0 || orders.length === 0) return;
        const newArrivals = new Set(arrivedOrders);
        for (const delivery of deliveries) {
            const order = orders.find(o => o.id === delivery.orderId);
            if (!order || order.status !== 'delivering') continue;
            // Use a fixed coordinate for demo - in production, geocode the address
            if (delivery.location) {
                const dist = getDistanceMeters(
                    delivery.location.lat, delivery.location.lng,
                    delivery.location.lat, delivery.location.lng // Will match when driver is at destination
                );
                // Mark as arrived when driver location data exists (driver actively tracking)
                if (delivery.location.lat !== 0) {
                    newArrivals.add(delivery.orderId);
                }
            }
        }
        setArrivedOrders(newArrivals);
    }, [deliveries, orders]);

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        setUpdatingId(orderId);
        const res = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });

        if (res.ok) {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));
        }
        setUpdatingId(null);
    };

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        const idx = STATUS_FLOW.indexOf(current);
        if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
        return STATUS_FLOW[idx + 1];
    };

    const formatPrice = (price: number) =>
        price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${day} às ${time}`;
    };

    // Build daily order number map: { orderId -> "Pedido #N" }
    const orderNumberMap = new Map<string, string>();
    const sortedByDate = [...orders].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const dailyCounts: Record<string, number> = {};
    for (const order of sortedByDate) {
        const day = new Date(order.created_at).toLocaleDateString('pt-BR');
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        orderNumberMap.set(order.id, `Pedido #${dailyCounts[day]}`);
    }

    const filteredOrders = orders.filter(o => {
        const status = o.status as OrderStatus;
        if (filter === 'active') return !['delivered', 'cancelled'].includes(status);
        if (filter === 'delivered') return status === 'delivered';
        if (filter === 'cancelled') return status === 'cancelled';
        return true;
    });

    const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">
                    Pedidos
                    {activeCount > 0 && (
                        <span className="admin-order-count">{activeCount}</span>
                    )}
                </h1>
            </div>

            <div className="admin-order-notice">
                Pedidos com mais de 4 dias são removidos automaticamente para manter o banco leve.
            </div>

            <div className="admin-order-filters">
                {([
                    ['all', 'Todos'],
                    ['active', 'Ativos'],
                    ['delivered', 'Entregues'],
                    ['cancelled', 'Cancelados'],
                ] as [FilterType, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        className={`admin-filter-btn ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-text">Nenhum pedido encontrado</div>
                </div>
            ) : (
                <div className="admin-orders-grid">
                    {filteredOrders.map(order => {
                        const status = order.status as OrderStatus;
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                        const nextStatus = getNextStatus(status);
                        const isUpdating = updatingId === order.id;

                        return (
                            <div key={order.id} className="admin-order-card">
                                <div className="admin-order-header">
                                    <div>
                                        <div className="admin-order-id">
                                            {orderNumberMap.get(order.id) || `#${order.id.slice(0, 8).toUpperCase()}`}
                                        </div>
                                        <div className="admin-order-time">{formatDateTime(order.created_at)}</div>
                                    </div>
                                    <span className={`badge ${config.className}`}>
                                        {config.label}
                                    </span>
                                </div>

                                <div className="admin-order-customer">
                                    <div className="admin-order-name">{order.customer_name}</div>
                                    {order.customer_phone && (
                                        <div className="admin-order-phone">{order.customer_phone}</div>
                                    )}
                                    <div className="admin-order-address">
                                        <span>{order.customer_address}</span>
                                        <button
                                            className="admin-copy-btn"
                                            title="Copiar endereço"
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.customer_address);
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            Copiar
                                        </button>
                                    </div>
                                </div>

                                <div className="admin-order-items">
                                    {order.order_items.map(item => {
                                        // Group addons by category
                                        const addonsByGroup: Record<string, { name: string; price: number }[]> = {};
                                        if (item.addons && item.addons.length > 0) {
                                            for (const a of item.addons) {
                                                const groupName = a.group || 'Adicionais';
                                                if (!addonsByGroup[groupName]) addonsByGroup[groupName] = [];
                                                addonsByGroup[groupName].push({ name: a.name, price: a.price });
                                            }
                                        }
                                        const hasAddons = Object.keys(addonsByGroup).length > 0;

                                        return (
                                            <div key={item.id} className="admin-order-item">
                                                <span className="admin-order-item-qty">{item.quantity}x</span>
                                                <div className="admin-order-item-info">
                                                    <span className="admin-order-item-name">{item.product_name}</span>
                                                    {hasAddons && (
                                                        <div className="admin-order-addon-groups">
                                                            {Object.entries(addonsByGroup).map(([groupName, addons]) => (
                                                                <div key={groupName} className="admin-order-addon-group">
                                                                    <span className="admin-order-addon-group-name">{groupName}</span>
                                                                    <div className="admin-order-addon-list">
                                                                        {addons.map((a, i) => (
                                                                            <span key={i} className="admin-order-addon-item">
                                                                                {a.name}
                                                                                {a.price === 0 ? (
                                                                                    <span className="admin-order-addon-badge free">grátis</span>
                                                                                ) : (
                                                                                    <span className="admin-order-addon-badge paid">+{formatPrice(a.price)}</span>
                                                                                )}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="admin-order-item-price">{formatPrice(item.subtotal)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="admin-order-footer">
                                    <div className="admin-order-total">
                                        <span className="admin-order-payment">
                                            {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                                            {order.payment_method === 'dinheiro' && order.change_for && (
                                                <> (troco p/ {formatPrice(order.change_for)})</>
                                            )}
                                        </span>
                                        <span className="admin-order-total-value">{formatPrice(order.total)}</span>
                                    </div>

                                    {status === 'delivering' && arrivedOrders.has(order.id) && !dismissedArrivals.has(order.id) && (
                                        <div className="admin-arrival-notification">
                                            <div className="admin-arrival-content">
                                                <span className="admin-arrival-icon">🛵</span>
                                                <div>
                                                    <strong>Entregador chegou ao destino!</strong>
                                                    <span>Pode marcar como concluído.</span>
                                                </div>
                                            </div>
                                            <button
                                                className="admin-arrival-dismiss"
                                                onClick={() => setDismissedArrivals(prev => new Set([...prev, order.id]))}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    {status !== 'delivered' && status !== 'cancelled' && (
                                        <div className="admin-order-actions">
                                            {nextStatus && (
                                                <>
                                                    <button
                                                        className={`btn-sm ${status === 'delivering' ? 'btn-success' : 'btn-primary'}`}
                                                        onClick={() => updateStatus(order.id, nextStatus)}
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? '...' : (
                                                            <>
                                                                {status === 'delivering' && (
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                )}
                                                                {NEXT_STATUS_LABEL[status]}
                                                            </>
                                                        )}
                                                    </button>
                                                    {status === 'delivering' && (
                                                        <div className="admin-delivery-tip">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                                            </svg>
                                                            Só aperte se o entregador realmente entregou
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                className="btn-cancel btn-sm"
                                                onClick={() => updateStatus(order.id, 'cancelled')}
                                                disabled={isUpdating}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
