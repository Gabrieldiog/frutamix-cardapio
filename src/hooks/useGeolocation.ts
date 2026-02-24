'use client';

import { useState, useEffect, useRef } from 'react';

interface Position {
    lat: number;
    lng: number;
}

interface UseGeolocationReturn {
    position: Position | null;
    error: string | null;
}

export function useGeolocation(enabled: boolean): UseGeolocationReturn {
    const [position, setPosition] = useState<Position | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocalização não suportada neste navegador');
            return;
        }

        setError(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setError(null);
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Permissão de localização negada. Ative nas configurações do navegador.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Localização indisponível');
                        break;
                    case err.TIMEOUT:
                        setError('Tempo esgotado ao obter localização');
                        break;
                    default:
                        setError('Erro ao obter localização');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [enabled]);

    return { position, error };
}
