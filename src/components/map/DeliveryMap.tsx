'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MarkerData {
    id: string;
    position: [number, number];
    label?: string;
    type?: 'driver' | 'client';
}

interface DeliveryMapProps {
    center: [number, number];
    zoom?: number;
    className?: string;
    markers?: MarkerData[];
    fitBounds?: boolean;
}

const DRIVER_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
  <circle cx="32" cy="32" r="30" fill="#6C5CE7" stroke="#fff" stroke-width="3"/>
  <path d="M20 36l4-12h10l2 6h8l-2 6H20z" fill="#fff"/>
  <circle cx="24" cy="40" r="3" fill="#fff" stroke="#6C5CE7" stroke-width="2"/>
  <circle cx="40" cy="40" r="3" fill="#fff" stroke="#6C5CE7" stroke-width="2"/>
</svg>`;

const CLIENT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56" width="32" height="44">
  <path d="M20 0C9 0 0 9 0 20c0 15 20 36 20 36s20-21 20-36C40 9 31 0 20 0z" fill="#E74C3C" stroke="#fff" stroke-width="2"/>
  <circle cx="20" cy="18" r="8" fill="#fff"/>
  <circle cx="20" cy="18" r="5" fill="#E74C3C"/>
</svg>`;

function createDriverIcon() {
    return L.divIcon({
        html: DRIVER_ICON_SVG,
        className: 'delivery-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
}

function createClientIcon() {
    return L.divIcon({
        html: CLIENT_ICON_SVG,
        className: 'delivery-marker-icon client-marker',
        iconSize: [32, 44],
        iconAnchor: [16, 44],
    });
}

function DeliveryMapInner({ center, zoom = 15, className, markers = [], fitBounds = false }: DeliveryMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const animFrameRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            center,
            zoom,
            zoomControl: true,
            attributionControl: false,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        L.control.attribution({ prefix: false, position: 'bottomright' })
            .addAttribution('© <a href="https://osm.org">OpenStreetMap</a>')
            .addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersRef.current.clear();
            animFrameRef.current.forEach(id => cancelAnimationFrame(id));
            animFrameRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;
        if (!fitBounds) {
            mapInstanceRef.current.setView(center, undefined, { animate: true });
        }
    }, [center, fitBounds]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const currentIds = new Set(markers.map(m => m.id));

        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                map.removeLayer(marker);
                markersRef.current.delete(id);
                const af = animFrameRef.current.get(id);
                if (af) {
                    cancelAnimationFrame(af);
                    animFrameRef.current.delete(id);
                }
            }
        });

        for (const m of markers) {
            const icon = m.type === 'client' ? createClientIcon() : createDriverIcon();
            const existing = markersRef.current.get(m.id);

            if (existing) {
                const currentLatLng = existing.getLatLng();
                const targetLat = m.position[0];
                const targetLng = m.position[1];

                if (m.type !== 'client') {
                    existing.setIcon(icon);
                }

                if (Math.abs(currentLatLng.lat - targetLat) > 0.00001 ||
                    Math.abs(currentLatLng.lng - targetLng) > 0.00001) {
                    if (m.type === 'client') {
                        existing.setLatLng(m.position);
                    } else {
                        animateMarker(m.id, existing, currentLatLng, L.latLng(targetLat, targetLng));
                    }
                }

                if (m.label) {
                    existing.unbindTooltip();
                    existing.bindTooltip(m.label, {
                        permanent: true,
                        direction: 'top',
                        offset: m.type === 'client' ? [0, -48] : [0, -25],
                        className: m.type === 'client' ? 'client-marker-tooltip' : 'delivery-marker-tooltip',
                    });
                }
            } else {
                const marker = L.marker(m.position, { icon }).addTo(map);
                if (m.label) {
                    marker.bindTooltip(m.label, {
                        permanent: true,
                        direction: 'top',
                        offset: m.type === 'client' ? [0, -48] : [0, -25],
                        className: m.type === 'client' ? 'client-marker-tooltip' : 'delivery-marker-tooltip',
                    });
                }
                markersRef.current.set(m.id, marker);
            }
        }

        if (fitBounds && markers.length >= 2) {
            const bounds = L.latLngBounds(markers.map(m => m.position));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [markers, fitBounds]);

    function animateMarker(id: string, marker: L.Marker, from: L.LatLng, to: L.LatLng) {
        const existingAf = animFrameRef.current.get(id);
        if (existingAf) cancelAnimationFrame(existingAf);

        const duration = 1000;
        const start = performance.now();

        function step(now: number) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = t * (2 - t);

            const lat = from.lat + (to.lat - from.lat) * eased;
            const lng = from.lng + (to.lng - from.lng) * eased;
            marker.setLatLng([lat, lng]);

            if (t < 1) {
                const af = requestAnimationFrame(step);
                animFrameRef.current.set(id, af);
            } else {
                animFrameRef.current.delete(id);
            }
        }

        const af = requestAnimationFrame(step);
        animFrameRef.current.set(id, af);
    }

    return <div ref={mapRef} className={`delivery-map ${className || ''}`} />;
}

export default function DeliveryMap(props: DeliveryMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={`delivery-map delivery-map-loading ${props.className || ''}`}>
                <div className="loading-spinner" />
                <span>Carregando mapa...</span>
            </div>
        );
    }

    return <DeliveryMapInner {...props} />;
}
