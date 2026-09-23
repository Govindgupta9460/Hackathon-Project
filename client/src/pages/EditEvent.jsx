import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const EditEvent = () => {
  const { id } = useParams();
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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await eventApi.getEventById(id);
        const event = data.event;

        // Format ISO date into YYYY-MM-DD for date input
        const yyyyMmDd = new Date(event.date).toISOString().split('T')[0];

        setFormData({
          title: event.title,
          description: event.description,
          category: event.category,
          date: yyyyMmDd,
          time: event.time,
          venue: event.venue,
          capacity: event.capacity
        });
      } catch (err) {
        console.error('Error fetching event for edit:', err);
        setError('Failed to load event data.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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

    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.venue) {
      setError('Please fill in all required fields.');
      return;
    }

    const parsedCapacity = Number(formData.capacity);
    if (!formData.capacity || isNaN(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      setError('Capacity must be a positive whole integer of at least 1.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const isoDate = new Date(formData.date).toISOString();

      await eventApi.updateEvent(id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: isoDate,
        time: formData.time,
        venue: formData.venue,
        capacity: parsedCapacity
      });

      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading event details for editing..." />;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to={`/events/${id}`} style={{ color: '#818cf8', fontSize: '0.9rem' }}>
          &larr; Back to Event Details
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Edit Event</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Update the event schedule, venue, or details
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
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Link to={`/events/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: '150px' }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
