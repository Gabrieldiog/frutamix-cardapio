export interface Category {
    id: string;
    name: string;
    display_order: number;
    created_at: string;
}

export interface AddonGroup {
    id: string;
    name: string;
    created_at: string;
    addon_items?: AddonItem[];
}

export interface AddonItem {
    id: string;
    group_id: string;
    name: string;
    price: number;
    created_at: string;
}

export interface ProductAddonGroup {
    id: string;
    product_id: string;
    group_id: string;
    free_addon_limit: number;
    created_at: string;
    addon_groups?: AddonGroup;
}

export interface SelectedAddon {
    id: string;
    name: string;
    price: number;
    group?: string;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    available: boolean;
    created_at: string;
    product_addon_groups?: ProductAddonGroup[];
}

export interface CartItem {
    product: Product;
    quantity: number;
    addons: SelectedAddon[];
}

export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export interface OrderData {
    customer_name: string;
    customer_address: string;
    payment_method: PaymentMethod;
    change_for: number | null;
    items: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
    }[];
    total: number;
}

export interface Order {
    id: string;
    customer_name: string;
    customer_address: string;
    payment_method: PaymentMethod;
    change_for: number | null;
    total: number;
    status: string;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    addons?: SelectedAddon[];
}

// Admin types
export interface ProductWithCategory extends Product {
    categories?: { name: string };
}

export interface AdminUser {
    id: string;
    email: string;
    created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderWithItems extends Order {
    order_items: OrderItem[];
}
