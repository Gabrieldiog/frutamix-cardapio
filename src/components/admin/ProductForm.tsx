'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';
import ImageUpload from './ImageUpload';

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

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data.categories || []));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setImageError('');

        if (!name.trim()) { setError('Nome é obrigatório'); return; }
        if (!price || parseFloat(price) <= 0) { setError('Preço inválido'); return; }
        if (!categoryId) { setError('Selecione uma categoria'); return; }

        // Image is required for new products
        if (!product && !imageFile) {
            setImageError('Foto é obrigatória');
            return;
        }

        try {
            let imageUrl = product?.image_url || '';
            let oldImagePath: string | undefined;

            // Upload new image if selected
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

                // If editing and replacing image, track old path for deletion
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
