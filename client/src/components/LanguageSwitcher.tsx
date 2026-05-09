import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    document.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="btn"
      style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        right: 'max(16px, env(safe-area-inset-right))',
        left: 'auto',
        zIndex: 9999,
        backgroundColor: 'var(--primary-color)',
        color: 'black',
        boxShadow: '0 4px 14px 0 rgba(234, 179, 8, 0.39)',
        padding: '10px 15px',
        borderRadius: '30px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>🌐</span>
      {i18n.language === 'he' ? 'English' : 'עברית'}
    </button>
  );
};

export default LanguageSwitcher;
