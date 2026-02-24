'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeliveryDriver } from '@/types';
import { useAllActiveDeliveries } from '@/hooks/useAllActiveDeliveries';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/map/DeliveryMap'), { ssr: false });

export default function AdminEntregadoresPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user?.email === 'gustavo@fruitamix.com') {
            router.replace('/admin/orders');
        }
    }, [user, router]);

    if (user?.email === 'gustavo@fruitamix.com') {
        return null;
    }
    const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { deliveries } = useAllActiveDeliveries();

    const fetchDrivers = async () => {
        const res = await fetch('/api/admin/entregadores');
        const data = await res.json();
        setDrivers(data.drivers || []);
        setLoading(false);
    };

    useEffect(() => { fetchDrivers(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        const res = await fetch('/api/admin/entregadores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Erro ao criar entregador');
            setSaving(false);
            return;
        }

        setSuccess(`Entregador criado! Código de acesso: ${data.driver.access_code}`);
        setName('');
        setPhone('');
        setShowForm(false);
        setSaving(false);
        fetchDrivers();
    };

    const handleToggle = async (id: string, active: boolean) => {
        await fetch(`/api/admin/entregadores/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !active }),
        });
        fetchDrivers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este entregador?')) return;
        await fetch(`/api/admin/entregadores/${id}`, { method: 'DELETE' });
        fetchDrivers();
    };

    const defaultCenter: [number, number] = deliveries.length > 0
        ? [deliveries[0].location.lat, deliveries[0].location.lng]
        : [-15.7801, -47.9292];

    const markers = deliveries.map(d => ({
        id: d.orderId,
        position: [d.location.lat, d.location.lng] as [number, number],
        label: d.driver_name,
    }));

    if (loading) return <div className="admin-loading">Carregando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Entregadores</h1>
                <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'auto', marginTop: 0 }}
                    onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                >
                    <PlusIcon size={18} color="#fff" /> Novo Entregador
                </button>
            </div>

            {success && (
                <div style={{
                    background: '#e8f8ef',
                    color: 'var(--success)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: 16,
                }}>
                    {success}
                </div>
            )}

            {showForm && (
                <div className="admin-form-card" style={{ marginBottom: 24 }}>
                    <form onSubmit={handleCreate}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="driver-name">Nome</label>
                                <input
                                    id="driver-name"
                                    type="text"
                                    className="form-input"
                                    placeholder="Nome do entregador"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="driver-phone">Telefone</label>
                                <input
                                    id="driver-phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="(00) 00000-0000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="admin-login-error" style={{ marginTop: 16 }}>{error}</div>}

                        <div className="admin-form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Criando...' : 'Criar Entregador'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {deliveries.length > 0 && (
                <div className="admin-delivery-map-section">
                    <h3 className="admin-section-subtitle">
                        <span className="admin-live-dot" />
                        Entregas ativas ({deliveries.length})
                    </h3>
                    <div className="admin-delivery-map-wrapper">
                        <DeliveryMap
                            center={defaultCenter}
                            zoom={13}
                            className="admin-delivery-map"
                            markers={markers}
                        />
                    </div>
                </div>
            )}

            <div className="admin-drivers-list">
                {drivers.map(driver => (
                    <div key={driver.id} className="admin-driver-card">
                        <div className="admin-driver-info">
                            <div className="admin-driver-avatar">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div>
                                <div className="admin-driver-name">{driver.name}</div>
                                <div className="admin-driver-phone">{driver.phone}</div>
                            </div>
                        </div>
                        <div className="admin-driver-stats">
                            <div className="admin-driver-code">
                                <span className="admin-driver-code-label">Código</span>
                                <span className="admin-driver-code-value">{driver.access_code}</span>
                            </div>
                            <div className="admin-driver-deliveries">
                                <span className="admin-driver-deliveries-count">{driver.total_deliveries}</span>
                                <span className="admin-driver-deliveries-label">entregas</span>
                            </div>
                            <span className={`badge ${driver.active ? 'badge-success' : 'badge-danger'}`}>
                                {driver.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                        <div className="admin-driver-actions">
                            <button
                                className={`admin-btn-icon ${driver.active ? '' : 'success'}`}
                                onClick={() => handleToggle(driver.id, driver.active)}
                                title={driver.active ? 'Desativar' : 'Ativar'}
                            >
                                {driver.active ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                )}
                            </button>
                            <button
                                className="admin-btn-icon danger"
                                onClick={() => handleDelete(driver.id)}
                                title="Excluir"
                            >
                                <TrashIcon size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
