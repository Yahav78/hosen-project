import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CompleteProfile: React.FC = () => {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill if we have generic data from Google, though likely empty
  useEffect(() => {
    if (user && user.profileCompleted) {
       navigate('/'); // Already completed
    }
    if (user) {
        setFormData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || ''
        }));
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await completeProfile(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Welcome to HOSEN</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Please complete your profile configuration to continue.</p>
        
        {error && <div style={{ color: 'white', backgroundColor: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>First Name</label>
                <input type="text" className="input-field" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last Name</label>
                <input type="text" className="input-field" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Unique Username</label>
            <input type="text" className="input-field" name="username" value={formData.username} onChange={handleChange} required />
            <span style={{fontSize: '0.75rem', color: 'var(--warning-color)', display: 'block', marginTop: '4px'}}>
                Must be unique across the platform.
            </span>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
