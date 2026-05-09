import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AppToolbar from '../components/AppToolbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const Inventory: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { fetchProfile } = useAuth();
    const { showToast } = useToast();
    const isRtl = i18n.language?.startsWith('he');
    const [items, setItems] = useState<any[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [familyCount, setFamilyCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [invRes, famRes] = await Promise.all([
                axios.get(`${API_URL}/inventory`),
                axios.get(`${API_URL}/family`)
            ]);
            const list = invRes.data;
            setItems(list);
            const next: Record<string, number> = {};
            for (const it of list) {
                next[it._id] = it.quantity;
            }
            setQuantities(next);
            setDirty(false);
            setFamilyCount(famRes.data.length + 1);
        } catch (err) {
            console.error('Fetch failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setQty = (id: string, value: number) => {
        const q = Math.max(0, value);
        setQuantities((prev) => ({ ...prev, [id]: q }));
        setDirty(true);
    };

    const adjust = (id: string, delta: number) => {
        const current = quantities[id] ?? 0;
        setQty(id, current + delta);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all(
                items.map((item) =>
                    axios.patch(`${API_URL}/inventory/${item._id}`, {
                        quantity: quantities[item._id] ?? item.quantity
                    })
                )
            );
            await fetchData();
            await fetchProfile();
            showToast(t('inventory_save_success'), 'success');
        } catch (err) {
            console.error('Save failed:', err);
            showToast(t('inventory_save_error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <AppToolbar />
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>📦 {t('manage_inventory')}</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('recommended')} <strong>{familyCount}</strong></p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isSaving || !dirty}
                        onClick={handleSave}
                        style={{ minWidth: '140px' }}
                    >
                        {isSaving ? t('inventory_saving') : t('inventory_save')}
                    </button>
                </div>

                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>{t('loading_inventory')}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item) => {
                            const q = quantities[item._id] ?? item.quantity;
                            const required = item.factorPerPerson * familyCount * item.daysRequired;
                            const isMet = required > 0 ? q >= required : true;

                            return (
                                <div
                                    key={item._id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem',
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div>
                                        <h4 style={{ margin: 0 }}>{String(t('item_' + item.name.replace(/[^a-zA-Z]/g, '').toLowerCase(), item.name))}</h4>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {String(t('required_label'))}:{' '}
                                            {required > 0
                                                ? `${required} ${String(t('unit_' + item.unit.toLowerCase(), item.unit))}`
                                                : String(t('any_quantity'))}{' '}
                                            | {String(t('category_label'))}: {String(t('cat_' + item.category.toLowerCase(), item.category))}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {required > 0 && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: isMet ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: isMet ? 'var(--success-color)' : 'var(--danger-color)'
                                                }}
                                            >
                                                {isMet ? `✅ ${t('status_stocked', 'Stocked')}` : `⚠️ ${t('status_low', 'Low')}`}
                                            </span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface-color)', padding: '4px 8px', borderRadius: '8px' }}>
                                            <button type="button" onClick={() => adjust(item._id, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>-</button>
                                            <span style={{ fontWeight: 'bold', minWidth: '28px', textAlign: 'center' }}>{q}</span>
                                            <button type="button" onClick={() => adjust(item._id, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>+</button>
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
