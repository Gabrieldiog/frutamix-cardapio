'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Product } from '@/types';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        fetch(`/api/admin/products/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data.product);
                setLoading(false);
            });
    }, [params.id]);

    const handleSubmit = async (data: {
        name: string;
        description: string;
        price: number;
        category_id: string;
        available: boolean;
        image_url: string;
        old_image_path?: string;
    }) => {
        setSaving(true);
        const res = await fetch(`/api/admin/products/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setSaving(false);
            throw new Error(err.error || 'Erro ao atualizar produto');
        }

        router.push('/admin/products');
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;
    if (!product) return <div className="admin-loading">Produto não encontrado</div>;

    return <ProductForm product={product} onSubmit={handleSubmit} isLoading={saving} />;
}
