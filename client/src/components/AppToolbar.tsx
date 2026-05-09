import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const baseNavClass = 'app-toolbar-link';

const linkStyle: React.CSSProperties = {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    border: '1px solid transparent',
    whiteSpace: 'nowrap'
};

const activeStyle: React.CSSProperties = {
    color: 'var(--primary-color)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-color)'
};

const AppToolbar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('he');

    return (
        <nav
            className="glass-panel"
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '0',
                width: '100%'
            }}
            aria-label="Main"
        >
            <NavLink to="/" end className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_dashboard')}
            </NavLink>
            <NavLink to="/profile" className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_my_profile')}
            </NavLink>
            <NavLink to="/inventory" className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_inventory')}
            </NavLink>
            <NavLink to="/vault" className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_vault')}
            </NavLink>
            <NavLink to="/map" className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_map')}
            </NavLink>
            <NavLink to="/emergency-log" className={baseNavClass} style={({ isActive: a }) => ({ ...linkStyle, ...(a ? activeStyle : {}) })}>
                {t('toolbar_emergency_log')}
            </NavLink>
        </nav>
    );
};

export default AppToolbar;
