'use client';

import { useEffect, useState, useMemo } from 'react';
import { Product, SelectedAddon } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { CloseIcon, FruitIcon, PlusIcon, CheckIcon } from './Icons';

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    // Array preserves selection order — first selected = first free
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    const addonGroups = product.product_addon_groups || [];

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const selectedSet = useMemo(() => new Set(selectedAddons), [selectedAddons]);

    const toggleAddon = (addonId: string) => {
        setSelectedAddons(prev => {
            if (prev.includes(addonId)) {
                return prev.filter(id => id !== addonId);
            }
            return [...prev, addonId];
        });
    };

    // Compute effective prices per group: first selected items become free (by selection order)
    const { effectiveAddons, addonsTotal } = useMemo(() => {
        const map = new Map<string, { effectivePrice: number; isFree: boolean }>();
        let total = 0;

        for (const pag of addonGroups) {
            const group = pag.addon_groups;
            if (!group?.addon_items) continue;

            const freeLimit = pag.free_addon_limit || 0;
            const groupItemIds = new Set(group.addon_items.map(i => i.id));
            const itemMap = new Map(group.addon_items.map(i => [i.id, i]));

            // Filter selectedAddons to this group, preserving selection order
            const selectedInOrder = selectedAddons.filter(id => groupItemIds.has(id));

            selectedInOrder.forEach((id, idx) => {
                const item = itemMap.get(id)!;
                const isFree = idx < freeLimit;
                const effectivePrice = isFree ? 0 : item.price;
                map.set(id, { effectivePrice, isFree });
                total += effectivePrice;
            });
        }

        return { effectiveAddons: map, addonsTotal: total };
    }, [addonGroups, selectedAddons]);

    // Identify flavor group item IDs
    const flavorItemIds = useMemo(() => {
        const ids = new Set<string>();
        for (const pag of addonGroups) {
            if (!pag.is_flavor) continue;
            const group = pag.addon_groups;
            if (!group?.addon_items) continue;
            for (const item of group.addon_items) ids.add(item.id);
        }
        return ids;
    }, [addonGroups]);

    const hasFlavorGroups = addonGroups.some(pag => pag.is_flavor);

    // Build SelectedAddon[] with effective prices for cart
    const { flavorAddons, nonFlavorAddons } = useMemo(() => {
        const flavor: SelectedAddon[] = [];
        const nonFlavor: SelectedAddon[] = [];
        for (const pag of addonGroups) {
            const group = pag.addon_groups;
            if (!group?.addon_items) continue;
            for (const item of group.addon_items) {
                if (selectedSet.has(item.id)) {
                    const eff = effectiveAddons.get(item.id);
                    const addon: SelectedAddon = {
                        id: item.id,
                        name: item.name,
                        price: eff ? eff.effectivePrice : item.price,
                        group: group.name,
                    };
                    if (flavorItemIds.has(item.id)) {
                        flavor.push(addon);
                    } else {
                        nonFlavor.push(addon);
                    }
                }
            }
        }
        return { flavorAddons: flavor, nonFlavorAddons: nonFlavor };
    }, [addonGroups, selectedSet, effectiveAddons, flavorItemIds]);

    // Calculate total considering flavor = separate items
    const flavorCount = hasFlavorGroups ? Math.max(flavorAddons.length, 1) : 1;
    const nonFlavorTotal = nonFlavorAddons.reduce((s, a) => s + a.price, 0);
    const flavorPriceTotal = flavorAddons.reduce((s, a) => s + a.price, 0);
    const totalPrice = hasFlavorGroups && flavorAddons.length > 0
        ? flavorCount * (product.price + nonFlavorTotal) + flavorPriceTotal
        : product.price + addonsTotal;

    const handleAdd = () => {
        if (hasFlavorGroups && flavorAddons.length > 0) {
            // Each flavor = 1 separate cart item with non-flavor addons included
            for (const flavorAddon of flavorAddons) {
                addItem(product, 1, [flavorAddon, ...nonFlavorAddons]);
            }
        } else {
            // Normal behavior: 1 item with all addons
            addItem(product, 1, [...flavorAddons, ...nonFlavorAddons]);
        }
        setAdded(true);
        setTimeout(() => {
            setAdded(false);
            onClose();
        }, 600);
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-close-wrapper">
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <CloseIcon size={24} />
                    </button>
                </div>

                {product.image_url ? (
                    <div className="modal-image-wrapper">
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="modal-product-image"
                        />
                    </div>
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

                {addonGroups.map(pag => {
                    const group = pag.addon_groups;
                    if (!group?.addon_items || group.addon_items.length === 0) return null;

                    const freeLimit = pag.free_addon_limit || 0;
                    const isFlavor = pag.is_flavor || false;
                    const selectedInGroup = group.addon_items.filter(i => selectedSet.has(i.id)).length;
                    const freeUsed = Math.min(selectedInGroup, freeLimit);
                    const freeRemaining = Math.max(0, freeLimit - selectedInGroup);

                    return (
                        <div key={pag.id} className="modal-addons">
                            <div className="modal-addons-title">
                                {group.name}
                                {freeLimit > 0 && (
                                    <span className="modal-addons-counter">
                                        {freeRemaining > 0
                                            ? `${freeUsed}/${freeLimit} grátis`
                                            : `${freeLimit} grátis usados`
                                        }
                                    </span>
                                )}
                            </div>
                            {isFlavor && (
                                <div className="modal-addons-flavor-hint">
                                    Cada sabor = 1 item no carrinho
                                </div>
                            )}
                            {freeLimit > 0 && (
                                <div className="modal-addons-subtitle">
                                    {freeLimit === 1 ? 'Primeiro' : `Primeiros ${freeLimit}`} grátis!
                                </div>
                            )}
                            <div className="modal-addons-list">
                                {group.addon_items.map(item => {
                                    const isSelected = selectedSet.has(item.id);
                                    const eff = effectiveAddons.get(item.id);
                                    const isFree = eff?.isFree ?? false;
                                    return (
                                        <label
                                            key={item.id}
                                            className={`modal-addon-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleAddon(item.id)}
                                        >
                                            <div className={`modal-addon-checkbox ${isSelected ? 'checked' : ''}`} />
                                            <span className="modal-addon-name">{item.name}</span>
                                            {isSelected && isFree ? (
                                                <span className="modal-addon-free">Grátis</span>
                                            ) : item.price > 0 ? (
                                                <span className="modal-addon-price">+{formatPrice(item.price)}</span>
                                            ) : null}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {(addonsTotal > 0 || (hasFlavorGroups && flavorAddons.length > 1)) && (
                    <div className="modal-addons-subtotal">
                        {hasFlavorGroups && flavorAddons.length > 1
                            ? `${flavorAddons.length} itens — Total: ${formatPrice(totalPrice)}`
                            : `Total: ${formatPrice(totalPrice)}`
                        }
                    </div>
                )}

                <button
                    className="btn-primary modal-add-button"
                    onClick={handleAdd}
                    style={added ? { background: 'var(--success)' } : {}}
                >
                    {added ? (
                        <><CheckIcon size={20} color="#fff" /> Adicionado!</>
                    ) : (
                        <><PlusIcon size={20} color="#fff" /> Adicionar{hasFlavorGroups && flavorAddons.length > 1 ? ` ${flavorAddons.length} itens` : ' ao carrinho'}{totalPrice > product.price ? ` ${formatPrice(totalPrice)}` : ''}</>
                    )}
                </button>
            </div>
        </div>
    );
}
