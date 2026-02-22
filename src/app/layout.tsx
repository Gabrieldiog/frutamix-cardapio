import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FrutaMix — Cardápio Digital',
  description: 'Peça sua salada de frutas e açaí favorita online! Cardápio digital FrutaMix.',
  keywords: 'açaí, salada de frutas, frutamix, cardápio digital, delivery',
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  openGraph: {
    title: 'FrutaMix — Cardápio Digital',
    description: 'Peça sua salada de frutas e açaí favorita online!',
    images: [{ url: '/logo.jpg' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
