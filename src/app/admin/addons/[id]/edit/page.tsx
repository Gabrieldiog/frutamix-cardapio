'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AddonGroup } from '@/types';
import AddonGroupForm from '@/components/admin/AddonGroupForm';

export default function EditAddonGroupPage() {
    const [group, setGroup] = useState<AddonGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        fetch(`/api/admin/addons/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setGroup(data.group);
                setLoading(false);
            });
    }, [params.id]);

    const handleSubmit = async (data: { name: string; items: { name: string; price: number }[] }) => {
        setSaving(true);
        const res = await fetch(`/api/admin/addons/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setSaving(false);
            throw new Error(err.error || 'Erro ao atualizar grupo');
        }

        router.push('/admin/addons');
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;
    if (!group) return <div className="admin-loading">Grupo não encontrado</div>;

    return <AddonGroupForm group={group} onSubmit={handleSubmit} isLoading={saving} />;
}
