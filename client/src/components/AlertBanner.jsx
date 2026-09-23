import React from 'react';

const AlertBanner = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'transparent', color: 'inherit', fontSize: '1.2rem', padding: '0 0.25rem', lineHeight: 1 }}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
