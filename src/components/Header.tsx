'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { CartIcon, ClipboardIcon } from './Icons';

export default function Header() {
    const { itemCount } = useCart();
    const [hasOrders, setHasOrders] = useState(false);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('frutamix-orders') || '[]');
            setHasOrders(stored.length > 0);
        } catch { /* ignore */ }
    }, []);

    return (
        <header className="header">
            <div className="header-logo">
                <Image
                    src="/logo.jpg"
                    alt="FrutaMix"
                    width={48}
                    height={48}
                    priority
                    style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }}
                />
                <div>
                    <div className="header-title">FrutaMix</div>
                    <div className="header-subtitle">Salada de Frutas e Açaí</div>
                </div>
            </div>
            <div className="header-actions">
                {hasOrders && (
                    <Link href="/pedido" className="header-orders-btn" aria-label="Meus Pedidos">
                        <ClipboardIcon size={16} color="#fff" />
                        <span>Pedidos</span>
                    </Link>
                )}
                <Link href="/cart" className="cart-button" aria-label="Carrinho">
                    <CartIcon size={24} color="#fff" />
                    {itemCount > 0 && (
                        <span className="cart-badge" key={itemCount}>
                            {itemCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
