import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MapView: React.FC = () => {
    const navigate = useNavigate();
    const mapRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLoading(false);
                    // Fallback to center of Israel or default
                    setCoords({ lat: 31.0461, lng: 34.8516 });
                }
            );
        } else {
            setLoading(false);
            setCoords({ lat: 31.0461, lng: 34.8516 });
        }
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

             // Clear previous instance if any
             if ((mapRef.current as any)._leaflet_id) {
                 return; // Already initialized
             }

             const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 13);

             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 attribution: '&copy; OpenStreetMap contributors'
             }).addTo(map);

             L.marker([coords.lat, coords.lng]).addTo(map)
                 .bindPopup('You are here📍')
                 .openPopup();
        };

        loadLeaflet();
    }, [coords]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '2rem auto' }}>
            <button className="btn" style={{ marginBottom: '1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => navigate('/')}>
                ← Back to Dashboard
            </button>
            <div className="glass-panel" style={{ padding: '2rem', height: '600px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📍 View Map</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Localizing safe zones and connected user coordinates securely.</p>

                {loading ? (
                    <p style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Retrieving GPS Coordinates...</p>
                ) : (
                    <div ref={mapRef} style={{ flex: 1, borderRadius: '12px', border: '1px solid var(--border-color)', zIndex: 1 }} />
                )}
            </div>
        </div>
    );
};

export default MapView;
