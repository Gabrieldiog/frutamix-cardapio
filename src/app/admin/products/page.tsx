'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductWithCategory } from '@/types';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import { EditIcon, ImageIcon } from '@/components/admin/AdminIcons';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(data.products || []);
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao excluir');
            setDeleting(false);
            return;
        }

        setDeleteTarget(null);
        setDeleting(false);
        fetchProducts();
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Produtos</h1>
                <Link href="/admin/products/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlusIcon size={18} color="#fff" /> Novo Produto
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-text">Nenhum produto cadastrado</div>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Foto</th>
                                <th>Nome</th>
                                <th>Categoria</th>
                                <th>Preço</th>
                                <th>Status</th>
                                <th style={{ width: 100 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td data-label="Foto">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="admin-table-image" />
                                        ) : (
                                            <div className="admin-table-image-placeholder">
                                                <ImageIcon size={20} color="var(--text-light)" />
                                            </div>
                                        )}
                                    </td>
                                    <td data-label="Nome"><strong>{product.name}</strong></td>
                                    <td data-label="Categoria">{product.categories?.name || '—'}</td>
                                    <td data-label="Preço">{formatPrice(product.price)}</td>
                                    <td data-label="Status">
                                        <span className={`badge ${product.available ? 'badge-success' : 'badge-danger'}`}>
                                            {product.available ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td data-label="">
                                        <div className="admin-table-actions">
                                            <Link href={`/admin/products/${product.id}/edit`} className="admin-btn-icon">
                                                <EditIcon size={16} />
                                            </Link>
                                            <button
                                                className="admin-btn-icon danger"
                                                onClick={() => setDeleteTarget(product)}
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    title="Excluir Produto"
                    message={`Tem certeza que deseja excluir "${deleteTarget.name}"? A foto será deletada e esta ação não pode ser desfeita.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
        </>
    );
}
