'use client';

import { useState } from 'react';
import { Category } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';

interface CategoryFormProps {
    category?: Category;
    onSubmit: (data: { name: string; display_order: number }) => Promise<void>;
    isLoading: boolean;
}

export default function CategoryForm({ category, onSubmit, isLoading }: CategoryFormProps) {
    const [name, setName] = useState(category?.name || '');
    const [displayOrder, setDisplayOrder] = useState(category?.display_order || 0);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Nome é obrigatório');
            return;
        }

        try {
            await onSubmit({ name: name.trim(), display_order: displayOrder });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/admin/categories" className="admin-btn-icon">
                        <ArrowLeftIcon size={20} />
                    </Link>
                    <h1 className="admin-page-title">
                        {category ? 'Editar Categoria' : 'Nova Categoria'}
                    </h1>
                </div>
            </div>

            <div className="admin-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="cat-name">Nome</label>
                        <input
                            id="cat-name"
                            type="text"
                            className="form-input"
                            placeholder="Ex: Açaí, Bebidas..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="cat-order">Ordem de exibição</label>
                        <input
                            id="cat-order"
                            type="number"
                            className="form-input"
                            placeholder="0"
                            value={displayOrder}
                            onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {error && <div className="admin-login-error" style={{ marginTop: 16 }}>{error}</div>}

                    <div className="admin-form-actions">
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <Link href="/admin/categories" className="btn-secondary">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
