'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

interface ClientLocation {
    lat: number;
    lng: number;
    timestamp: number;
    active: boolean;
}

export function useClientLocation(orderId: string | null): ClientLocation | null {
    const [location, setLocation] = useState<ClientLocation | null>(null);

    useEffect(() => {
        if (!orderId) {
            setLocation(null);
            return;
        }

        const clientRef = ref(db, `client_locations/${orderId}`);
        const unsubscribe = onValue(clientRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.active) {
                setLocation(data);
            } else {
                setLocation(null);
            }
        });

        return () => {
            off(clientRef);
        };
    }, [orderId]);

    return location;
}
