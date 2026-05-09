import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    homeAddress: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            await googleLogin(tokenResponse.access_token);
            navigate('/');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t('google_auth_failed');
            setError(msg);
        } finally {
            setLoading(false);
        }
    },
    onError: () => {
        setError(t('google_auth_failed'));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('register_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{t('register_join', { app: t('app_name') })}</h2>

        {error && <div style={{ color: 'white', backgroundColor: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="reg-firstName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('first_name')}</label>
                <input id="reg-firstName" type="text" className="input-field" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="reg-lastName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('last_name')}</label>
                <input id="reg-lastName" type="text" className="input-field" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" />
              </div>
          </div>

          <div>
            <label htmlFor="reg-username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('username')}</label>
            <input id="reg-username" type="text" className="input-field" name="username" value={formData.username} onChange={handleChange} required autoComplete="username" />
          </div>

          <div>
            <label htmlFor="reg-home" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('home_address')}</label>
            <input id="reg-home" type="text" className="input-field" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required autoComplete="street-address" />
          </div>

          <div>
            <label htmlFor="reg-email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('email_address')}</label>
            <input id="reg-email" type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
          </div>

          <div>
            <label htmlFor="reg-password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('password')}</label>
            <input id="reg-password" type="password" className="input-field" name="password" value={formData.password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? t('register_creating') : t('sign_up')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {t('already_have_account')} <a href="/login" style={{ fontWeight: '600' }}>{t('log_in')}</a>
            </p>
        </div>

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
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={18} height={18} />
                {loading ? t('loading_submit') : t('register_google')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
