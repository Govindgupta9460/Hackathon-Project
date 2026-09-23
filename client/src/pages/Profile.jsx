import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, isStudent, isOrganizer, logout } = useAuth();

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isOrganizer ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 800
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{user.name}</h2>
            <span className={`badge ${isOrganizer ? 'badge-Workshop' : 'badge-Sports'}`} style={{ textTransform: 'capitalize' }}>
              {user.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</div>
            <div style={{ fontWeight: 500 }}>{user.email}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department / Major</div>
            <div style={{ fontWeight: 500 }}>{user.department || 'Not specified'}</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Member Since</div>
            <div style={{ fontWeight: 500 }}>{joinDate}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isStudent && (
            <Link to="/my-registrations" className="btn btn-primary" style={{ flex: 1 }}>
              View My Registrations
            </Link>
          )}
          {isOrganizer && (
            <Link to="/my-events" className="btn btn-primary" style={{ flex: 1 }}>
              Manage My Events
            </Link>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
