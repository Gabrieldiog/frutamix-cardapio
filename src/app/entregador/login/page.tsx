'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function EntregadorLoginPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/entregador/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_code: code.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Código inválido');
                setLoading(false);
                return;
            }

            localStorage.setItem('frutamix-driver', JSON.stringify(data.driver));
            router.push('/entregador');
        } catch {
            setError('Erro ao conectar. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="driver-login-wrapper">
            <div className="driver-login-card">
                <div className="driver-login-logo">
                    <Image
                        src="/logo.jpg"
                        alt="FrutaMix"
                        width={64}
                        height={64}
                        style={{ borderRadius: '50%' }}
                    />
                    <h1 className="driver-login-title">FrutaMix</h1>
                    <p className="driver-login-subtitle">Painel do Entregador</p>
                </div>

                <form onSubmit={handleSubmit} className="driver-login-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="access-code">Código de Acesso</label>
                        <input
                            id="access-code"
                            type="text"
                            className={`form-input driver-code-input ${error ? 'error' : ''}`}
                            placeholder="Digite seu código"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                            required
                        />
                    </div>

                    {error && <div className="driver-login-error">{error}</div>}

                    <button type="submit" className="btn-primary driver-login-btn" disabled={loading || code.length < 4}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="driver-login-hint">
                    Peça seu código de acesso ao administrador
                </p>
            </div>
        </div>
    );
}
