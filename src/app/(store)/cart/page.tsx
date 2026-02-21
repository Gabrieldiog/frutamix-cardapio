'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import Header from '@/components/Header';
import { CartIcon, FruitIcon, ArrowLeftIcon, ArrowRightIcon, TrashIcon, MinusIcon, PlusIcon } from '@/components/Icons';

export default function CartPage() {
    const { items, updateQuantity, removeItem, total } = useCart();

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <>
            <Header />
            <div className="cart-page">
                <div className="cart-header">
                    <Link href="/" className="back-button" aria-label="Voltar">
                        <ArrowLeftIcon size={20} />
                    </Link>
                    <h1 className="cart-title">Meu Carrinho</h1>
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
                    <>
                        <div className="cart-items">
                            {items.map(item => (
                                <div key={item.product.id} className="cart-item">
                                    {item.product.image_url ? (
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product.name}
                                            className="cart-item-image"
                                        />
                                    ) : (
                                        <div className="cart-item-image-placeholder">
                                            <FruitIcon size={32} color="var(--primary)" />
                                        </div>
                                    )}
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.product.name}</div>
                                        <div className="cart-item-price">{formatPrice(item.product.price)}</div>
                                    </div>
                                    <div className="cart-item-actions">
                                        <div className="quantity-controls">
                                            <button
                                                className={`qty-btn ${item.quantity === 1 ? 'remove' : ''}`}
                                                onClick={() => {
                                                    if (item.quantity === 1) {
                                                        removeItem(item.product.id);
                                                    } else {
                                                        updateQuantity(item.product.id, item.quantity - 1);
                                                    }
                                                }}
                                                aria-label="Diminuir quantidade"
                                            >
                                                {item.quantity === 1 ? <TrashIcon size={14} /> : <MinusIcon size={14} />}
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                aria-label="Aumentar quantidade"
                                            >
                                                <PlusIcon size={14} />
                                            </button>
                                        </div>
                                        <div className="cart-item-subtotal">
                                            {formatPrice(item.product.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <div className="cart-summary-row">
                                <span className="cart-summary-label">Subtotal</span>
                                <span className="cart-summary-value">{formatPrice(total)}</span>
                            </div>
                            <div className="cart-summary-row">
                                <span className="cart-summary-label">Taxa de entrega</span>
                                <span className="cart-summary-value" style={{ color: 'var(--success)' }}>Grátis</span>
                            </div>
                            <div className="cart-summary-row total">
                                <span className="cart-summary-label">Total</span>
                                <span className="cart-summary-value">{formatPrice(total)}</span>
                            </div>
                        </div>

                        <Link href="/checkout" className="btn-primary" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            Enviar para a loja <ArrowRightIcon size={18} />
                        </Link>
                    </>
                )}
            </div>
        </>
    );
}
