import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Your account ({user?.role}) does not have permission to view this page.
          </p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
