'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AddonGroup } from '@/types';
import { PlusIcon } from '@/components/Icons';
import { EditIcon } from '@/components/admin/AdminIcons';
import { TrashIcon } from '@/components/Icons';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function AdminAddonsPage() {
    const [groups, setGroups] = useState<AddonGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<AddonGroup | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchGroups = async () => {
        const res = await fetch('/api/admin/addons');
        const data = await res.json();
        setGroups(data.groups || []);
        setLoading(false);
    };

    useEffect(() => { fetchGroups(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        const res = await fetch(`/api/admin/addons/${deleteTarget.id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao excluir');
            setDeleting(false);
            return;
        }

        setDeleteTarget(null);
        setDeleting(false);
        fetchGroups();
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Adicionais</h1>
                <Link href="/admin/addons/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlusIcon size={18} color="#fff" /> Novo Grupo
                </Link>
            </div>

            {groups.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-text">Nenhum grupo de adicionais cadastrado</div>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Grupo</th>
                                <th>Itens</th>
                                <th style={{ width: 100 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map(group => (
                                <tr key={group.id}>
                                    <td data-label="Grupo"><strong>{group.name}</strong></td>
                                    <td data-label="Itens">
                                        {group.addon_items && group.addon_items.length > 0
                                            ? group.addon_items.map(item => item.name).join(', ')
                                            : <span style={{ color: 'var(--text-muted)' }}>Nenhum item</span>
                                        }
                                    </td>
                                    <td data-label="">
                                        <div className="admin-table-actions">
                                            <Link href={`/admin/addons/${group.id}/edit`} className="admin-btn-icon">
                                                <EditIcon size={16} />
                                            </Link>
                                            <button
                                                className="admin-btn-icon danger"
                                                onClick={() => setDeleteTarget(group)}
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
                    title="Excluir Grupo"
                    message={`Tem certeza que deseja excluir "${deleteTarget.name}"? Todos os itens deste grupo serão removidos.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
        </>
    );
}
