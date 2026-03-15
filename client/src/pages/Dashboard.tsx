import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import io from 'socket.io-client';
import { useAudioDetection } from '../hooks/useAudioDetection';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const Dashboard: React.FC = () => {
  const { user, logout, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Initialize Acoustic Emergency Detection
  const { startListening, isListening } = useAudioDetection(() => {
     console.log('Alarms Detected - Auto Triggering Emergency');
     navigate('/emergency');
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
    // Initialize Socket.io
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    fetchFamily();
    fetchInvitations();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
     if (!isListening) {
         startListening();
     }
  }, [startListening, isListening]);

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
          alert('Invitation sent successfully!');
          setInviteEmail('');
      } catch (err: any) {
          alert(err.response?.data?.message || 'Failed to send invitation');
      }
  };

  const handleRespond = async (id: string, action: 'accepted' | 'declined') => {
      try {
          await axios.post(`${API_URL}/family/invitations/${id}/respond`, { action });
          fetchInvitations();
          if (action === 'accepted') fetchFamily();
      } catch (err: any) {
          console.error(err);
          alert(err.response?.data?.message || 'Failed to respond to invitation');
      }
  };

  const handleRemove = async (id: string) => {
      if (!confirm("Are you sure you want to remove this family member?")) return;
      try {
          await axios.delete(`${API_URL}/family/${id}`);
          fetchFamily();
      } catch (err) {
          console.error(err);
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
    let text = 'UNKNOWN';
    
    if (status === 'safe') {
        color = 'var(--success-color)';
        text = 'SAFE';
    } else if (status === 'in-danger') {
        color = 'var(--danger-color)';
        text = 'IN DANGER';
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
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>HOSEN</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Resilience Network</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user?.role === 'admin' && (
                <button className="btn" style={{ backgroundColor: 'var(--warning-color)', color: 'black' }} onClick={() => window.location.href='/admin'}>
                    Admin Panel
                </button>
            )}
            <button className="btn btn-danger" onClick={() => window.location.href='/emergency'}>
                EMERGENCY OVERRIDE
            </button>
            <button className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={logout}>
                Sign Out
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          
          {/* Family Status Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             
             {/* Invite Section */}
             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <h3>Invite Family Member</h3>
                 <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <input type="email" className="input-field" placeholder="Family member's email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                     <button type="submit" className="btn btn-primary">Invite</button>
                 </form>
             </div>

             {/* Pending Invitations */}
             {invitations.length > 0 && (
                 <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid var(--warning-color)' }}>
                     <h4 style={{ color: 'var(--warning-color)', marginBottom: '0.5rem' }}>Pending Invitations</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {invitations.map((invite) => (
                             <div key={invite._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                                 <span>From: <strong>{invite.senderId?.firstName} {invite.senderId?.lastName}</strong> ({invite.receiverEmail})</span>
                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                                     <button className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleRespond(invite._id, 'accepted')}>Accept</button>
                                     <button className="btn" style={{ backgroundColor: 'var(--danger-color)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleRespond(invite._id, 'declined')}>Decline</button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2>Family Network</h2>
                 <button className="btn btn-primary" onClick={handleImSafe} style={{ backgroundColor: 'var(--success-color)', boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)' }}>
                     I AM SAFE
                 </button>
             </div>
             
             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 {familyMembers.length === 0 ? (
                     <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No family members connected yet. Invite someone above!</p>
                 ) : familyMembers.map((member) => (
                     <div key={member.user?._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: member.isFavorite ? 'rgba(234, 179, 8, 0.2)' : 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: member.isFavorite ? '1px solid var(--warning-color)' : '1px solid var(--border-color)' }}>
                                 {member.user?.firstName?.charAt(0) || '?'}{member.user?.lastName?.charAt(0) || '?'}
                             </div>
                             <div>
                                 <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                     {member.user?.firstName || 'Unknown'} {member.user?.lastName || 'User'} {member.user?._id === user?._id ? '(You)' : ''}
                                     {member.isFavorite && <span style={{ color: 'var(--warning-color)' }}>★</span>}
                                 </h4>
                                 <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                     Last Active: {member.user?.lastStatusUpdate ? new Date(member.user.lastStatusUpdate).toLocaleTimeString() : 'Never'}
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
                                     <button onClick={() => handleRemove(member.user?._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', fontSize: '1.2rem' }}>
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
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Resilience Score</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: '1rem 0' }}>
                      {user?.resilienceScore || 0}%
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>AI analysis indicates your family is well prepared.</p>
                  
                  <button className="btn" onClick={async () => {
                      try {
                          const res = await axios.post(`${API_URL}/resilience/calculate`);
                          setRecommendations(res.data.recommendations || []);
                          fetchProfile(); // Update score live!
                          alert(`Score updated to ${res.data.score}%`);
                      } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to update score');
                      }
                  }} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', marginBottom: '1rem' }}>
                      🔄 Update Score
                  </button>

                  {recommendations.length > 0 && (
                      <div style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>💡 AI advisor tips:</h4>
                          <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', margin: 0 }}>
                              {recommendations.map((rec, i) => (
                                  <li key={i} style={{ color: rec.type === 'success' ? '#4ade80' : rec.type === 'warning' ? '#facc15' : '#f87171' }}>
                                      {rec.text}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>

             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     <button className="btn" onClick={() => navigate('/inventory')} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: 'var(--surface-color)', color: 'white' }}>
                         📦 Manage Inventory
                     </button>
                     <button className="btn" onClick={() => navigate('/vault')} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: 'var(--surface-color)', color: 'white' }}>
                         🔒 The Vault
                     </button>
                     <button className="btn" onClick={() => navigate('/map')} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: 'var(--surface-color)', color: 'white' }}>
                         📍 View Map
                     </button>
                 </div>
             </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;
