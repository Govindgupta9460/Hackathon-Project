import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import AlertBanner from '../components/AlertBanner';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const emptyRow = () => ({
  title: '',
  description: '',
  category: 'Technical',
  date: '',
  time: '10:00 AM',
  venue: '',
  capacity: 50
});

const BulkCreateEvents = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [batchErrors, setBatchErrors] = useState([]);

  // Handle cell changes in grid
  const handleChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add row
  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  // Remove row
  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit bulk payload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setBatchErrors([]);

    // Client-side quick validation
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.title.trim() || !r.description.trim() || !r.date || !r.venue.trim() || !r.capacity) {
        setError(`Please fill in all required fields for Event #${i + 1}`);
        return;
      }
      if (Number(r.capacity) < 1) {
        setError(`Event #${i + 1} capacity must be at least 1`);
        return;
      }
    }

    try {
      setLoading(true);
      const res = await eventApi.bulkCreateEvents({ events: rows });
      setSuccessMsg(res.message || `Successfully created ${res.createdCount} events!`);
      if (res.errors && res.errors.length > 0) {
        setBatchErrors(res.errors);
      } else {
        setTimeout(() => {
          navigate('/my-events');
        }, 1500);
      }
    } catch (err) {
      console.error('Bulk creation error:', err);
      setError(err.response?.data?.message || 'Failed to create bulk events. Please check fields.');
      if (err.response?.data?.errors) {
        setBatchErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // CSV Import handler
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setError('CSV file is empty or missing data rows');
          return;
        }

        // Header: title,description,category,date,time,venue,capacity
        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 6) {
            parsedRows.push({
              title: cols[0] || '',
              description: cols[1] || '',
              category: CATEGORIES.includes(cols[2]) ? cols[2] : 'Technical',
              date: cols[3] || '',
              time: cols[4] || '10:00 AM',
              venue: cols[5] || '',
              capacity: Number(cols[6]) || 50
            });
          }
        }

        if (parsedRows.length > 0) {
          setRows(parsedRows);
          setSuccessMsg(`Successfully imported ${parsedRows.length} events from CSV! Please review and click "Create All Events".`);
        } else {
          setError('Failed to parse any valid event rows from CSV.');
        }
      } catch (err) {
        setError('Error parsing CSV file format.');
      }
    };
    reader.readAsText(file);
  };

  // Sample CSV generator
  const downloadSampleCsv = () => {
    const sample = `title,description,category,date,time,venue,capacity
"Annual Coding Hackathon","24-hour campus hackathon","Technical","2026-10-15","09:00 AM","Tech Auditorium",100
"Cultural Dance Battle","Inter-department dance championship","Cultural","2026-10-20","05:00 PM","Main Open Stage",250
"AI & ML Hands-on Workshop","Intro to PyTorch and Transformers","Workshop","2026-11-05","02:00 PM","Lab 402",40`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Bulk_Events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>⚡</span> Bulk Event Creation
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Batch create multiple campus events at once using the visual grid or uploading a CSV file.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadSampleCsv}
            style={{ fontSize: '0.85rem' }}
          >
            📥 Download Sample CSV
          </button>
          <label className="btn btn-primary" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
            📁 Upload CSV File
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

      {batchErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <strong style={{ color: '#f87171' }}>Batch Errors:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', color: '#fca5a5' }}>
            {batchErrors.map((err, idx) => (
              <li key={idx}>Line #{err.index + 1} ({err.title}): {err.error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '950px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem', width: '35px' }}>#</th>
                <th style={{ padding: '0.6rem', width: '180px' }}>Event Title *</th>
                <th style={{ padding: '0.6rem', width: '200px' }}>Description *</th>
                <th style={{ padding: '0.6rem', width: '120px' }}>Category *</th>
                <th style={{ padding: '0.6rem', width: '130px' }}>Date *</th>
                <th style={{ padding: '0.6rem', width: '100px' }}>Time *</th>
                <th style={{ padding: '0.6rem', width: '130px' }}>Venue *</th>
                <th style={{ padding: '0.6rem', width: '90px' }}>Capacity *</th>
                <th style={{ padding: '0.6rem', width: '50px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Title"
                      value={row.title}
                      onChange={(e) => handleChange(idx, 'title', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Brief description"
                      value={row.description}
                      onChange={(e) => handleChange(idx, 'description', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <select
                      className="input-field"
                      value={row.category}
                      onChange={(e) => handleChange(idx, 'category', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: '#0f172a' }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="date"
                      className="input-field"
                      value={row.date ? row.date.substring(0, 10) : ''}
                      onChange={(e) => handleChange(idx, 'date', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="10:00 AM"
                      value={row.time}
                      onChange={(e) => handleChange(idx, 'time', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Venue"
                      value={row.venue}
                      onChange={(e) => handleChange(idx, 'venue', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={row.capacity}
                      onChange={(e) => handleChange(idx, 'capacity', e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: rows.length <= 1 ? '#475569' : '#f87171',
                        fontSize: '1.2rem',
                        cursor: rows.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addRow}
              style={{ fontSize: '0.85rem' }}
            >
              + Add Event Row
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total events to create: <strong>{rows.length}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/my-events')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '0.75rem 2rem' }}
          >
            {loading ? 'Creating Events...' : `🚀 Create ${rows.length} Events Now`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkCreateEvents;
