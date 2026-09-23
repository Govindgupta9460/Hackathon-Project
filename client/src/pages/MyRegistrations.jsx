import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { registrationApi } from '../services/registrationApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';
import TicketQrModal from '../components/TicketQrModal';
import { generatePdfTicket } from '../utils/ticketPdfGenerator';

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cancellation state
  const [selectedReg, setSelectedReg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // QR Modal state
  const [qrModalReg, setQrModalReg] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await registrationApi.getMyRegistrations();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Unable to load your registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async () => {
    if (!selectedReg) return;
    try {
      setActionLoading(true);
      setError('');
      await registrationApi.cancelRegistration(selectedReg._id);
      
      // Update state immediately by filtering out cancelled registration
      setRegistrations((prev) => prev.filter((r) => r._id !== selectedReg._id));
      setSuccessMsg('Registration cancelled successfully. The seat has been released.');
      setSelectedReg(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickPdfDownload = async (reg) => {
    try {
      await generatePdfTicket({ registration: reg, event: reg.event, user });
    } catch (err) {
      console.error('PDF error:', err);
      setError('Failed to generate PDF ticket.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>My Registrations & Tickets</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Access your unique Ticket IDs, view entry QR codes, download PDF passes, or manage your seat registrations.
        </p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

      {loading ? (
        <LoadingSpinner message="Fetching your event passes..." />
      ) : registrations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No active registrations</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You haven't registered for any upcoming events yet.
          </p>
          <Link to="/events" className="btn btn-primary">
            Explore Campus Events
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {registrations.map((reg) => {
            const event = reg.event;
            if (!event) return null;

            const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            const ticketId = reg.ticketId || `TKT-${reg._id}`;

            return (
              <div
                key={reg._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  borderLeft: reg.checkedIn ? '4px solid #10b981' : '4px solid #6366f1'
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${event.category}`}>{event.category}</span>
                    {reg.checkedIn ? (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 600 }}>
                        ✓ Checked In at Venue
                      </span>
                    ) : (
                      <span className="badge badge-registered">
                        Registered & Active Pass
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
                    <Link to={`/events/${event._id}`} style={{ color: '#ffffff', textDecoration: 'none' }}>
                      {event.title}
                    </Link>
                  </h3>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span>📅 {formattedDate} at {event.time}</span>
                    <span>📍 {event.venue}</span>
                  </div>

                  {/* Ticket ID Bar */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ticket ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#818cf8' }}>{ticketId}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => setQrModalReg(reg)}
                  >
                    <span>📱 View QR Pass</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => handleQuickPdfDownload(reg)}
                  >
                    <span>📄 PDF</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                    onClick={() => setSelectedReg(reg)}
                    disabled={reg.checkedIn}
                    title={reg.checkedIn ? 'Cannot cancel a ticket that is already checked in' : 'Cancel Registration'}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      <TicketQrModal
        isOpen={!!qrModalReg}
        onClose={() => setQrModalReg(null)}
        registration={qrModalReg}
        user={user}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedReg}
        title="Cancel Registration?"
        message={`Are you sure you want to cancel your seat for "${selectedReg?.event?.title}"? Your Ticket ID will be invalidated and seat released.`}
        confirmText="Yes, Cancel Registration"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setSelectedReg(null)}
      />
    </div>
  );
};

export default MyRegistrations;

