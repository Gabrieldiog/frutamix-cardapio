'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { DeliveryTracking } from '@/types';

interface ActiveDelivery extends DeliveryTracking {
    orderId: string;
}

export function useAllActiveDeliveries(): { deliveries: ActiveDelivery[]; loading: boolean } {
    const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const deliveriesRef = ref(db, 'deliveries');

        const unsubscribe = onValue(deliveriesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setDeliveries([]);
                setLoading(false);
                return;
            }

            const active: ActiveDelivery[] = [];
            for (const [orderId, delivery] of Object.entries(data)) {
                const d = delivery as Record<string, unknown>;
                if (d.active && d.location) {
                    const loc = d.location as { lat: number; lng: number; timestamp: number };
                    active.push({
                        orderId,
                        driver_id: (d.driver_id as string) || '',
                        driver_name: (d.driver_name as string) || 'Entregador',
                        location: {
                            lat: loc.lat || 0,
                            lng: loc.lng || 0,
                            timestamp: loc.timestamp || Date.now(),
                        },
                        active: true,
                    });
                }
            }
            setDeliveries(active);
            setLoading(false);
        });

        return () => {
            off(deliveriesRef);
            unsubscribe();
        };
    }, []);

    return { deliveries, loading };
}
