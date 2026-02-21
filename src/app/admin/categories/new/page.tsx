'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryForm from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (data: { name: string; display_order: number }) => {
        setLoading(true);
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setLoading(false);
            throw new Error(err.error || 'Erro ao criar categoria');
        }

        router.push('/admin/categories');
    };

    return <CategoryForm onSubmit={handleSubmit} isLoading={loading} />;
}
