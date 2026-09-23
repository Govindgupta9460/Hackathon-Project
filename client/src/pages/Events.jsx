import React, { useEffect, useState } from 'react';
import { eventApi } from '../services/eventApi';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventApi.getAllEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events by category & search term
  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Campus Events</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Explore all upcoming campus technical and cultural happenings.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 Search events by title, venue, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Content States */}
      {loading ? (
        <LoadingSpinner message="Loading events..." />
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#f87171', marginBottom: '1.25rem' }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={fetchEvents}>
            🔄 Retry
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No events found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or category filter.'
              : 'There are currently no events scheduled on campus.'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Showing <strong>{filteredEvents.length}</strong> event{filteredEvents.length === 1 ? '' : 's'}
          </div>
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
