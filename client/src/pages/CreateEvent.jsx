import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import AlertBanner from '../components/AlertBanner';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const CreateEvent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    date: '',
    time: '',
    venue: '',
    capacity: 50
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? (value === '' ? '' : Number(value)) : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.venue) {
      setError('Please fill in all required fields.');
      return;
    }

    const parsedCapacity = Number(formData.capacity);
    if (!formData.capacity || isNaN(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      setError('Capacity must be a positive whole number of at least 1.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Normalize date string into valid ISO date format
      const isoDate = new Date(formData.date).toISOString();

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: isoDate,
        time: formData.time,
        venue: formData.venue,
        capacity: parsedCapacity
      };

      const response = await eventApi.createEvent(payload);
      navigate(`/events/${response.event._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create event. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/my-events" style={{ color: '#818cf8', fontSize: '0.9rem' }}>
          &larr; Back to My Events
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create New Event</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Host a workshop, competition, or festival on campus
        </p>

        <AlertBanner type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Event Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual Campus Hackathon 2026"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Event Description *</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of what attendees can expect, agenda, prizes, etc."
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capacity">Capacity (Seats) *</label>
              <input
                id="capacity"
                type="number"
                name="capacity"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                name="date"
                min={todayStr}
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="time">Time *</label>
              <input
                id="time"
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="e.g. 10:00 AM - 04:00 PM"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="venue">Venue / Location *</label>
            <input
              id="venue"
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g. Science Block Auditorium 1"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/my-events" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              {loading ? 'Creating...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
