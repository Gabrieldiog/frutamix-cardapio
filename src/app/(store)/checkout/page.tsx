'use client';

import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import CheckoutForm from '@/components/CheckoutForm';
import Link from 'next/link';
import { ArrowLeftIcon, CartIcon } from '@/components/Icons';

export default function CheckoutPage() {
    const { items } = useCart();

    return (
        <>
            <Header />
            <div className="checkout-page">
                <div className="cart-header">
                    <Link href="/cart" className="back-button" aria-label="Voltar">
                        <ArrowLeftIcon size={20} />
                    </Link>
                    <h1 className="cart-title">Finalizar Pedido</h1>
                </div>

                {items.length === 0 ? (
                    <div className="cart-empty">
                        <div className="cart-empty-icon"><CartIcon size={48} color="var(--text-secondary)" /></div>
                        <div className="cart-empty-text">Seu carrinho está vazio</div>
                        <Link href="/" className="btn-secondary">
                            <ArrowLeftIcon size={16} /> Voltar ao cardápio
                        </Link>
                    </div>
                ) : (
                    <CheckoutForm />
                )}
            </div>
        </>
    );
}
