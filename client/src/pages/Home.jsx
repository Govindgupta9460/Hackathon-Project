import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../services/eventApi';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { isAuthenticated, isOrganizer } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventApi.getAllEvents();
        const all = data.events || [];
        // Prioritize upcoming (non-expired) events for highlights
        const now = new Date();
        const future = all.filter((e) => new Date(e.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const highlights = future.length > 0 ? future.slice(0, 3) : all.slice(0, 3);
        setUpcomingEvents(highlights);
      } catch (err) {
        console.error('Failed to fetch home events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3.5rem 1rem 4rem',
        maxWidth: '850px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          ✨ Discover &amp; Join Campus Happenings
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          lineHeight: 1.15,
          marginBottom: '1.25rem'
        }}>
          Elevate Your College Life with{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Campus Events
          </span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          marginBottom: '2.25rem',
          lineHeight: 1.6
        }}>
          Browse technical hackathons, cultural festivals, sports tourneys, and expert workshops. 
          Register instantly, prevent duplicate entries, and keep track of your registrations in one place.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/events" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Explore All Events &rarr;
          </Link>
          {isOrganizer ? (
            <Link to="/create-event" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              + Create New Event
            </Link>
          ) : !isAuthenticated ? (
            <Link to="/register" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Create an Account
            </Link>
          ) : null}
        </div>
      </section>

      {/* Highlights / Features Bar */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '4rem'
      }}>
        {[
          { icon: '💻', title: 'Technical', desc: 'Coding contests, hackathons, and robotics exhibitions.' },
          { icon: '🎭', title: 'Cultural', desc: 'Music nights, dance competitions, drama, and fine arts.' },
          { icon: '⚽', title: 'Sports', desc: 'Inter-college tournaments, athletics, and e-sports.' },
          { icon: '🚀', title: 'Workshops', desc: 'Hands-on tech bootcamps, resume reviews, and seminars.' }
        ].map((f, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>{f.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Featured Upcoming Events */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem' }}>Upcoming Highlights</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Check out events happening soon on campus</p>
          </div>
          <Link to="/events" style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.9rem' }}>
            View All ({upcomingEvents.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching campus events..." />
        ) : upcomingEvents.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No upcoming events scheduled yet.</p>
            {isOrganizer && (
              <Link to="/create-event" className="btn btn-primary">
                Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
