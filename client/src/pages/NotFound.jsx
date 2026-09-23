import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>404</div>
        <h2 style={{ margin: '1rem 0 0.5rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
