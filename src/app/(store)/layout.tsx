import { CartProvider } from '@/contexts/CartContext';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="app-container">
        {children}
      </div>
    </CartProvider>
  );
}
