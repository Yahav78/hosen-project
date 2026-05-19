import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';
import {
    buildGovMapEmbedUrl,
    GOVMAP_LAYER_HOSPITALS,
    GOVMAP_LAYER_SHELTERS
} from '../utils/govmap';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

type MapTab = 'family' | 'facilities';

function escapeHtml(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const MapView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('he');
    const mapRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapTab, setMapTab] = useState<MapTab>('family');
    const [showShelters, setShowShelters] = useState(true);
    const [showHospitals, setShowHospitals] = useState(true);
    const watchIdRef = useRef<number | null>(null);
    const leafletMapRef = useRef<any>(null);

    const govMapLayers = useMemo(() => {
        const layers: string[] = [];
        if (showShelters) layers.push(GOVMAP_LAYER_SHELTERS);
        if (showHospitals) layers.push(GOVMAP_LAYER_HOSPITALS);
        return layers;
    }, [showShelters, showHospitals]);

    const govMapUrl = useMemo(
        () =>
            buildGovMapEmbedUrl({
                lat: coords?.lat,
                lng: coords?.lng,
                layers: govMapLayers.length > 0 ? govMapLayers : [GOVMAP_LAYER_SHELTERS],
                zoom: 7
            }),
        [coords, govMapLayers]
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
            watchIdRef.current = navigator.geolocation.watchPosition(
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
                    setCoords({ lat: 31.0461, lng: 34.8516 });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLoading(false);
            setCoords({ lat: 31.0461, lng: 34.8516 });
        }

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
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (mapTab !== 'family' || !coords || !mapRef.current) return;

        const loadLeaflet = () => {
            if (document.getElementById('leaflet-js')) {
                initializeMap();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = initializeMap;
            document.body.appendChild(script);
        };

        const initializeMap = () => {
            const L = (window as any).L;
            if (!L || !mapRef.current) return;

            if (!leafletMapRef.current) {
                leafletMapRef.current = L.map(mapRef.current).setView([coords.lat, coords.lng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: t('map_osm_attrib')
                }).addTo(leafletMapRef.current);
            } else {
                leafletMapRef.current.setView([coords.lat, coords.lng]);
                leafletMapRef.current.invalidateSize();
            }

            const map = leafletMapRef.current;

            map.eachLayer((layer: any) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            L.marker([coords.lat, coords.lng])
                .addTo(map)
                .bindPopup(t('you_are_here', 'You are here 📍'))
                .openPopup();

            familyMembers.forEach((member: any) => {
                if (member.location?.lat && member.location?.lng) {
                    const statusLbl = escapeHtml(t('map_popup_status'));
                    const tooltip = `<b>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</b><br>${statusLbl}: ${escapeHtml(String(member.status || ''))}`;
                    L.marker([member.location.lat, member.location.lng]).addTo(map).bindPopup(tooltip);
                }
            });
        };

        loadLeaflet();
    }, [coords, familyMembers, t, i18n.language, mapTab]);

    const tabBtnStyle = (active: boolean): React.CSSProperties => ({
        flex: 1,
        padding: '0.65rem 1rem',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        background: active ? 'var(--primary-color)' : 'rgba(15, 23, 42, 0.5)',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    });

    return (
        <div
            className="page-shell map-page"
            style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <AppToolbar />
            <div
                className="glass-panel map-panel-container"
                style={{
                    padding: 'clamp(1rem, 4vw, 2rem)',
                    marginTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📍 {t('map_title')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t('map_desc')}</p>

                <div
                    className="map-tab-row"
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        flexDirection: isRtl ? 'row-reverse' : 'row'
                    }}
                >
                    <button type="button" style={tabBtnStyle(mapTab === 'family')} onClick={() => setMapTab('family')}>
                        {t('map_tab_family')}
                    </button>
                    <button
                        type="button"
                        style={tabBtnStyle(mapTab === 'facilities')}
                        onClick={() => setMapTab('facilities')}
                    >
                        {t('map_tab_facilities')}
                    </button>
                </div>

                {mapTab === 'facilities' && (
                    <div
                        className="map-layer-toggles"
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            marginBottom: '1rem',
                            flexDirection: isRtl ? 'row-reverse' : 'row'
                        }}
                    >
                        <label className="map-layer-toggle">
                            <input
                                type="checkbox"
                                checked={showShelters}
                                onChange={(e) => setShowShelters(e.target.checked)}
                            />
                            <span>🛡️ {t('map_layer_shelters')}</span>
                        </label>
                        <label className="map-layer-toggle">
                            <input
                                type="checkbox"
                                checked={showHospitals}
                                onChange={(e) => setShowHospitals(e.target.checked)}
                            />
                            <span>🏥 {t('map_layer_hospitals')}</span>
                        </label>
                    </div>
                )}

                {loading ? (
                    <p style={{ textAlign: 'center', marginTop: '2rem' }}>{t('retrieving_gps')}</p>
                ) : mapTab === 'family' ? (
                    <div
                        ref={mapRef}
                        className="map-canvas"
                        style={{
                            flex: 1,
                            minHeight: 'min(55vh, 480px)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            zIndex: 1
                        }}
                    />
                ) : (
                    <div className="map-govmap-wrap">
                        {govMapLayers.length === 0 ? (
                            <p className="map-govmap-hint">{t('map_select_one_layer')}</p>
                        ) : (
                            <iframe
                                key={govMapUrl}
                                title={t('map_govmap_title')}
                                src={govMapUrl}
                                className="map-govmap-iframe"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        )}
                        <p className="map-govmap-hint">{t('map_govmap_hint')}</p>
                        <a
                            href={govMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-govmap-link"
                        >
                            {t('map_open_govmap')} ↗
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapView;
