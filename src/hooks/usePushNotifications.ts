'use client';

import { useState, useEffect, useCallback } from 'react';

type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<PushPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPermission('unsupported');
            setLoading(false);
            return;
        }

        setPermission(Notification.permission as PushPermission);

        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub);
                setLoading(false);
            });
        });

        // Register SW early
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, []);

    const subscribe = useCallback(async () => {
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm as PushPermission);
            if (perm !== 'granted') return false;

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
            });

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            });

            if (res.ok) {
                setIsSubscribed(true);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Push subscription error:', err);
            return false;
        }
    }, []);

    return { permission, isSubscribed, loading, subscribe };
}
