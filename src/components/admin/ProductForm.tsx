'use client';

import { useState, useEffect } from 'react';
import { Product, Category, AddonGroup } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';
import ImageUpload from './ImageUpload';

interface SelectedGroup {
    group_id: string;
    free_addon_limit: string;
}

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: {
        name: string;
        description: string;
        price: number;
        category_id: string;
        available: boolean;
        image_url: string;
        old_image_path?: string;
        addon_groups?: { group_id: string; free_addon_limit: number }[];
    }) => Promise<void>;
    isLoading: boolean;
}

export default function ProductForm({ product, onSubmit, isLoading }: ProductFormProps) {
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [categoryId, setCategoryId] = useState(product?.category_id || '');
    const [available, setAvailable] = useState(product?.available !== false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState('');

    // Addon groups
    const [allGroups, setAllGroups] = useState<AddonGroup[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<SelectedGroup[]>([]);

    // Load categories and addon groups
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []));

        fetch('/api/admin/addons')
            .then(res => res.json())
            .then(data => setAllGroups(data.groups || []));
    }, []);

    // Load existing product addon groups when editing
    useEffect(() => {
        if (product?.product_addon_groups && product.product_addon_groups.length > 0) {
            setSelectedGroups(product.product_addon_groups.map(pag => ({
                group_id: pag.group_id,
                free_addon_limit: pag.free_addon_limit.toString(),
            })));
        }
    }, [product]);

    const toggleGroup = (groupId: string) => {
        setSelectedGroups(prev => {
            const exists = prev.find(g => g.group_id === groupId);
            if (exists) {
                return prev.filter(g => g.group_id !== groupId);
            }
            return [...prev, { group_id: groupId, free_addon_limit: '0' }];
        });
    };

    const updateGroupLimit = (groupId: string, value: string) => {
        setSelectedGroups(prev =>
            prev.map(g => g.group_id === groupId ? { ...g, free_addon_limit: value } : g)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setImageError('');

        if (!name.trim()) { setError('Nome é obrigatório'); return; }
        if (!price || parseFloat(price) <= 0) { setError('Preço inválido'); return; }
        if (!categoryId) { setError('Selecione uma categoria'); return; }

        if (!product && !imageFile) {
            setImageError('Foto é obrigatória');
            return;
        }

        try {
            let imageUrl = product?.image_url || '';
            let oldImagePath: string | undefined;

            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.error || 'Erro no upload da imagem');
                }

                const uploadData = await uploadRes.json();

                if (product?.image_url) {
                    const marker = '/storage/v1/object/public/product-images/';
                    const idx = product.image_url.indexOf(marker);
                    if (idx !== -1) {
                        oldImagePath = product.image_url.substring(idx + marker.length);
                    }
                }

                imageUrl = uploadData.url;
            }

            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                category_id: categoryId,
                available,
                image_url: imageUrl,
                old_image_path: oldImagePath,
                addon_groups: selectedGroups.map(g => ({
                    group_id: g.group_id,
                    free_addon_limit: parseInt(g.free_addon_limit) || 0,
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
                    <Link href="/admin/products" className="admin-btn-icon">
                        <ArrowLeftIcon size={20} />
                    </Link>
                    <h1 className="admin-page-title">
                        {product ? 'Editar Produto' : 'Novo Produto'}
                    </h1>
                </div>
            </div>

            <div className="admin-form-card">
                <form onSubmit={handleSubmit}>
                    <ImageUpload
                        currentImageUrl={product?.image_url}
                        onFileSelect={setImageFile}
                        error={imageError}
                    />

                    <div className="admin-form-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-name">Nome *</label>
                            <input
                                id="prod-name"
                                type="text"
                                className="form-input"
                                placeholder="Ex: Açaí 500ml"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-price">Preço *</label>
                            <input
                                id="prod-price"
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-category">Categoria *</label>
                            <select
                                id="prod-category"
                                className="form-input"
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Disponível</label>
                            <button
                                type="button"
                                className={`toggle-switch ${available ? 'active' : ''}`}
                                onClick={() => setAvailable(!available)}
                                style={{ marginTop: 4 }}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="prod-desc">Descrição</label>
                            <textarea
                                id="prod-desc"
                                className="form-input form-textarea"
                                placeholder="Descrição do produto..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Addon Groups Section */}
                    {allGroups.length > 0 && (
                        <div className="addons-section">
                            <label className="form-label">Grupos de Adicionais</label>
                            <div className="addon-groups-select">
                                {allGroups.map(group => {
                                    const isSelected = selectedGroups.some(g => g.group_id === group.id);
                                    const selectedGroup = selectedGroups.find(g => g.group_id === group.id);
                                    const itemNames = group.addon_items?.map(i => i.name).join(', ') || '';
                                    return (
                                        <div key={group.id} className={`addon-group-card ${isSelected ? 'selected' : ''}`}>
                                            <div className="addon-group-card-header" onClick={() => toggleGroup(group.id)}>
                                                <div className={`modal-addon-checkbox ${isSelected ? 'checked' : ''}`} />
                                                <div className="addon-group-card-info">
                                                    <strong>{group.name}</strong>
                                                    {itemNames && <span className="addon-group-card-items">{itemNames}</span>}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="addon-group-card-limit">
                                                    <label className="form-label">Gratuitos:</label>
                                                    <input
                                                        type="number"
                                                        className="form-input addon-max-input"
                                                        placeholder="0"
                                                        min="0"
                                                        value={selectedGroup?.free_addon_limit || '0'}
                                                        onChange={e => updateGroupLimit(group.id, e.target.value)}
                                                    />
                                                    <span className="addon-max-hint">0 = todos pagos</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && <div className="admin-login-error" style={{ marginTop: 16 }}>{error}</div>}

                    <div className="admin-form-actions">
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <Link href="/admin/products" className="btn-secondary">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
