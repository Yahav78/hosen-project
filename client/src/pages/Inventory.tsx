import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const Inventory: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [items, setItems] = useState<any[]>([]);
    const [familyCount, setFamilyCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
         setIsLoading(true);
         try {
             const [invRes, famRes] = await Promise.all([
                 axios.get(`${API_URL}/inventory`),
                 axios.get(`${API_URL}/family`)
             ]);
             setItems(invRes.data);
             setFamilyCount(famRes.data.length + 1);
         } catch (err) {
             console.error("Fetch failed:", err);
         } finally {
             setIsLoading(false);
         }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateQuantity = async (id: string, action: 'increment' | 'decrement') => {
        try {
            await axios.post(`${API_URL}/inventory/${id}/quantity`, { action });
            setItems(prev => prev.map(item => item._id === id ? { ...item, quantity: action === 'increment' ? item.quantity + 1 : Math.max(0, item.quantity - 1) } : item));
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
            <button className="btn" style={{ marginBottom: '1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => navigate('/')}>
                ← {t('back_to_dash')}
            </button>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📦 {t('manage_inventory')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('recommended')} <strong>{familyCount}</strong></p>
                
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>{t('loading_inventory')}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map(item => {
                            const required = item.factorPerPerson * familyCount * item.daysRequired;
                            const isMet = item.quantity >= required;

                            return (
                                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{item.name}</h4>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Required: {required > 0 ? `${required} ${item.unit}` : 'Any quantity'} | Category: {item.category}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {required > 0 && (
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', backgroundColor: isMet ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isMet ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                                {isMet ? '✅ Stocked' : '⚠️ Low'}
                                            </span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface-color)', padding: '4px 8px', borderRadius: '8px' }}>
                                            <button onClick={() => updateQuantity(item._id, 'decrement')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>-</button>
                                            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item._id, 'increment')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>+</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
