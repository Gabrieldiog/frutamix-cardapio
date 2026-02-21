'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (data: {
        name: string;
        description: string;
        price: number;
        category_id: string;
        available: boolean;
        image_url: string;
    }) => {
        setLoading(true);
        const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setLoading(false);
            throw new Error(err.error || 'Erro ao criar produto');
        }

        router.push('/admin/products');
    };

    return <ProductForm onSubmit={handleSubmit} isLoading={loading} />;
}
