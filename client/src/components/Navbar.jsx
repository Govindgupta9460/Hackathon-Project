import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isStudent, isOrganizer, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#818cf8' : '#cbd5e1',
    fontWeight: isActive ? '600' : '500',
    padding: '0.4rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
  });

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 800 }}>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            color: '#ffffff',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem'
          }}>
            🎯
          </span>
          <span style={{
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            CampusEvents
          </span>
        </Link>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links ${mobileMenuOpen ? 'navbar-links-open' : ''}`}>
          <NavLink to="/" style={navLinkStyle} onClick={closeMenu}>Home</NavLink>
          <NavLink to="/events" style={navLinkStyle} onClick={closeMenu}>Browse Events</NavLink>

          {/* Student Specific Links */}
          {isAuthenticated && isStudent && (
            <NavLink to="/my-registrations" style={navLinkStyle} onClick={closeMenu}>My Registrations</NavLink>
          )}

          {/* Organizer Specific Links */}
          {isAuthenticated && isOrganizer && (
            <>
              <NavLink to="/my-events" style={navLinkStyle} onClick={closeMenu}>My Events</NavLink>
              <NavLink to="/check-in" style={navLinkStyle} onClick={closeMenu}>🎫 Check-In Dashboard</NavLink>
              <NavLink to="/create-event" style={navLinkStyle} onClick={closeMenu}>+ Create Event</NavLink>
              <NavLink to="/bulk-events" style={navLinkStyle} onClick={closeMenu}>⚡ Bulk Create</NavLink>
            </>
          )}

          {/* Auth Action Buttons */}
          {isAuthenticated ? (
            <div className="navbar-auth-section">
              <NavLink to="/profile" style={navLinkStyle} onClick={closeMenu}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isOrganizer ? '#8b5cf6' : '#10b981',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                <span>{user?.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8'
                }}>
                  {user?.role}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="navbar-auth-section">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }} onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }} onClick={closeMenu}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
