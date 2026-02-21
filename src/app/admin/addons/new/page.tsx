'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddonGroupForm from '@/components/admin/AddonGroupForm';

export default function NewAddonGroupPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (data: { name: string; items: { name: string; price: number }[] }) => {
        setLoading(true);
        const res = await fetch('/api/admin/addons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            setLoading(false);
            throw new Error(err.error || 'Erro ao criar grupo');
        }

        router.push('/admin/addons');
    };

    return <AddonGroupForm onSubmit={handleSubmit} isLoading={loading} />;
}
