'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { PlusIcon } from '@/components/Icons';
import { EditIcon } from '@/components/admin/AdminIcons';
import { TrashIcon } from '@/components/Icons';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCategories = async () => {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        setCategories(data.categories || []);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao excluir');
            setDeleting(false);
            return;
        }

        setDeleteTarget(null);
        setDeleting(false);
        fetchCategories();
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Categorias</h1>
                <Link href="/admin/categories/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlusIcon size={18} color="#fff" /> Nova Categoria
                </Link>
            </div>

            {categories.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-text">Nenhuma categoria cadastrada</div>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Ordem</th>
                                <th style={{ width: 100 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td data-label="Nome"><strong>{cat.name}</strong></td>
                                    <td data-label="Ordem">{cat.display_order}</td>
                                    <td data-label="">
                                        <div className="admin-table-actions">
                                            <Link href={`/admin/categories/${cat.id}/edit`} className="admin-btn-icon">
                                                <EditIcon size={16} />
                                            </Link>
                                            <button
                                                className="admin-btn-icon danger"
                                                onClick={() => setDeleteTarget(cat)}
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
                    title="Excluir Categoria"
                    message={`Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
        </>
    );
}
