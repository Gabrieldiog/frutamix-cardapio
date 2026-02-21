'use client';

import { useEffect, useState } from 'react';
import { AdminUser } from '@/types';
import { PlusIcon } from '@/components/Icons';
import { UsersIcon } from '@/components/admin/AdminIcons';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Erro ao criar usuário');
            setSaving(false);
            return;
        }

        setSuccess(`Usuário ${data.user.email} criado com sucesso!`);
        setEmail('');
        setPassword('');
        setShowForm(false);
        setSaving(false);
        fetchUsers();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    };

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Usuários Admin</h1>
                <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                >
                    <PlusIcon size={18} color="#fff" /> Novo Usuário
                </button>
            </div>

            {success && (
                <div style={{
                    background: '#e8f8ef',
                    color: 'var(--success)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginBottom: 16,
                }}>
                    {success}
                </div>
            )}

            {showForm && (
                <div className="admin-form-card" style={{ marginBottom: 24 }}>
                    <form onSubmit={handleCreateUser}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-email">Email</label>
                                <input
                                    id="new-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="email@exemplo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-password">Senha</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Mín. 6 caracteres"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && <div className="admin-login-error" style={{ marginTop: 16 }}>{error}</div>}

                        <div className="admin-form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Criando...' : 'Criar Usuário'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {users.map(u => (
                    <div key={u.id} className="admin-user-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <UsersIcon size={20} color="var(--primary)" />
                            <div>
                                <div className="admin-user-email">{u.email}</div>
                                <div className="admin-user-date">Criado em {formatDate(u.created_at)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
