import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

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
    const watchIdRef = useRef<number | null>(null);
    const leafletMapRef = useRef<any>(null); // Save map instance

    useEffect(() => {
        const fetchFamily = async () => {
             try {
                 const res = await axios.get(`${API_URL}/family`);
                 if (res.data) {
                     // Extract populated user object
                     const withLocation = res.data.map((m: any) => m.user).filter((u: any) => u && u.location && u.location.lat && u.location.lng);
                     setFamilyMembers(withLocation);
                 }
             } catch (err) {
                 console.error("Failed to fetch family locations:", err);
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

                    // Update backend
                    axios.post(`${API_URL}/auth/location`, newCoords).catch(err => console.error("Update location failed:", err));
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLoading(false);
                    setCoords({ lat: 31.0461, lng: 34.8516 }); // Default Israel
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
                       return prev.map((m: any) => m._id === data.userId ? { ...m, location: data.location } : m);
                  } else {
                       // Optional: fetch name of missing user if added recently
                       return prev;
                  }
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
        if (!coords || !mapRef.current) return;

        // 2. Inject Leaflet CDN dynamically
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
             }

             const map = leafletMapRef.current;

             // Clear previous markers
             map.eachLayer((layer: any) => {
                  if (layer instanceof L.Marker) {
                      map.removeLayer(layer);
                  }
             });

             // 1. Add Self Marker
             L.marker([coords.lat, coords.lng]).addTo(map)
                 .bindPopup(t('you_are_here', 'You are here 📍'))
                 .openPopup();

             // 2. Add Family Markers
             familyMembers.forEach((member: any) => {
                  if (member.location && member.location.lat && member.location.lng) {
                       const statusLbl = escapeHtml(t('map_popup_status'));
                       const tooltip = `<b>${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}</b><br>${statusLbl}: ${escapeHtml(String(member.status || ''))}`;
                       L.marker([member.location.lat, member.location.lng])
                           .addTo(map)
                           .bindPopup(tooltip);
                  }
             });
        };

        loadLeaflet();
    }, [coords, familyMembers, t, i18n.language]);

    return (
        <div className="page-shell" style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <AppToolbar />
            <div className="glass-panel map-panel-container" style={{ padding: 'clamp(1rem, 4vw, 2rem)', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📍 {t('map_title')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t('map_desc')}</p>

                {loading ? (
                    <p style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>{t('retrieving_gps')}</p>
                ) : (
                    <div
                        ref={mapRef}
                        style={{
                            flex: 1,
                            minHeight: 'min(55vh, 480px)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            zIndex: 1
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MapView;
