'use client';

import { useState, useEffect } from 'react';
import { AddonGroup } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@/components/Icons';

interface ItemInput {
    name: string;
    price: string;
}

interface AddonGroupFormProps {
    group?: AddonGroup;
    onSubmit: (data: { name: string; items: { name: string; price: number }[] }) => Promise<void>;
    isLoading: boolean;
}

export default function AddonGroupForm({ group, onSubmit, isLoading }: AddonGroupFormProps) {
    const [name, setName] = useState(group?.name || '');
    const [items, setItems] = useState<ItemInput[]>([{ name: '', price: '' }]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (group?.addon_items && group.addon_items.length > 0) {
            setItems(group.addon_items.map(item => ({
                name: item.name,
                price: item.price.toString(),
            })));
        }
    }, [group]);

    const addItem = () => {
        setItems([...items, { name: '', price: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'name' | 'price', value: string) => {
        setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('Nome do grupo é obrigatório'); return; }

        const validItems = items.filter(item => item.name.trim());
        if (validItems.length === 0) { setError('Adicione pelo menos um item'); return; }

        for (const item of validItems) {
            if (parseFloat(item.price) < 0) {
                setError('Preços não podem ser negativos');
                return;
            }
        }

        try {
            await onSubmit({
                name: name.trim(),
                items: validItems.map(item => ({
                    name: item.name.trim(),
                    price: parseFloat(item.price) || 0,
                })),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/admin/addons" className="admin-btn-icon">
                        <ArrowLeftIcon size={20} />
                    </Link>
                    <h1 className="admin-page-title">
                        {group ? 'Editar Grupo' : 'Novo Grupo de Adicionais'}
                    </h1>
                </div>
            </div>

            <div className="admin-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="admin-form-grid">
                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="group-name">Nome do Grupo *</label>
                            <input
                                id="group-name"
                                type="text"
                                className="form-input"
                                placeholder="Ex: Cremes, Acompanhamentos"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="addons-section" style={{ marginTop: 16 }}>
                        <label className="form-label">Itens do Grupo *</label>
                        <div className="addons-list">
                            {items.map((item, index) => (
                                <div key={index} className="addon-row">
                                    <input
                                        type="text"
                                        className="form-input addon-name-input"
                                        placeholder="Nome (ex: Ninho)"
                                        value={item.name}
                                        onChange={e => updateItem(index, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="form-input addon-price-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        value={item.price}
                                        onChange={e => updateItem(index, 'price', e.target.value)}
                                    />
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            className="admin-btn-icon danger"
                                            onClick={() => removeItem(index)}
                                            aria-label="Remover item"
                                        >
                                            <TrashIcon size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn-add-addon"
                                onClick={addItem}
                            >
                                <PlusIcon size={16} /> Adicionar Item
                            </button>
                        </div>
                    </div>

                    {error && <div className="admin-login-error" style={{ marginTop: 16 }}>{error}</div>}

                    <div className="admin-form-actions">
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <Link href="/admin/addons" className="btn-secondary">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
