import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generatePdfTicket } from '../utils/ticketPdfGenerator';

const TicketQrModal = ({ isOpen, onClose, registration, user }) => {
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const event = registration?.event;
  const ticketId = registration?.ticketId || (registration?._id ? `TKT-${registration._id}` : '');

  useEffect(() => {
    if (ticketId) {
      QRCode.toDataURL(ticketId, { width: 320, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
        .then((url) => setQrSrc(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [ticketId]);

  if (!isOpen || !registration || !event) return null;

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfDownloading(true);
      await generatePdfTicket({ registration, event, user });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to generate PDF ticket. Please try again.');
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '92%', padding: '1.75rem', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className={`badge badge-${event.category}`}>{event.category}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.3rem', color: '#ffffff' }}>
          {event.title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          📍 {event.venue} &bull; 📅 {new Date(event.date).toLocaleDateString()} at {event.time}
        </p>

        {/* Check-In Status Badge */}
        <div style={{ marginBottom: '1.25rem' }}>
          {registration.checkedIn ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <span>✓ CHECKED IN AT DOOR</span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <span>🎟️ READY FOR ENTRY CHECK-IN</span>
            </div>
          )}
        </div>

        {/* QR Display */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1rem',
          display: 'inline-block',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          marginBottom: '1rem'
        }}>
          {qrSrc ? (
            <img src={qrSrc} alt="Ticket QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
          ) : (
            <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Generating QR...
            </div>
          )}
        </div>

        {/* Ticket ID display & copy */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.8rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unique Ticket ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>
              {ticketId}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyTicketId}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            disabled={pdfDownloading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <span>{pdfDownloading ? 'Generating PDF...' : '📄 Download PDF Ticket'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '0.6rem 1rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketQrModal;
