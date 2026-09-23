import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import ConfirmModal from '../components/ConfirmModal';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventApi.getMyEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching organizer events:', err);
      setError('Failed to load your organized events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      setError('');
      await eventApi.deleteEvent(selectedEvent._id);
      setEvents((prev) => prev.filter((e) => e._id !== selectedEvent._id));
      setSuccessMsg(`Event "${selectedEvent.title}" was deleted successfully.`);
      setSelectedEvent(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>My Organized Events</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage the campus events you have created, view participant rosters, or post updates.
          </p>
        </div>
        <Link to="/create-event" className="btn btn-primary">
          + Create New Event
        </Link>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

      {loading ? (
        <LoadingSpinner message="Loading your events..." />
      ) : events.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No events created yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Get started by hosting a technical, cultural, or sports event for students.
          </p>
          <Link to="/create-event" className="btn btn-primary">
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {events.map((event) => {
            const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={event._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1.5rem'
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <span className={`badge badge-${event.category}`}>{event.category}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Capacity: <strong>{event.capacity}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
                    <Link to={`/events/${event._id}`} style={{ color: '#ffffff' }}>
                      {event.title}
                    </Link>
                  </h3>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>📅 {formattedDate} at {event.time}</span>
                    <span>📍 {event.venue}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    to={`/events/${event._id}/participants`}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    👥 Participants
                  </Link>
                  <Link
                    to={`/events/${event._id}/edit`}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedEvent}
        title="Delete Event?"
        message={`Are you sure you want to permanently delete "${selectedEvent?.title}"?`}
        confirmText="Yes, Delete Event"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setSelectedEvent(null)}
      />
    </div>
  );
};

export default MyEvents;
