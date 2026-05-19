import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';
import { buildGovMapEmbedUrl, distanceKm, roundCoords } from '../utils/govmap';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

function statusColor(status: string): string {
    if (status === 'safe') return '#22c55e';
    if (status === 'in-danger') return '#ef4444';
    return '#94a3b8';
}

const MapView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('he');
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
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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

    const openInMaps = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
    };

    const refreshMapCenter = () => {
        if (coords) setMapCenter(roundCoords(coords));
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
                    <div className="map-unified">
                        <iframe
                            key={govMapUrl}
                            title={t('map_govmap_title')}
                            src={govMapUrl}
                            className="map-unified-iframe"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />

                        <div className="map-family-bar-wrap">
                            <div className="map-family-bar" role="list">
                                {coords && (
                                    <button
                                        type="button"
                                        className="map-family-chip map-family-chip--you"
                                        onClick={() => openInMaps(coords.lat, coords.lng)}
                                    >
                                        <span
                                            className="map-family-chip-dot"
                                            style={{ background: statusColor('safe') }}
                                        />
                                        <span className="map-family-chip-name">{t('you_are_here')}</span>
                                    </button>
                                )}
                                {familyMembers.map((member: any) => {
                                    const dist =
                                        coords && member.location
                                            ? distanceKm(coords, member.location)
                                            : null;
                                    return (
                                        <button
                                            key={member._id}
                                            type="button"
                                            className="map-family-chip"
                                            role="listitem"
                                            onClick={() =>
                                                openInMaps(member.location.lat, member.location.lng)
                                            }
                                        >
                                            <span
                                                className="map-family-chip-dot"
                                                style={{ background: statusColor(member.status) }}
                                            />
                                            <span className="map-family-chip-name">
                                                {member.firstName} {member.lastName}
                                            </span>
                                            {dist != null && (
                                                <span className="map-family-chip-dist">
                                                    {dist < 1
                                                        ? t('map_distance_m', {
                                                              m: Math.round(dist * 1000)
                                                          })
                                                        : t('map_distance_km', { km: dist.toFixed(1) })}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                {familyMembers.length === 0 && (
                                    <span className="map-family-empty">{t('map_no_family_locations')}</span>
                                )}
                            </div>
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
