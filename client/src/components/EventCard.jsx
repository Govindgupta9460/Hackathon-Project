import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isPast = new Date(event.date) < new Date();
  const registered = event.registeredCount ?? 0;
  const capacity = event.capacity || 1;
  const isFull = event.isFull || registered >= capacity;
  const fillPercent = Math.min(100, Math.round((registered / capacity) * 100));

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <span className={`badge badge-${event.category}`}>
          {event.category}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {isPast ? (
            <span className="badge badge-cancelled" style={{ fontSize: '0.7rem' }}>Past Event</span>
          ) : isFull ? (
            <span className="badge badge-cancelled" style={{ fontSize: '0.75rem', fontWeight: 700 }}>FULL (CAPPED)</span>
          ) : (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem' }}>
              Seats Available
            </span>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        <Link to={`/events/${event._id}`} style={{ color: '#ffffff', textDecoration: 'none' }}>
          {event.title}
        </Link>
      </h3>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {event.description}
      </p>

      {/* Live Capacity & Attendance Progress */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
          <span>Registrations</span>
          <span><strong>{registered}</strong> / {capacity} {isFull ? '(Capped)' : ''}</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${fillPercent}%`,
            height: '100%',
            background: isFull ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
            transition: 'width 0.4s ease'
          }} />
        </div>
        {event.checkedInCount !== undefined && (
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', textAlign: 'right' }}>
            Checked-in: <strong>{event.checkedInCount}</strong>
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem',
        fontSize: '0.85rem',
        color: '#cbd5e1',
        marginBottom: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div>📅 {formattedDate} at {event.time}</div>
        <div>📍 {event.venue}</div>
        {event.organizer && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Host: {event.organizer.name} {event.organizer.department ? `(${event.organizer.department})` : ''}
          </div>
        )}
      </div>

      <Link
        to={`/events/${event._id}`}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        View Details &rarr;
      </Link>
    </div>
  );
};

export default EventCard;

