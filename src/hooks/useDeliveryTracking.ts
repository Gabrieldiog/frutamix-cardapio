'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { DeliveryTracking } from '@/types';

interface UseDeliveryTrackingReturn {
    tracking: DeliveryTracking | null;
    loading: boolean;
}

export function useDeliveryTracking(orderId: string | null): UseDeliveryTrackingReturn {
    const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const deliveryRef = ref(db, `deliveries/${orderId}`);

        const unsubscribe = onValue(deliveryRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.active) {
                setTracking({
                    driver_id: data.driver_id || '',
                    driver_name: data.driver_name || 'Entregador',
                    location: {
                        lat: data.location?.lat || 0,
                        lng: data.location?.lng || 0,
                        timestamp: data.location?.timestamp || Date.now(),
                    },
                    active: data.active,
                });
            } else {
                setTracking(null);
            }
            setLoading(false);
        });

        return () => {
            off(deliveryRef);
            unsubscribe();
        };
    }, [orderId]);

    return { tracking, loading };
}
