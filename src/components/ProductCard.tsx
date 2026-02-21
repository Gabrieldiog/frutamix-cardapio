'use client';

import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { FruitIcon, PlusIcon, CheckIcon } from './Icons';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 600);
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <>
            <div className="product-card" onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                    />
                ) : (
                    <div className="product-image-placeholder">
                        <FruitIcon size={36} color="var(--primary)" />
                    </div>
                )}
                <div className="product-info">
                    <div>
                        <div className="product-name">{product.name}</div>
                        {product.description && (
                            <div className="product-description">{product.description}</div>
                        )}
                    </div>
                    <div className="product-bottom">
                        <div className="product-price">{formatPrice(product.price)}</div>
                        <button
                            className="add-button"
                            onClick={handleAdd}
                            aria-label={`Adicionar ${product.name}`}
                            style={added ? { background: '#27AE60', transform: 'scale(1.15)' } : {}}
                        >
                            {added ? <CheckIcon size={18} color="#fff" /> : <PlusIcon size={18} color="#fff" />}
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <ProductDetailModal
                    product={product}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
