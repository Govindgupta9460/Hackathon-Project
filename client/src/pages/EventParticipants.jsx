import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { registrationApi } from '../services/registrationApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const EventParticipants = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await registrationApi.getEventRegistrations(id);
      setData(res);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.response?.data?.message || 'Failed to load participant list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading participant roster & check-in stats..." />;
  }

  const stats = data?.stats;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/events/${id}`} style={{ color: '#818cf8', fontSize: '0.9rem', textDecoration: 'none' }}>
          &larr; Back to Event Details
        </Link>
        <Link to="/check-in" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          🎫 Open Check-In Terminal
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
            Event Roster & Live Check-In
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Attendance Roster for: <strong>{data?.event?.title || 'Event'}</strong>
          </p>
        </div>
      </div>

      {/* Live Stats Summary */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="glass-card" style={{ borderLeft: '4px solid #6366f1', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Capacity</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{stats.capacity}</div>
          </div>
          <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>{stats.registeredCount}</div>
          </div>
          <div className="glass-card" style={{ borderLeft: '4px solid #10b981', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked-In at Door</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{stats.checkedInCount}</div>
          </div>
          <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check-In Rate</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.2rem' }}>{stats.checkInPercentage}%</div>
          </div>
        </div>
      )}

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <Link to="/my-events" className="btn btn-secondary">
            Return to My Events
          </Link>
        </div>
      ) : !data || data.registrations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No participants registered yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            When students register for this event, their details & unique Ticket IDs will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Ticket ID</th>
                <th>Check-In Status</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {data.registrations.map((reg, idx) => {
                const student = reg.student;
                const regDate = new Date(reg.registeredAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const ticketId = reg.ticketId || `TKT-${reg._id}`;

                return (
                  <tr key={reg._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{student?.name || 'Unknown Student'}</td>
                    <td style={{ color: '#94a3b8' }}>{student?.email || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>
                      {ticketId}
                    </td>
                    <td>
                      {reg.checkedIn ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem' }}>
                          ✓ Checked In ({new Date(reg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.75rem' }}>
                          Pending Entry
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{regDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventParticipants;

