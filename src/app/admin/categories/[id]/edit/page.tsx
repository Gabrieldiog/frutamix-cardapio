'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Category } from '@/types';
import CategoryForm from '@/components/admin/CategoryForm';

export default function EditCategoryPage() {
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        fetch(`/api/admin/categories/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setCategory(data.category);
                setLoading(false);
            });
    }, [params.id]);

    const handleSubmit = async (data: { name: string; display_order: number }) => {
        setSaving(true);
        const res = await fetch(`/api/admin/categories/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setSaving(false);
            throw new Error(err.error || 'Erro ao atualizar categoria');
        }

        router.push('/admin/categories');
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;
    if (!category) return <div className="admin-loading">Categoria não encontrada</div>;

    return <CategoryForm category={category} onSubmit={handleSubmit} isLoading={saving} />;
}
