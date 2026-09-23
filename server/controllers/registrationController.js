const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Register for an event
// @route   POST /api/registrations/:eventId
// @access  Private (Student only)
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Validate event ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // 2. Check that the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 3. Check if the event has already occurred
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot register for an event that has already occurred' });
    }

    const studentId = req.user._id;

    // 4. Check if student already has a registration record
    let registration = await Registration.findOne({ event: eventId, student: studentId });

    if (registration && registration.status === 'registered') {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // 5. Check current capacity
    const currentActiveCount = await Registration.countDocuments({
      event: eventId,
      status: 'registered'
    });

    if (currentActiveCount >= event.capacity) {
      return res.status(400).json({ message: 'Event has reached maximum capacity' });
    }

    // 6. Create new or reactivate existing cancelled registration
    let isReactivation = false;
    if (registration && registration.status === 'cancelled') {
      isReactivation = true;
      registration.status = 'registered';
      registration.registeredAt = new Date();
      await registration.save();
    } else {
      registration = new Registration({
        student: studentId,
        event: eventId,
        status: 'registered'
      });
      await registration.save();
    }

    // 7. Post-save concurrency check: guarantee capacity was not exceeded during race condition
    const postCount = await Registration.countDocuments({
      event: eventId,
      status: 'registered'
    });

    if (postCount > event.capacity) {
      // Rollback this registration to protect capacity integrity
      if (isReactivation) {
        registration.status = 'cancelled';
        await registration.save();
      } else {
        await Registration.findByIdAndDelete(registration._id);
      }
      return res.status(400).json({ message: 'Event has reached maximum capacity' });
    }

    return res.status(201).json({
      message: 'Registration successful',
      registration
    });
  } catch (error) {
    // Gracefully catch duplicate key error (code 11000) from MongoDB compound index
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    console.error('Registration error:', error.message);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Get registrations of logged-in student
// @route   GET /api/registrations/my-registrations
// @access  Private (Student only)
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      student: req.user._id,
      status: 'registered'
    })
      .populate('event', 'title description category date time venue capacity')
      .sort({ registeredAt: -1 });

    return res.status(200).json({
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Get my registrations error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving your registrations' });
  }
};

// @desc    Get registrations for a specific event (Owner Organizer only)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer only, event owner only)
const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check: Only the organizer who created this event can view registrations
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access forbidden: You can only view registrations for your own events'
      });
    }

    // Fetch active registrations with safe student details (no password/sensitive fields)
    const registrations = await Registration.find({
      event: eventId,
      status: 'registered'
    })
      .populate('student', 'name email department')
      .sort({ registeredAt: -1 });

    const registeredCount = registrations.length;
    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const capacity = event.capacity;
    const remainingCapacity = Math.max(0, capacity - registeredCount);
    const checkInPercentage = registeredCount > 0 ? Number(((checkedInCount / registeredCount) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      count: registrations.length,
      event: {
        _id: event._id,
        title: event.title,
        capacity: event.capacity
      },
      stats: {
        capacity,
        registeredCount,
        checkedInCount,
        remainingCapacity,
        checkInPercentage
      },
      registrations
    });
  } catch (error) {
    console.error('Get event registrations error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving event registrations' });
  }
};

// @desc    Check-in ticket at event venue
// @route   POST /api/registrations/check-in
// @access  Private (Organizer only)
const checkInTicket = async (req, res) => {
  try {
    const { ticketId, eventId } = req.body;

    if (!ticketId || typeof ticketId !== 'string' || !ticketId.trim()) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    const cleanTicketId = ticketId.trim().toUpperCase();

    // Find registration
    const registration = await Registration.findOne({ ticketId: cleanTicketId })
      .populate('student', 'name email department')
      .populate('event', 'title description date time venue capacity organizer');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid Ticket ID. Ticket not found in system.' });
    }

    // Check if event ID matches if specified
    if (eventId && registration.event._id.toString() !== eventId) {
      return res.status(400).json({
        message: `Ticket belongs to a different event ("${registration.event.title}")`,
        registration
      });
    }

    // Authorization: Only the organizer of the event can check-in attendees
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access forbidden: You can only check in attendees for your own events' });
    }

    // Check status
    if (registration.status === 'cancelled') {
      return res.status(400).json({
        message: 'Ticket is CANCELLED and cannot be checked in.',
        registration
      });
    }

    // STRICT DUPLICATE CHECK-IN PREVENTION
    if (registration.checkedIn) {
      return res.status(400).json({
        duplicate: true,
        message: `DUPLICATE CHECK-IN REJECTED! Ticket was already checked in on ${new Date(registration.checkedInAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
        checkedInAt: registration.checkedInAt,
        registration
      });
    }

    // Mark as checked in
    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = req.user._id;
    await registration.save();

    return res.status(200).json({
      message: `Check-in Successful! Ticket verified for ${registration.student.name}`,
      registration
    });
  } catch (error) {
    console.error('Check-in error:', error.message);
    return res.status(500).json({ message: 'Server error during check-in', error: error.message });
  }
};

// @desc    Verify ticket details without marking checked in
// @route   POST /api/registrations/verify
// @access  Private (Organizer only)
const verifyTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId || typeof ticketId !== 'string' || !ticketId.trim()) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    const cleanTicketId = ticketId.trim().toUpperCase();

    const registration = await Registration.findOne({ ticketId: cleanTicketId })
      .populate('student', 'name email department')
      .populate('event', 'title date time venue capacity organizer');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid Ticket ID. Ticket not found.' });
    }

    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access forbidden: You can only verify tickets for your own events' });
    }

    return res.status(200).json({
      valid: registration.status === 'registered' && !registration.checkedIn,
      registration
    });
  } catch (error) {
    console.error('Verify ticket error:', error.message);
    return res.status(500).json({ message: 'Server error verifying ticket' });
  }
};

// @desc    Cancel a registration
// @route   DELETE /api/registrations/:registrationId
// @access  Private (Student only, owner only)
const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Validate registration ID format
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ message: 'Invalid registration ID format' });
    }

    // Find registration
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Authorization check: student can only cancel their own registration
    if (registration.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access forbidden: You can only cancel your own registrations'
      });
    }

    // Check if already cancelled
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    // Update status to cancelled (frees capacity immediately)
    registration.status = 'cancelled';
    await registration.save();

    return res.status(200).json({
      message: 'Registration cancelled successfully',
      registration
    });
  } catch (error) {
    console.error('Cancel registration error:', error.message);
    return res.status(500).json({ message: 'Server error cancelling registration' });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  checkInTicket,
  verifyTicket,
  cancelRegistration
};

