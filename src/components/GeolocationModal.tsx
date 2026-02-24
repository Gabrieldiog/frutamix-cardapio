'use client';

import { useState } from 'react';

interface GeolocationModalProps {
    theme?: 'light' | 'dark';
    onAllow: () => void;
    onDismiss: () => void;
}

export default function GeolocationModal({ theme = 'light', onAllow, onDismiss }: GeolocationModalProps) {
    const [requesting, setRequesting] = useState(false);

    const handleAllow = async () => {
        setRequesting(true);
        try {
            await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });
            onAllow();
        } catch {
            onAllow();
        }
    };

    const isDark = theme === 'dark';

    return (
        <div className="geo-modal-overlay">
            <div className={`geo-modal-card ${isDark ? 'geo-modal-dark' : ''}`}>
                <div className="geo-modal-icon">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" stroke={isDark ? '#6C5CE7' : 'var(--primary)'} />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={isDark ? '#6C5CE7' : 'var(--primary)'} />
                        <circle cx="12" cy="12" r="8" stroke={isDark ? '#6C5CE7' : 'var(--primary)'} strokeDasharray="4 2" />
                    </svg>
                </div>
                <h3 className="geo-modal-title">Compartilhar localização</h3>
                <p className="geo-modal-text">
                    {isDark
                        ? 'Precisamos da sua localização para enviar seu GPS em tempo real durante as entregas.'
                        : 'Compartilhe sua localização para ver no mapa por onde seu pedido está chegando.'}
                </p>
                <button
                    className="geo-modal-allow-btn"
                    onClick={handleAllow}
                    disabled={requesting}
                >
                    {requesting ? (
                        <>
                            <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                            Obtendo localização...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            Permitir Localização
                        </>
                    )}
                </button>
                <button className="geo-modal-dismiss-btn" onClick={onDismiss}>
                    Agora não
                </button>
            </div>
        </div>
    );
}
