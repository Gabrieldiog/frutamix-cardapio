'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { ClipboardIcon, CardPayIcon, PixIcon, CashIcon, CheckIcon } from './Icons';

export default function CheckoutForm() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [changeFor, setChangeFor] = useState('');
    const [noChangeNeeded, setNoChangeNeeded] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Informe seu nome';
        if (!address.trim()) newErrors.address = 'Informe seu endereço';
        if (!paymentMethod) newErrors.payment = 'Selecione o método de pagamento';

        if (paymentMethod === 'dinheiro' && !noChangeNeeded) {
            const changeValue = parseFloat(changeFor);
            if (!changeFor || isNaN(changeValue)) {
                newErrors.change = 'Informe o valor para troco';
            } else if (changeValue < total) {
                newErrors.change = `O valor deve ser maior que ${formatPrice(total)}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);

        try {
            const orderData = {
                customer_name: name.trim(),
                customer_address: address.trim(),
                payment_method: paymentMethod,
                change_for: paymentMethod === 'dinheiro' && !noChangeNeeded
                    ? parseFloat(changeFor)
                    : null,
                items: items.map(item => {
                    const addonsPrice = (item.addons || []).reduce((s, a) => s + a.price, 0);
                    const unitPrice = item.product.price + addonsPrice;
                    return {
                        product_id: item.product.id,
                        product_name: item.product.name,
                        quantity: item.quantity,
                        unit_price: unitPrice,
                        subtotal: unitPrice * item.quantity,
                        addons: item.addons || [],
                    };
                }),
                total,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (!res.ok) {
                throw new Error('Erro ao enviar pedido');
            }

            const data = await res.json();
            clearCart();

            // Salvar pedido no localStorage para rastreamento
            try {
                const stored = JSON.parse(localStorage.getItem('frutamix-orders') || '[]');
                stored.push({ id: data.order.id, created_at: new Date().toISOString() });
                localStorage.setItem('frutamix-orders', JSON.stringify(stored));
            } catch { /* ignore */ }

            router.push(`/order-confirmed?id=${data.order.id}`);
        } catch {
            setErrors({ submit: 'Erro ao enviar o pedido. Tente novamente.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Order Summary */}
            <div className="checkout-summary">
                <div className="checkout-summary-title">Resumo do pedido</div>
                {items.map((item, idx) => {
                    const addonsPrice = (item.addons || []).reduce((s, a) => s + a.price, 0);
                    const unitPrice = item.product.price + addonsPrice;
                    return (
                        <div key={idx} className="checkout-item">
                            <div className="checkout-item-details">
                                <span className="checkout-item-name">
                                    {item.quantity}x {item.product.name}
                                </span>
                                {item.addons && item.addons.length > 0 && (
                                    <span className="checkout-item-addons">
                                        {item.addons.map(a => a.name).join(', ')}
                                    </span>
                                )}
                            </div>
                            <span className="checkout-item-price">
                                {formatPrice(unitPrice * item.quantity)}
                            </span>
                        </div>
                    );
                })}
                <div className="checkout-total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>

            {/* Customer Info */}
            <div className="form-section">
                <div className="form-section-title"><ClipboardIcon size={18} /> Seus dados</div>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Nome</label>
                    <input
                        id="name"
                        type="text"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="address">Endereço de entrega</label>
                    <span className="form-helper">
                        Adicione seu endereço completo: rua, quadra e lote. Se for apartamento, inclua o número. Adicione pontos de referência para o entregador.
                    </span>
                    <textarea
                        id="address"
                        className={`form-input form-textarea ${errors.address ? 'error' : ''}`}
                        placeholder="Ex: Rua 5, Quadra 3, Lote 12, Casa 3 - Próximo ao mercado"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        rows={3}
                    />
                    {errors.address && <div className="form-error">{errors.address}</div>}
                </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
                <div className="form-section-title"><CardPayIcon size={18} /> Forma de pagamento</div>
                <div className="payment-options">
                    {([
                        { value: 'pix' as PaymentMethod, icon: <PixIcon size={20} />, label: 'Pix' },
                        { value: 'cartao' as PaymentMethod, icon: <CardPayIcon size={20} />, label: 'Cartão' },
                        { value: 'dinheiro' as PaymentMethod, icon: <CashIcon size={20} />, label: 'Dinheiro' },
                    ]).map(option => (
                        <label
                            key={option.value}
                            className={`payment-option ${paymentMethod === option.value ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="payment"
                                value={option.value}
                                checked={paymentMethod === option.value}
                                onChange={() => setPaymentMethod(option.value)}
                            />
                            <div className="payment-radio" />
                            <span className="payment-icon">{option.icon}</span>
                            <span className="payment-label">{option.label}</span>
                        </label>
                    ))}
                </div>
                {errors.payment && <div className="form-error" style={{ marginTop: 8 }}>{errors.payment}</div>}

                {paymentMethod === 'dinheiro' && (
                    <div className="change-section">
                        <div className="form-group" style={{ marginBottom: noChangeNeeded ? 0 : 16 }}>
                            <label className="form-label" htmlFor="change">Troco para quanto?</label>
                            <input
                                id="change"
                                type="number"
                                className={`form-input ${errors.change ? 'error' : ''}`}
                                placeholder="Ex: 50.00"
                                value={changeFor}
                                onChange={e => setChangeFor(e.target.value)}
                                disabled={noChangeNeeded}
                                step="0.01"
                                min={total}
                            />
                            {errors.change && <div className="form-error">{errors.change}</div>}
                        </div>
                        <div
                            className="checkbox-group"
                            onClick={() => setNoChangeNeeded(!noChangeNeeded)}
                        >
                            <div className={`custom-checkbox ${noChangeNeeded ? 'checked' : ''}`} />
                            <span className="checkbox-label">Não precisa de troco</span>
                        </div>
                    </div>
                )}
            </div>

            {errors.submit && (
                <div style={{
                    background: '#FDE8E8',
                    color: 'var(--danger)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginBottom: 16,
                }}>
                    {errors.submit}
                </div>
            )}

            <button
                type="submit"
                className="btn-primary"
                disabled={submitting || items.length === 0}
            >
                {submitting ? (
                    <>
                        <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        Enviando...
                    </>
                ) : (
                    <><CheckIcon size={20} color="#fff" /> Confirmar Pedido</>
                )}
            </button>
        </form>
    );
}
