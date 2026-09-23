import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../services/eventApi';
import { registrationApi } from '../services/registrationApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent, isOrganizer } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student registration tracking
  const [userRegistration, setUserRegistration] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventApi.getEventById(id);
      setEvent(data.event);

      // If student, check if already registered
      if (isAuthenticated && isStudent) {
        try {
          const myRegs = await registrationApi.getMyRegistrations();
          const activeReg = (myRegs.registrations || []).find(
            (r) => r.event?._id === id || r.event === id
          );
          setUserRegistration(activeReg || null);
        } catch {
          // ignore registration fetch error here
        }
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.response?.data?.message || 'Event not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, isAuthenticated, isStudent]);

  // Handle student registration
  const handleRegister = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      const data = await registrationApi.registerForEvent(id);
      setUserRegistration(data.registration);
      setSuccessMsg('You have successfully registered for this event!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register for this event.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle student cancellation
  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      await registrationApi.cancelRegistration(userRegistration._id);
      setUserRegistration(null);
      setSuccessMsg('Your registration has been cancelled.');
      setShowCancelModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle organizer deletion
  const handleDeleteEvent = async () => {
    try {
      setActionLoading(true);
      setError('');
      await eventApi.deleteEvent(id);
      navigate('/my-events', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
      setShowDeleteModal(false);
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (error && !event) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>Error Loading Event</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/events" className="btn btn-secondary">
          &larr; Back to All Events
        </Link>
      </div>
    );
  }

  if (!event) return null;

  const isOwner = isOrganizer && event.organizer?._id === user?._id;
  const isPast = new Date(event.date) < new Date();
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/events" style={{ color: '#818cf8', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          &larr; Back to Events
        </Link>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span className={`badge badge-${event.category}`} style={{ fontSize: '0.85rem' }}>
            {event.category}
          </span>
          {isPast && (
            <span className="badge badge-cancelled">Event Expired</span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1.25rem', lineHeight: 1.2 }}>
          {event.title}
        </h1>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>📅 {formattedDate}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Time</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>⏰ {event.time}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Venue</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>📍 {event.venue}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Capacity</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>👥 {event.capacity} seats</div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>About this Event</h3>
          <p style={{ color: '#cbd5e1', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            {event.description}
          </p>
        </div>

        {/* Host Details */}
        {event.organizer && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}>
              {event.organizer.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Hosted by {event.organizer.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {event.organizer.department ? `${event.organizer.department} • ` : ''}{event.organizer.email}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Action Buttons */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {/* Case 1: Student Flow */}
          {isAuthenticated && isStudent && (
            <div>
              {userRegistration ? (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="badge badge-registered" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      Registered & Active Pass ✓
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Ticket ID: <strong style={{ fontFamily: 'monospace', color: '#818cf8' }}>{userRegistration.ticketId || `TKT-${userRegistration._id}`}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/my-registrations" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                      📱 View QR Pass & Download PDF Ticket
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowCancelModal(true)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Cancel Registration
                    </button>
                  </div>
                </div>
              ) : isPast ? (
                <button type="button" className="btn btn-secondary" disabled>
                  Event Already Ended
                </button>
              ) : event.isFull || (event.registeredCount !== undefined && event.registeredCount >= event.capacity) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" disabled style={{ opacity: 0.6, background: '#ef4444', color: '#fff', cursor: 'not-allowed' }}>
                    🚫 Registration Closed — Event Capped at Maximum Capacity ({event.capacity})
                  </button>
                  <p style={{ fontSize: '0.8rem', color: '#f87171' }}>
                    Total registered attendees ({event.registeredCount || event.capacity}) has reached the strict event capacity limit ({event.capacity}).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRegister}
                  disabled={actionLoading}
                  style={{ minWidth: '200px', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
                >
                  {actionLoading ? 'Reserving Seat...' : '🎟️ Register & Issue Ticket Pass'}
                </button>
              )}
            </div>
          )}

          {/* Case 2: Organizer Flow (Event Owner) */}
          {isAuthenticated && isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to={`/events/${id}/participants`} className="btn btn-primary">
                👥 View Participants
              </Link>
              <Link to={`/events/${id}/edit`} className="btn btn-secondary">
                ✏️ Edit Event
              </Link>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
              >
                🗑️ Delete Event
              </button>
            </div>
          )}

          {/* Case 3: Other Organizer View */}
          {isAuthenticated && isOrganizer && !isOwner && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Organized by another campus coordinator.
            </div>
          )}

          {/* Case 4: Unauthenticated Guest */}
          {!isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/login" state={{ from: { pathname: `/events/${id}` } }} className="btn btn-primary">
                Sign in to Register
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Students can sign up free to reserve tickets.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Registration Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration? Your reserved seat will be immediately released for other students."
        confirmText="Yes, Cancel Registration"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleCancelRegistration}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Event?"
        message={`Are you sure you want to permanently delete "${event.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete Event"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteEvent}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default EventDetails;
