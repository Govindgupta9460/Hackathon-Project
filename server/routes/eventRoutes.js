const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  bulkCreateEvents,
  updateEvent,
  deleteEvent,
  getMyEvents
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getAllEvents);

// Organizer-specific route (declared BEFORE /:id to avoid route collision)
router.get('/organizer/my-events', authMiddleware, roleMiddleware('organizer'), getMyEvents);

// Bulk event creation for organizers (declared BEFORE /:id)
router.post('/bulk', authMiddleware, roleMiddleware('organizer'), bulkCreateEvents);

// Single event details (Public)
router.get('/:id', getEventById);

// Organizer CRUD routes
router.post('/', authMiddleware, roleMiddleware('organizer'), createEvent);
router.put('/:id', authMiddleware, roleMiddleware('organizer'), updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware('organizer'), deleteEvent);

module.exports = router;

