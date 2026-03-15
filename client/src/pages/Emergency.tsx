import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Emergency: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [, setSocket] = useState<any>(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(newSocket);
        
        // Broadcast the override
        if (user) {
            newSocket.emit('triggerEmergency', { familyId: 'family1', userId: user._id, type: 'manual_trigger' });
        }

        return () => { newSocket.disconnect(); };
    }, [user]);

    const handleDeactivate = () => {
        // Here we'd typically have admin validation
        navigate('/');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'pulse 1.5s infinite alternate',
            zIndex: 9999
        }}>
            {/* Inline keyframes for pulse effect without tailwind */}
            <style>
                {`
                    @keyframes pulse {
                        0% { background-color: #000; box-shadow: inset 0 0 50px rgba(255,0,0,0.2); }
                        100% { background-color: #1a0000; box-shadow: inset 0 0 150px rgba(255,0,0,0.8); }
                    }
                    .siren-text {
                        color: #ff0000;
                        font-size: 5rem;
                        font-family: var(--font-heading);
                        font-weight: 800;
                        text-align: center;
                        text-transform: uppercase;
                        letter-spacing: 0.5rem;
                        text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
                        margin-bottom: 2rem;
                    }
                `}
            </style>

            <div className="siren-text">
                EMERGENCY<br/>PROTOCOL<br/>ACTIVE
            </div>
            
            <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', textAlign: 'center' }}>
                Seek shelter immediately. Wait for official clearance before exiting safe zones.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)', fontSize: '1.2rem', padding: '1rem 3rem' }}>
                    I AM SAFE
               </button>
               <button className="btn btn-danger" style={{ fontSize: '1.2rem', padding: '1rem 3rem' }} onClick={handleDeactivate}>
                   DEACTIVATE
               </button>
            </div>
            
            <div style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-secondary)' }}>
                Triggered by: {user?.firstName} {user?.lastName} (Manual Override)
            </div>
        </div>
    );
};

export default Emergency;
