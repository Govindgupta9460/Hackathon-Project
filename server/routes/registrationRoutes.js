const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  checkInTicket,
  verifyTicket,
  cancelRegistration
} = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Organizer-only: Check-in ticket (MUST be before /:eventId)
router.post('/check-in', authMiddleware, roleMiddleware('organizer'), checkInTicket);

// Organizer-only: Verify ticket details without checking in
router.post('/verify', authMiddleware, roleMiddleware('organizer'), verifyTicket);

// Student-only: View my registrations
router.get('/my-registrations', authMiddleware, roleMiddleware('student'), getMyRegistrations);

// Organizer-only: View registrations for an event owned by the organizer
router.get('/event/:eventId', authMiddleware, roleMiddleware('organizer'), getEventRegistrations);

// Student-only: Register for an event
router.post('/:eventId', authMiddleware, roleMiddleware('student'), registerForEvent);

// Student-only: Cancel my registration
router.delete('/:registrationId', authMiddleware, roleMiddleware('student'), cancelRegistration);

module.exports = router;

