import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { eventApi } from '../services/eventApi';
import { registrationApi } from '../services/registrationApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const CheckInDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventStats, setEventStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check-In Input
  const [ticketInput, setTicketInput] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null); // { type: 'success' | 'duplicate' | 'error', message, registration }

  // QR Scanner State
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'scanner'
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const qrScannerRef = useRef(null);

  // Search Roster
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch organizer's events on mount
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        setLoading(true);
        const data = await eventApi.getMyEvents();
        const evts = data.events || [];
        setEvents(evts);
        if (evts.length > 0) {
          setSelectedEventId(evts[0]._id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load your events. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerEvents();
  }, []);

  // Fetch registrations & stats when selected event changes or on auto-refresh
  const fetchEventData = async (eventId, silent = false) => {
    if (!eventId) return;
    try {
      if (!silent) setLoading(true);
      const data = await registrationApi.getEventRegistrations(eventId);
      setEventStats(data.stats || null);
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Failed to fetch event check-in stats:', err);
      if (!silent) setError(err.response?.data?.message || 'Failed to load check-in statistics.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchEventData(selectedEventId);
    }
  }, [selectedEventId]);

  // Auto-refresh stats interval
  useEffect(() => {
    let interval;
    if (autoRefresh && selectedEventId) {
      interval = setInterval(() => {
        fetchEventData(selectedEventId, true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedEventId]);

  // Handle Check-in submit
  const processCheckIn = async (ticketIdToSubmit) => {
    const targetTicket = (ticketIdToSubmit || ticketInput).trim();
    if (!targetTicket) {
      setError('Please enter or scan a valid Ticket ID');
      return;
    }

    try {
      setCheckInLoading(true);
      setError('');
      setCheckInResult(null);

      const res = await registrationApi.checkInTicket({
        ticketId: targetTicket,
        eventId: selectedEventId || undefined
      });

      setCheckInResult({
        type: 'success',
        message: res.message || 'Check-in successful!',
        registration: res.registration
      });
      setTicketInput('');
      fetchEventData(selectedEventId, true);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.duplicate) {
        setCheckInResult({
          type: 'duplicate',
          message: resp.message || 'DUPLICATE CHECK-IN REJECTED!',
          checkedInAt: resp.checkedInAt,
          registration: resp.registration
        });
      } else {
        setCheckInResult({
          type: 'error',
          message: resp?.message || 'Check-in failed. Invalid Ticket ID.',
          registration: resp?.registration
        });
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  // Camera QR Scanner setup
  const startCamera = async () => {
    setScannerError('');
    try {
      setCameraActive(true);
      const html5QrCode = new Html5Qrcode('qr-reader-div');
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // On QR code successfully scanned
          console.log('Scanned QR:', decodedText);
          processCheckIn(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning frame errors
        }
      );
    } catch (err) {
      console.error('Camera start error:', err);
      setScannerError('Could not access camera. Please check camera permissions or use manual entry / file upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current && cameraActive) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (err) {
        console.error('Camera stop error:', err);
      } finally {
        setCameraActive(false);
        qrScannerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (activeTab !== 'scanner' && cameraActive) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Handle QR File Upload scan
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-div-dummy');
      const decodedText = await html5QrCode.scanFile(file, true);
      processCheckIn(decodedText);
    } catch (err) {
      setCheckInResult({
        type: 'error',
        message: 'Could not read a valid QR code from the uploaded image.'
      });
    }
  };

  // Filtered registrations roster
  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchTerm.toLowerCase();
    const name = reg.student?.name?.toLowerCase() || '';
    const email = reg.student?.email?.toLowerCase() || '';
    const tkt = reg.ticketId?.toLowerCase() || '';
    return name.includes(query) || email.includes(query) || tkt.includes(query);
  });

  const selectedEventObj = events.find((e) => e._id === selectedEventId);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🎫</span> Check-In & Verification Portal
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time venue check-in dashboard. Verify attendee tickets and strictly prevent duplicate venue entry.
          </p>
        </div>

        {/* Event Selector */}
        <div className="glass-card" style={{ padding: '0.75rem 1.25rem', minWidth: '280px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            SELECT EVENT FOR CHECK-IN:
          </label>
          <select
            className="input-field"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={events.length === 0}
            style={{ fontWeight: 600, color: '#ffffff', background: 'rgba(15, 23, 42, 0.8)' }}
          >
            {events.length === 0 ? (
              <option value="">No events created yet</option>
            ) : (
              events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({new Date(evt.date).toLocaleDateString()})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Live Dashboard Counter Widgets */}
      {eventStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Capacity</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
              {eventStats.capacity}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Max capped limit</div>
          </div>

          <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
              {eventStats.registeredCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              {eventStats.remainingCapacity} seats remaining
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Checked-In</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              {eventStats.checkedInCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              {eventStats.checkInPercentage}% attendance rate
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Live Progress</span>
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  background: autoRefresh ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: autoRefresh ? '#34d399' : '#94a3b8',
                  border: 'none',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {autoRefresh ? '🟢 Auto-Sync ON' : '⏸️ Sync Paused'}
              </button>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${eventStats.checkInPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Check-In Control Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Check-In Input Form & Scanner */}
        <div className="glass-card">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'manual' ? '2px solid #6366f1' : 'none',
                color: activeTab === 'manual' ? '#818cf8' : '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⌨️ Manual Ticket ID Input
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'scanner' ? '2px solid #6366f1' : 'none',
                color: activeTab === 'scanner' ? '#818cf8' : '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📷 Live QR Scanner
            </button>
          </div>

          {activeTab === 'manual' ? (
            <form onSubmit={(e) => { e.preventDefault(); processCheckIn(); }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                ENTER OR PASTE TICKET ID:
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. TKT-6C74EA9B-MUEMMLYU"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem', textTransform: 'uppercase', flex: 1 }}
                  disabled={checkInLoading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={checkInLoading || !ticketInput.trim()}
                  style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                >
                  {checkInLoading ? 'Verifying...' : 'Check In Ticket ✓'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ticket IDs are case-insensitive. Each ticket can only be checked in once.
              </p>
            </form>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {!cameraActive ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startCamera}
                    style={{ margin: '1rem 0' }}
                  >
                    🎥 Start Camera Scanner
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={stopCamera}
                    style={{ margin: '1rem 0' }}
                  >
                    ⏹️ Stop Camera
                  </button>
                )}

                {scannerError && (
                  <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {scannerError}
                  </div>
                )}
              </div>

              {/* Camera Video Container */}
              <div
                id="qr-reader-div"
                style={{
                  width: '100%',
                  minHeight: '260px',
                  background: '#0f172a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: cameraActive ? 'block' : 'none'
                }}
              />

              <div id="qr-reader-div-dummy" style={{ display: 'none' }} />

              {/* QR Image File Upload option */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  Or upload a QR code ticket image:
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.85rem', color: '#cbd5e1' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Check-In Feedback Display Card */}
        <div>
          {checkInResult ? (
            <div
              className="glass-card"
              style={{
                border: checkInResult.type === 'success'
                  ? '2px solid #10b981'
                  : checkInResult.type === 'duplicate'
                  ? '2px solid #f59e0b'
                  : '2px solid #ef4444',
                background: checkInResult.type === 'success'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : checkInResult.type === 'duplicate'
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                  {checkInResult.type === 'success' ? '✅' : checkInResult.type === 'duplicate' ? '⚠️' : '❌'}
                </div>
                <h3 style={{
                  fontSize: '1.4rem',
                  color: checkInResult.type === 'success'
                    ? '#34d399'
                    : checkInResult.type === 'duplicate'
                    ? '#fbbf24'
                    : '#f87171'
                }}>
                  {checkInResult.type === 'success'
                    ? 'ENTRY APPROVED'
                    : checkInResult.type === 'duplicate'
                    ? 'DUPLICATE CHECK-IN REJECTED'
                    : 'CHECK-IN REJECTED'}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginTop: '0.4rem', fontWeight: 500 }}>
                  {checkInResult.message}
                </p>
              </div>

              {/* Attendee Details Card */}
              {checkInResult.registration && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ATTENDEE NAME</span>
                      <strong>{checkInResult.registration.student?.name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>DEPARTMENT</span>
                      <strong>{checkInResult.registration.student?.department || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>EMAIL</span>
                    <span>{checkInResult.registration.student?.email || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    <span>Ticket: <strong style={{ fontFamily: 'monospace', color: '#818cf8' }}>{checkInResult.registration.ticketId}</strong></span>
                    <span>Event: <strong>{checkInResult.registration.event?.title}</strong></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="glass-card"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '2rem'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.6 }}>🔍</div>
              <h3 style={{ color: '#ffffff', marginBottom: '0.4rem' }}>Awaiting Ticket Input</h3>
              <p style={{ fontSize: '0.85rem' }}>
                Scan a QR code or type a Ticket ID to verify attendee status and record entry.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Registered Attendees Roster Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#ffffff' }}>
              Attendee Roster & Status ({filteredRegistrations.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live attendee status list for "{selectedEventObj?.title || 'Selected Event'}".
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search name, email, or Ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', width: '250px' }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchEventData(selectedEventId)}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              🔄 Sync List
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading attendee roster..." />
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No registered attendees found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Attendee</th>
                  <th style={{ padding: '0.75rem' }}>Email / Dept</th>
                  <th style={{ padding: '0.75rem' }}>Ticket ID</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const student = reg.student || {};
                  return (
                    <tr key={reg._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                        {student.name || 'Student'}
                      </td>
                      <td style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {student.email} {student.department ? `(${student.department})` : ''}
                      </td>
                      <td style={{ padding: '0.85rem', fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>
                        {reg.ticketId || `TKT-${reg._id}`}
                      </td>
                      <td style={{ padding: '0.85rem' }}>
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
                      <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                        {!reg.checkedIn ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => processCheckIn(reg.ticketId)}
                          >
                            Check In Now
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInDashboard;
