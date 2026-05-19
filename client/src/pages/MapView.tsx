import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';
import { buildGovMapEmbedUrl, distanceKm, roundCoords } from '../utils/govmap';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

function escapeHtml(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function statusColor(status: string): string {
    if (status === 'safe') return '#22c55e';
    if (status === 'in-danger') return '#ef4444';
    return '#94a3b8';
}

const MapView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('he');
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const stableCenter = mapCenter ?? (coords ? roundCoords(coords) : null);

    const govMapUrl = useMemo(
        () =>
            buildGovMapEmbedUrl({
                lat: stableCenter?.lat,
                lng: stableCenter?.lng
            }),
        [stableCenter]
    );

    useEffect(() => {
        const fetchFamily = async () => {
            try {
                const res = await axios.get(`${API_URL}/family`);
                if (res.data) {
                    const withLocation = res.data
                        .map((m: any) => m.user)
                        .filter((u: any) => u && u.location?.lat && u.location?.lng);
                    setFamilyMembers(withLocation);
                }
            } catch (err) {
                console.error('Failed to fetch family locations:', err);
            }
        };

        fetchFamily();

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newCoords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCoords(newCoords);
                    setLoading(false);
                    axios.post(`${API_URL}/auth/location`, newCoords).catch((err) =>
                        console.error('Update location failed:', err)
                    );
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLoading(false);
                    const fallback = { lat: 31.0461, lng: 34.8516 };
                    setCoords(fallback);
                    setMapCenter(roundCoords(fallback));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }

        setLoading(false);
        const fallback = { lat: 31.0461, lng: 34.8516 };
        setCoords(fallback);
        setMapCenter(roundCoords(fallback));
    }, []);

    useEffect(() => {
        if (coords && !mapCenter) {
            setMapCenter(roundCoords(coords));
        }
    }, [coords, mapCenter]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socket.on('locationUpdated', (data: any) => {
            setFamilyMembers((prev: any[]) => {
                const exists = prev.some((m: any) => m._id === data.userId);
                if (exists) {
                    return prev.map((m: any) =>
                        m._id === data.userId ? { ...m, location: data.location } : m
                    );
                }
                return prev;
            });
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!coords || !mapRef.current) return;

        const loadLeaflet = () => {
            if (document.getElementById('leaflet-js')) {
                updateMap();
                return;
            }

            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = updateMap;
            document.body.appendChild(script);
        };

        const updateMap = () => {
            const L = (window as any).L;
            if (!L || !mapRef.current) return;

            const view = stableCenter ?? coords;

            if (!leafletMapRef.current) {
                leafletMapRef.current = L.map(mapRef.current).setView([view.lat, view.lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: t('map_osm_attrib')
                }).addTo(leafletMapRef.current);
                markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
            } else {
                leafletMapRef.current.setView([view.lat, view.lng], 15);
                leafletMapRef.current.invalidateSize();
            }

            const group = markersLayerRef.current;
            if (!group) return;
            group.clearLayers();

            const youIcon = L.divIcon({
                className: 'map-marker-pin map-marker-pin--you',
                html: '<span class="map-marker-pin-wrap"><span class="map-marker-pin-pulse"></span><span class="map-marker-pin-core"></span></span>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            L.marker([coords.lat, coords.lng], { icon: youIcon, zIndexOffset: 1000 })
                .addTo(group)
                .bindPopup(`<b>${escapeHtml(t('you_are_here'))}</b>`)
                .openPopup();

            L.circle([coords.lat, coords.lng], {
                radius: 80,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 2
            }).addTo(group);

            familyMembers.forEach((member: any) => {
                if (!member.location?.lat || !member.location?.lng) return;
                const color = statusColor(member.status);
                const icon = L.divIcon({
                    className: 'map-marker-pin map-marker-pin--family',
                    html: `<span class="map-marker-pin-core" style="background:${color}"></span>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                const statusLbl = escapeHtml(t('map_popup_status'));
                const dist = distanceKm(coords, member.location);
                const distTxt =
                    dist < 1
                        ? t('map_distance_m', { m: Math.round(dist * 1000) })
                        : t('map_distance_km', { km: dist.toFixed(1) });
                const popup = `<b>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</b><br>${statusLbl}: ${escapeHtml(String(member.status || ''))}<br>${escapeHtml(distTxt)}`;
                L.marker([member.location.lat, member.location.lng], { icon }).addTo(group).bindPopup(popup);
            });
        };

        loadLeaflet();
    }, [coords, familyMembers, stableCenter, t, i18n.language]);

    const refreshMapCenter = () => {
        if (!coords) return;
        const rounded = roundCoords(coords);
        setMapCenter(rounded);
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([rounded.lat, rounded.lng], 15);
        }
    };

    return (
        <div
            className="page-shell map-page"
            style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <AppToolbar />
            <div className="glass-panel map-panel-container map-panel-unified">
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📍 {t('map_title')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t('map_desc_unified')}</p>

                <div className="map-legend">
                    <span className="map-legend-item">
                        <span className="map-legend-dot map-legend-dot--you" /> {t('map_legend_you')}
                    </span>
                    <span className="map-legend-item">
                        <span className="map-legend-dot map-legend-dot--family" /> {t('map_legend_family')}
                    </span>
                    <span className="map-legend-item">
                        <span className="map-legend-dot map-legend-dot--govmap" /> {t('map_legend_govmap')}
                    </span>
                </div>

                {loading ? (
                    <p className="map-loading">{t('retrieving_gps')}</p>
                ) : (
                    <div className="map-stack">
                        <div ref={mapRef} className="map-leaflet-canvas" />

                        <p className="map-govmap-section-title">{t('map_govmap_section_title')}</p>
                        <div className="map-unified map-unified--govmap">
                            <iframe
                                key={govMapUrl}
                                title={t('map_govmap_title')}
                                src={govMapUrl}
                                className="map-unified-iframe"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                )}

                {!loading && coords && (
                    <button type="button" className="map-refresh-center" onClick={refreshMapCenter}>
                        {t('map_refresh_location')}
                    </button>
                )}

                <p className="map-govmap-hint">{t('map_unified_hint')}</p>
                <a
                    href={govMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-govmap-link"
                >
                    {t('map_open_govmap')} ↗
                </a>
            </div>
        </div>
    );
};

export default MapView;
