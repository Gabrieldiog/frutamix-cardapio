'use client';

import { useEffect, useState, useCallback } from 'react';
import { OrderWithItems, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'badge-pending' },
    confirmed: { label: 'Confirmado', className: 'badge-confirmed' },
    preparing: { label: 'Preparando', className: 'badge-preparing' },
    delivering: { label: 'Entregando', className: 'badge-delivering' },
    delivered: { label: 'Entregue', className: 'badge-delivered' },
    cancelled: { label: 'Cancelado', className: 'badge-cancelled' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];

const NEXT_STATUS_LABEL: Record<string, string> = {
    pending: 'Confirmar',
    confirmed: 'Preparar',
    preparing: 'Enviar',
    delivering: 'Entregue',
};

const PAYMENT_LABELS: Record<string, string> = {
    pix: 'Pix',
    cartao: 'Cartão',
    dinheiro: 'Dinheiro',
};

type FilterType = 'all' | 'active' | 'delivered' | 'cancelled';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const fetchOrders = useCallback(async () => {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        setOrders(data.orders || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

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

    const generateOrderPrint = (order: OrderWithItems) => {
        const orderNumber = orderNumberMap.get(order.id) || `#${order.id.slice(0, 8).toUpperCase()}`;
        const dateStr = formatDateTime(order.created_at);
        const paymentLabel = PAYMENT_LABELS[order.payment_method] || order.payment_method;
        const statusLabel = STATUS_CONFIG[order.status as OrderStatus]?.label || order.status;
        const logoUrl = window.location.origin + '/logo.jpg';

        const itemsHtml = order.order_items.map(item => {
            const addonsByGroup: Record<string, { name: string; price: number }[]> = {};
            if (item.addons && item.addons.length > 0) {
                for (const a of item.addons) {
                    const groupName = a.group || 'Adicionais';
                    if (!addonsByGroup[groupName]) addonsByGroup[groupName] = [];
                    addonsByGroup[groupName].push({ name: a.name, price: a.price });
                }
            }

            const addonsHtml = Object.entries(addonsByGroup).map(([groupName, addons]) => `
                <div class="addon-group">
                    <span class="addon-group-name">${groupName}:</span>
                    ${addons.map(a =>
                        `<span class="addon-item">${a.name} <span class="${a.price > 0 ? 'addon-price' : 'addon-free'}">${a.price > 0 ? `+${formatPrice(a.price)}` : 'grátis'}</span></span>`
                    ).join('')}
                </div>
            `).join('');

            return `
                <div class="item-row">
                    <div class="item-qty">${item.quantity}x</div>
                    <div class="item-details">
                        <div class="item-name">${item.product_name}</div>
                        ${addonsHtml}
                    </div>
                    <div class="item-price">${formatPrice(item.subtotal)}</div>
                </div>
            `;
        }).join('');

        const changeHtml = order.payment_method === 'dinheiro' && order.change_for
            ? `<div class="info-row"><span>Troco para</span><span>${formatPrice(order.change_for)}</span></div>`
            : '';

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${orderNumber} - FrutaMix</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            padding: 32px;
            max-width: 440px;
            margin: 0 auto;
            color: #1a1a2e;
            background: #fff;
        }

        /* === HEADER === */
        .receipt {
            border: 2px solid #e8e0f3;
            border-radius: 16px;
            overflow: hidden;
        }
        .receipt-header {
            background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
            padding: 28px 24px;
            text-align: center;
            color: #fff;
        }
        .receipt-header img {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid rgba(255,255,255,0.3);
            margin-bottom: 12px;
        }
        .receipt-header h1 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .receipt-header .doc-type {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            opacity: 0.8;
            margin-top: 4px;
        }

        /* === ORDER META === */
        .order-meta {
            display: flex;
            justify-content: space-between;
            padding: 14px 24px;
            background: #f8f5ff;
            border-bottom: 1px solid #e8e0f3;
            font-size: 13px;
        }
        .order-meta strong {
            color: #7c3aed;
            font-weight: 700;
        }
        .order-meta .status {
            background: #7c3aed;
            color: #fff;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        /* === BODY === */
        .receipt-body { padding: 24px; }

        /* === SECTION === */
        .section { margin-bottom: 20px; }
        .section-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #9ca3af;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e5e7eb;
        }

        /* === CUSTOMER === */
        .customer-card {
            background: #f9fafb;
            border-radius: 10px;
            padding: 14px 16px;
            border: 1px solid #f0f0f5;
        }
        .customer-name {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 6px;
        }
        .customer-info {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.6;
        }
        .customer-info svg {
            width: 13px;
            height: 13px;
            vertical-align: -2px;
            margin-right: 4px;
            opacity: 0.5;
        }

        /* === ITEMS === */
        .item-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .item-row:last-child { border-bottom: none; }
        .item-qty {
            background: #7c3aed;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            min-width: 30px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .item-details { flex: 1; }
        .item-name {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
        }
        .item-price {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a2e;
            white-space: nowrap;
        }
        .addon-group {
            margin-top: 4px;
            padding-left: 2px;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.7;
        }
        .addon-group-name {
            font-weight: 600;
            color: #7c3aed;
            font-size: 11px;
            text-transform: uppercase;
        }
        .addon-item {
            display: inline-block;
            margin-left: 4px;
        }
        .addon-item::after { content: ','; color: #d1d5db; }
        .addon-item:last-child::after { content: ''; }
        .addon-price {
            font-size: 11px;
            color: #7c3aed;
            font-weight: 600;
        }
        .addon-free {
            font-size: 10px;
            background: #dcfce7;
            color: #16a34a;
            padding: 1px 6px;
            border-radius: 4px;
            font-weight: 600;
        }

        /* === TOTALS === */
        .totals-section {
            background: #f8f5ff;
            border-radius: 10px;
            padding: 16px;
            border: 1px solid #e8e0f3;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #6b7280;
            padding: 4px 0;
        }
        .info-row span:last-child { font-weight: 600; color: #374151; }
        .total-divider {
            height: 2px;
            background: linear-gradient(90deg, #7c3aed, #9333ea);
            border-radius: 2px;
            margin: 10px 0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .total-label {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a2e;
        }
        .total-value {
            font-size: 26px;
            font-weight: 800;
            color: #7c3aed;
        }

        /* === FOOTER === */
        .receipt-footer {
            text-align: center;
            padding: 20px 24px;
            border-top: 1px dashed #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.6;
        }
        .receipt-footer strong { color: #7c3aed; }

        @media print {
            body { padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .receipt { border: none; }
            @page { margin: 12mm 8mm; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="receipt-header">
            <img src="${logoUrl}" alt="FrutaMix" />
            <h1>FrutaMix</h1>
            <div class="doc-type">Recibo de Pedido</div>
        </div>

        <div class="order-meta">
            <div>
                <strong>${orderNumber}</strong>
                <span style="color:#6b7280;margin-left:8px;">${dateStr}</span>
            </div>
            <span class="status">${statusLabel}</span>
        </div>

        <div class="receipt-body">
            <div class="section">
                <div class="section-label">Cliente</div>
                <div class="customer-card">
                    <div class="customer-name">${order.customer_name}</div>
                    <div class="customer-info">
                        ${order.customer_phone ? `<div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${order.customer_phone}</div>` : ''}
                        <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${order.customer_address}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-label">Itens do Pedido</div>
                ${itemsHtml}
            </div>

            <div class="section" style="margin-bottom:0">
                <div class="section-label">Pagamento</div>
                <div class="totals-section">
                    <div class="info-row">
                        <span>Forma de pagamento</span>
                        <span>${paymentLabel}</span>
                    </div>
                    ${changeHtml}
                    <div class="total-divider"></div>
                    <div class="total-row">
                        <span class="total-label">Total</span>
                        <span class="total-value">${formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="receipt-footer">
            <strong>FrutaMix</strong> &mdash; Obrigado pela preferência!
        </div>
    </div>

</body>
</html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            iframe.onload = () => {
                iframe.contentWindow?.print();
                setTimeout(() => iframe.remove(), 1000);
            };
        }
    };

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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            className="admin-order-print-btn"
                                            title="Imprimir / PDF"
                                            onClick={() => generateOrderPrint(order)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 6 2 18 2 18 9" />
                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                <rect x="6" y="14" width="12" height="8" />
                                            </svg>
                                        </button>
                                        <span className={`badge ${config.className}`}>
                                            {config.label}
                                        </span>
                                    </div>
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

                                    {status !== 'delivered' && status !== 'cancelled' && (
                                        <div className="admin-order-actions">
                                            {nextStatus && (
                                                <button
                                                    className="btn-primary btn-sm"
                                                    onClick={() => updateStatus(order.id, nextStatus)}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? '...' : NEXT_STATUS_LABEL[status]}
                                                </button>
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
