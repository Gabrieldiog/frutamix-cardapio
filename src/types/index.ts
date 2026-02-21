export interface Category {
    id: string;
    name: string;
    display_order: number;
    created_at: string;
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
}

export interface CartItem {
    product: Product;
    quantity: number;
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
