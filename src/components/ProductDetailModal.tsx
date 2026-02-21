'use client';

import { useEffect } from 'react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { CloseIcon, FruitIcon, PlusIcon, CheckIcon } from './Icons';
import { useState } from 'react';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleAdd = () => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 600);
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Fechar">
                    <CloseIcon size={24} />
                </button>

                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="modal-product-image"
                    />
                ) : (
                    <div className="modal-product-image-placeholder">
                        <FruitIcon size={64} color="var(--primary)" />
                    </div>
                )}

                <div className="modal-product-info">
                    <h2 className="modal-product-name">{product.name}</h2>
                    {product.description && (
                        <p className="modal-product-description">{product.description}</p>
                    )}
                    <div className="modal-product-price">{formatPrice(product.price)}</div>
                </div>

                <button
                    className="btn-primary modal-add-button"
                    onClick={handleAdd}
                    style={added ? { background: 'var(--success)' } : {}}
                >
                    {added ? (
                        <><CheckIcon size={20} color="#fff" /> Adicionado!</>
                    ) : (
                        <><PlusIcon size={20} color="#fff" /> Adicionar ao carrinho</>
                    )}
                </button>
            </div>
        </div>
    );
}
