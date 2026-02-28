'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface OrderBasic {
    id: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
}

interface Toast {
    id: string;
    name: string;
    total: string;
}

export default function AdminNotifications() {
    const { permission, isSubscribed, loading: pushLoading, subscribe } = usePushNotifications();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [showBanner, setShowBanner] = useState(true);
    const prevPendingIdsRef = useRef<Set<string> | null>(null);
    const router = useRouter();

    const formatPrice = (price: number) =>
        price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Polling global — roda em qualquer página admin
    useEffect(() => {
        let mounted = true;

        const checkNewOrders = async () => {
            try {
                const res = await fetch('/api/admin/orders');
                if (!res.ok) return;
                const data = await res.json();
                const orders: OrderBasic[] = data.orders || [];

                const pendingOrders = orders.filter(o => o.status === 'pending');
                const pendingIds = new Set(pendingOrders.map(o => o.id));

                if (prevPendingIdsRef.current !== null && mounted) {
                    // Encontrar pedidos novos que não existiam antes
                    const newOrders = pendingOrders.filter(
                        o => !prevPendingIdsRef.current!.has(o.id)
                    );

                    if (newOrders.length > 0) {
                        // Som
                        try { new Audio('/notification.wav').play(); } catch {}

                        // Toast pra cada novo pedido
                        const newToasts = newOrders.map(o => ({
                            id: o.id,
                            name: o.customer_name,
                            total: formatPrice(o.total),
                        }));
                        setToasts(prev => [...newToasts, ...prev]);

                        // Auto-dismiss depois de 8 segundos
                        newToasts.forEach(t => {
                            setTimeout(() => {
                                if (mounted) dismissToast(t.id);
                            }, 8000);
                        });
                    }
                }

                prevPendingIdsRef.current = pendingIds;
            } catch {}
        };

        checkNewOrders();
        const interval = setInterval(checkNewOrders, 10000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [dismissToast]);

    const handleToastClick = (id: string) => {
        dismissToast(id);
        router.push('/admin/orders');
    };

    const renderBanner = () => {
        if (pushLoading || permission === 'unsupported' || !showBanner) return null;

        // Estado 1: Bloqueado — instrucoes de desbloqueio
        if (permission === 'denied') {
            return (
                <div className="notif-banner notif-banner--denied">
                    <div className="notif-banner-content">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        <div>
                            <p className="notif-banner-title">Notificações bloqueadas</p>
                            <p className="notif-banner-hint">Para receber alertas de novos pedidos, desbloqueie nas configurações:</p>
                            <ul className="notif-banner-steps">
                                <li>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    <strong>Chrome:</strong> Clique no cadeado ao lado da URL → Notificações → Permitir → Recarregue a página
                                </li>
                                <li>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                    <strong>macOS:</strong> Ajustes do Sistema → Notificações → Google Chrome → Ativar
                                </li>
                                <li>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                                    <strong>Android:</strong> Configurações → Apps → Chrome → Notificações → Ativar
                                </li>
                            </ul>
                        </div>
                    </div>
                    <button className="notif-banner-dismiss" onClick={() => setShowBanner(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            );
        }

        // Estado 2: Ativado com sucesso — dica sobre SO
        if (permission === 'granted' && isSubscribed) {
            return (
                <div className="notif-banner notif-banner--success">
                    <div className="notif-banner-content">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <div>
                            <p className="notif-banner-title">Notificações ativas</p>
                            <p className="notif-banner-hint">Se não receber notificações com a aba fechada, verifique: Ajustes do Sistema → Notificações → Chrome</p>
                        </div>
                    </div>
                    <button className="notif-banner-dismiss" onClick={() => setShowBanner(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            );
        }

        // Estado 3: Ainda não pediu — botão de ativar
        if (!isSubscribed) {
            return (
                <div className="notif-banner">
                    <div className="notif-banner-content">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <div>
                            <p className="notif-banner-title">Ative as notificações para ser alertado quando chegar um novo pedido.</p>
                            <p className="notif-banner-hint">PC: navegador aberto, aba pode estar fechada · Celular: funciona mesmo com navegador fechado</p>
                            <div className="notif-banner-actions">
                                <button className="btn-primary btn-sm" onClick={subscribe}>
                                    Ativar notificações
                                </button>
                            </div>
                        </div>
                    </div>
                    <button className="notif-banner-dismiss" onClick={() => setShowBanner(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            {renderBanner()}

            {/* Toasts — canto superior direito */}
            {toasts.length > 0 && (
                <div className="notif-toast-container">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className="notif-toast"
                            onClick={() => handleToastClick(toast.id)}
                        >
                            <div className="notif-toast-header">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                <span>Novo Pedido</span>
                                <button
                                    className="notif-toast-close"
                                    onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className="notif-toast-body">
                                <span className="notif-toast-name">{toast.name}</span>
                                <span className="notif-toast-total">{toast.total}</span>
                            </div>
                            <p className="notif-toast-action">Clique para ver o pedido</p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
