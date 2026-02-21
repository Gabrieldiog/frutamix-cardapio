'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, SelectedAddon } from '@/types';

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, qty?: number, addons?: SelectedAddon[]) => void;
    removeItem: (key: string) => void;
    updateQuantity: (key: string, qty: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'frutamix-cart';

// Unique key for a cart item: same product + same addons = same entry
export function cartItemKey(productId: string, addons: SelectedAddon[]): string {
    if (!addons || addons.length === 0) return productId;
    const sorted = [...addons].map(a => a.id).sort().join(',');
    return `${productId}:${sorted}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migrate old cart items without addons field
                const migrated = parsed.map((item: CartItem) => ({
                    ...item,
                    addons: item.addons || [],
                }));
                setItems(migrated);
            }
        } catch {
            // Ignore parse errors
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isHydrated]);

    const addItem = useCallback((product: Product, qty: number = 1, addons: SelectedAddon[] = []) => {
        setItems(prev => {
            const key = cartItemKey(product.id, addons);
            const existing = prev.find(item => cartItemKey(item.product.id, item.addons) === key);
            if (existing) {
                return prev.map(item =>
                    cartItemKey(item.product.id, item.addons) === key
                        ? { ...item, quantity: item.quantity + qty }
                        : item
                );
            }
            return [...prev, { product, quantity: qty, addons }];
        });
    }, []);

    const removeItem = useCallback((key: string) => {
        setItems(prev => prev.filter(item => cartItemKey(item.product.id, item.addons) !== key));
    }, []);

    const updateQuantity = useCallback((key: string, qty: number) => {
        if (qty <= 0) {
            setItems(prev => prev.filter(item => cartItemKey(item.product.id, item.addons) !== key));
            return;
        }
        setItems(prev =>
            prev.map(item =>
                cartItemKey(item.product.id, item.addons) === key
                    ? { ...item, quantity: qty }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const total = items.reduce((sum, item) => {
        const addonsPrice = (item.addons || []).reduce((s, a) => s + a.price, 0);
        return sum + (item.product.price + addonsPrice) * item.quantity;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
