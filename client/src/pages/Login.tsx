import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            await googleLogin(tokenResponse.access_token);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Google Auth Failed');
        } finally {
            setLoading(false);
        }
    },
    onError: () => {
        setError('Google Login was unsuccessful.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ identifier, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src="/logo.jpg" alt="JOIN HOSEN" style={{ width: '160px', marginBottom: '1.5rem', borderRadius: '8px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{t('login_title', 'Login')}</h2>
        
        {error && <div style={{ color: 'white', backgroundColor: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('email_address')} / {t('username')}</label>
            <input 
              type="text" 
              className="input-field" 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('password')}</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? '...' : t('sign_in')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {t('no_account')} <a href="/register" style={{ fontWeight: '600' }}>{t('sign_up')}</a>
            </p>
        </div>
        
        {/* Google OAuth Button */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <button 
                type="button"
                className="btn" 
                onClick={() => handleGoogleAuth()}
                disabled={loading}
                style={{ 
                    width: '100%', 
                    backgroundColor: 'white', 
                    color: '#333', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px'}}/>
                {loading ? '...' : t('or_continue_with') + ' Google'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
