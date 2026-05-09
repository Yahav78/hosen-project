import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAudioDetection } from '../hooks/useAudioDetection';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AppToolbar from '../components/AppToolbar';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import SkeletonList from '../components/SkeletonList';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const Dashboard: React.FC = () => {
  const { user, logout, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const logoSrc = i18n.language === 'he' ? '/logo.png' : '/logo-en.png';
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  // Initialize Acoustic Emergency Detection
  const { startListening, isListening } = useAudioDetection(() => {
     navigate('/emergency', { state: { trigger: 'audio' } });
  });

  const fetchFamily = async () => {
      try {
          const res = await axios.get(`${API_URL}/family`);
          setFamilyMembers(res.data);
      } catch (err) {
          console.error("Failed to fetch family:", err);
      }
  };

  const fetchInvitations = async () => {
      try {
          const res = await axios.get(`${API_URL}/family/invitations`);
          setInvitations(res.data);
      } catch (err) {
          console.error("Failed to fetch invites:", err);
      }
  };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    let cancelled = false;
    const load = async () => {
      setDashLoading(true);
      try {
        const [fam, inv] = await Promise.all([
          axios.get(`${API_URL}/family`),
          axios.get(`${API_URL}/family/invitations`)
        ]);
        if (!cancelled) {
          setFamilyMembers(fam.data);
          setInvitations(inv.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
     if (!isListening) {
         startListening();
     }
  }, [startListening, isListening]);

  useEffect(() => {
      // Auto-fetch recommendations on Dashboard load cleanly
      const fetchInitialRecommendations = async () => {
          try {
              const res = await axios.post(`${API_URL}/resilience/calculate`);
              setRecommendations(res.data.recommendations || []);
          } catch (err) {
              console.error('Failed to trigger background resilience sync');
          }
      };
      fetchInitialRecommendations();
  }, []);

  const handleImSafe = () => {
     // Mock update
     if(socket && user) {
        socket.emit('updateStatus', { familyId: 'family1', userId: user._id, status: 'safe' });
        
        // Optimistic UI update
         setFamilyMembers(prev => 
            prev.map(m => m.user?._id === user._id ? { ...m, user: { ...m.user, status: 'safe', lastStatusUpdate: new Date() } } : m)
         );
     }
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;
      try {
          await axios.post(`${API_URL}/family/invite`, { email: inviteEmail });
          showToast(t('toast_invite_sent'), 'success');
          setInviteEmail('');
      } catch (err: any) {
          showToast(err.response?.data?.message || t('toast_invite_error'), 'error');
      }
  };

  const handleRespond = async (id: string, action: 'accepted' | 'declined') => {
      try {
          await axios.post(`${API_URL}/family/invitations/${id}/respond`, { action });
          fetchInvitations();
          if (action === 'accepted') fetchFamily();
      } catch (err: any) {
          console.error(err);
          showToast(err.response?.data?.message || t('toast_invite_respond_error'), 'error');
      }
  };

  const confirmRemoveMember = async () => {
      if (!removeMemberId) return;
      try {
          await axios.delete(`${API_URL}/family/${removeMemberId}`);
          await fetchFamily();
          showToast(t('toast_family_removed'), 'success');
      } catch (err) {
          console.error(err);
      } finally {
          setRemoveMemberId(null);
      }
  };

  const handleFavorite = async (id: string) => {
      try {
          await axios.patch(`${API_URL}/family/${id}/favorite`);
          fetchFamily();
      } catch (err) {
          console.error(err);
      }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'var(--text-secondary)';
    let text = t('status_unknown');
    
    if (status === 'safe') {
        color = 'var(--success-color)';
        text = t('status_safe');
    } else if (status === 'in-danger') {
        color = 'var(--danger-color)';
        text = t('status_in_danger');
    }

    return (
        <span style={{ 
            backgroundColor: `${color}20`, 
            color: color, 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: 'bold',
            border: `1px solid ${color}40`
        }}>
            {text}
        </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <header className="glass-panel flex-responsive" style={{ padding: '1.5rem 2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img src={logoSrc} alt="HOSEN" style={{ height: '65px', borderRadius: '8px', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div>
                <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>{t('app_name')}</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('app_desc')}</p>
            </div>
        </div>
        <div className="flex-responsive" style={{ gap: '1rem' }}>
            {user?.role === 'admin' && (
                <button type="button" className="btn" style={{ backgroundColor: 'var(--warning-color)', color: 'black' }} onClick={() => navigate('/admin')}>
                    {t('admin_panel')}
                </button>
            )}
            <button type="button" className="btn btn-danger" onClick={() => navigate('/emergency', { state: { trigger: 'manual' } })}>
                {t('emergency_override')}
            </button>
            <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={logout}>
                {t('sign_out')}
            </button>
        </div>
      </header>

      <AppToolbar />

      {/* Main Content Grid */}
      <div className="grid-sidebar">
          
          {/* Family Status Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             
             {/* Invite Section */}
             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <h3>{t('invite_family')}</h3>
                 <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <input type="email" className="input-field" placeholder={t('family_email_placeholder')} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                     <button type="submit" className="btn btn-primary">{t('invite_btn')}</button>
                 </form>
             </div>

             {/* Pending Invitations */}
             {invitations.length > 0 && (
                 <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid var(--warning-color)' }}>
                     <h4 style={{ color: 'var(--warning-color)', marginBottom: '0.5rem' }}>{t('pending_invites')}</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {invitations.map((invite) => (
                             <div key={invite._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                                 <span>{t('from')} <strong>{invite.senderId?.firstName} {invite.senderId?.lastName}</strong> ({invite.receiverEmail})</span>
                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                                     <button className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleRespond(invite._id, 'accepted')}>{t('accept')}</button>
                                     <button className="btn" style={{ backgroundColor: 'var(--danger-color)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleRespond(invite._id, 'declined')}>{t('decline')}</button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2>{t('family_network')}</h2>
                 <button className="btn btn-primary" onClick={handleImSafe} style={{ backgroundColor: 'var(--success-color)', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}>
                     {t('i_am_safe')}
                 </button>
             </div>
             
             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 {dashLoading ? (
                     <SkeletonList rows={4} label={t('dashboard_loading_network')} />
                 ) : familyMembers.length === 0 ? (
                     <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{t('no_family')}</p>
                 ) : familyMembers.map((member) => (
                     <div key={member.user?._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: member.isFavorite ? 'rgba(234, 179, 8, 0.2)' : 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: member.isFavorite ? '1px solid var(--warning-color)' : '1px solid var(--border-color)' }}>
                                 {member.user?.firstName?.charAt(0) || '?'}{member.user?.lastName?.charAt(0) || '?'}
                             </div>
                             <div>
                                 <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                     {member.user?.firstName || 'Unknown'} {member.user?.lastName || 'User'} {member.user?._id === user?._id ? t('you') : ''}
                                     {member.isFavorite && <span style={{ color: 'var(--warning-color)' }}>★</span>}
                                 </h4>
                                 <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                     {t('last_active')} {member.user?.lastStatusUpdate ? new Date(member.user.lastStatusUpdate).toLocaleTimeString() : t('never')}
                                 </p>
                             </div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                             <StatusBadge status={member.user?.status} />
                             {member.user?._id !== user?._id && (
                                 <>
                                     <button onClick={() => handleFavorite(member.user?._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: member.isFavorite ? 'var(--warning-color)' : 'var(--text-secondary)', fontSize: '1.2rem' }}>
                                         ★
                                     </button>
                                     <button type="button" aria-label={t('confirm_remove')} onClick={() => member.user?._id && setRemoveMemberId(member.user._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', fontSize: '1.2rem' }}>
                                         🗑
                                     </button>
                                 </>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('resilience_score')}</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: '1rem 0' }}>
                      {user?.resilienceScore || 0}%
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t('ai_analysis')}</p>
                  
                  <button type="button" className="btn" onClick={async () => {
                      try {
                          const res = await axios.post(`${API_URL}/resilience/calculate`);
                          setRecommendations(res.data.recommendations || []);
                          fetchProfile();
                          showToast(String(t('toast_score_updated', { score: res.data.score })), 'success');
                      } catch (err: any) {
                          showToast(err.response?.data?.message || t('toast_score_error'), 'error');
                      }
                  }} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', marginBottom: '1rem' }}>
                      🔄 {t('update_score')}
                  </button>

                  {recommendations.length > 0 && (
                      <div style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>💡 {t('ai_advisor_tips')}</h4>
                          <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', margin: 0 }}>
                              {recommendations.map((rec, i) => {
                                  let localizedText = rec.text || '';
                                  if (rec.key) {
                                      if (rec.key === 'res_inv_low') {
                                          const localizedItems = rec.params.items.map((it: string) => String(t('item_' + it.replace(/[^a-zA-Z]/g, '').toLowerCase(), it)));
                                          localizedText = String(t(rec.key, { items: localizedItems.join(', ') }));
                                      } else {
                                          localizedText = String(t(rec.key, rec.params || {}));
                                      }
                                  }
                                  return (
                                      <li key={i} style={{ color: rec.type === 'success' ? '#4ade80' : rec.type === 'warning' ? '#facc15' : '#f87171' }}>
                                          {localizedText}
                                      </li>
                                  );
                              })}
                          </ul>
                      </div>
                  )}
              </div>

          </div>

      </div>

      <ConfirmDialog
        open={removeMemberId !== null}
        title={t('confirm_remove_family_title')}
        message={t('confirm_remove_family_message')}
        confirmLabel={t('confirm_remove')}
        cancelLabel={t('confirm_cancel')}
        danger
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberId(null)}
      />
    </div>
  );
};

export default Dashboard;
