import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import MyEvents from './pages/MyEvents';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventParticipants from './pages/EventParticipants';
import CheckInDashboard from './pages/CheckInDashboard';
import BulkCreateEvents from './pages/BulkCreateEvents';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated (Any Role) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Student Only Routes */}
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />

          {/* Organizer Only Routes */}
          <Route
            path="/my-events"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/check-in"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CheckInDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-events"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <BulkCreateEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <EditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/participants"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <EventParticipants />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <p>&copy; {new Date().getFullYear()} Campus Event Registration System. Built with MERN Stack.</p>
      </footer>
    </div>
  );
}

export default App;
