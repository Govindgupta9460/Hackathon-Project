const mongoose = require('mongoose');
const Event = require('../models/Event');

const ALLOWED_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const Registration = require('../models/Registration');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email department')
      .sort({ date: 1 })
      .lean();

    const eventsWithStats = await Promise.all(
      events.map(async (evt) => {
        const activeRegs = await Registration.find({ event: evt._id, status: 'registered' });
        const registeredCount = activeRegs.length;
        const checkedInCount = activeRegs.filter(r => r.checkedIn).length;
        return {
          ...evt,
          registeredCount,
          checkedInCount,
          isFull: registeredCount >= evt.capacity
        };
      })
    );

    return res.status(200).json({
      count: eventsWithStats.length,
      events: eventsWithStats
    });
  } catch (error) {
    console.error('Get all events error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving events' });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id).populate('organizer', 'name email department').lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const activeRegs = await Registration.find({ event: event._id, status: 'registered' });
    const registeredCount = activeRegs.length;
    const checkedInCount = activeRegs.filter(r => r.checkedIn).length;

    return res.status(200).json({
      event: {
        ...event,
        registeredCount,
        checkedInCount,
        isFull: registeredCount >= event.capacity
      }
    });
  } catch (error) {
    console.error('Get event by ID error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving event' });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizer only)
const createEvent = async (req, res) => {
  try {
    const { title, description, category, date, time, venue, capacity } = req.body;

    // Validate required fields
    if (!title || !description || !category || !date || !time || !venue || capacity === undefined || capacity === null || capacity === '') {
      return res.status(400).json({
        message: 'Please provide all required fields: title, description, category, date, time, venue, capacity'
      });
    }

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Invalid category '${category}'. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
      });
    }

    // Validate capacity
    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({ message: 'Capacity must be an integer of at least 1' });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Create event using req.user._id (ignore any organizer ID passed in request body)
    const event = new Event({
      title,
      description,
      category,
      date: parsedDate,
      time,
      venue,
      capacity: parsedCapacity,
      organizer: req.user._id
    });

    await event.save();

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error.message);
    return res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
};

// @desc    Bulk create events
// @route   POST /api/events/bulk
// @access  Private (Organizer only)
const bulkCreateEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'Events array is required and must not be empty' });
    }

    const createdEvents = [];
    const errors = [];

    for (let i = 0; i < events.length; i++) {
      const item = events[i];
      try {
        if (!item.title || !item.description || !item.category || !item.date || !item.time || !item.venue || item.capacity === undefined || item.capacity === null || item.capacity === '') {
          errors.push({ index: i, title: item.title || `Event #${i + 1}`, error: 'Missing required fields' });
          continue;
        }

        if (!ALLOWED_CATEGORIES.includes(item.category)) {
          errors.push({ index: i, title: item.title, error: `Invalid category '${item.category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}` });
          continue;
        }

        const parsedCapacity = Number(item.capacity);
        if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
          errors.push({ index: i, title: item.title, error: 'Capacity must be an integer of at least 1' });
          continue;
        }

        const parsedDate = new Date(item.date);
        if (isNaN(parsedDate.getTime())) {
          errors.push({ index: i, title: item.title, error: 'Invalid date format' });
          continue;
        }

        const newEvent = new Event({
          title: item.title.trim(),
          description: item.description.trim(),
          category: item.category,
          date: parsedDate,
          time: item.time.trim(),
          venue: item.venue.trim(),
          capacity: parsedCapacity,
          organizer: req.user._id
        });

        await newEvent.save();
        createdEvents.push(newEvent);
      } catch (err) {
        errors.push({ index: i, title: item.title || `Event #${i + 1}`, error: err.message });
      }
    }

    if (createdEvents.length === 0) {
      return res.status(400).json({
        message: 'Failed to create any events from the bulk payload',
        errors
      });
    }

    return res.status(201).json({
      message: `Successfully created ${createdEvents.length} event(s)`,
      createdCount: createdEvents.length,
      events: createdEvents,
      errors
    });
  } catch (error) {
    console.error('Bulk create events error:', error.message);
    return res.status(500).json({ message: 'Server error during bulk event creation' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Organizer only, owner only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ownership check: only the organizer who created the event can update it
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access forbidden: You can only modify your own events' });
    }

    const { title, description, category, date, time, venue, capacity } = req.body;

    // Validate category if provided
    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: `Invalid category '${category}'. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
        });
      }
      event.category = category;
    }

    // Validate capacity if provided
    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({ message: 'Capacity must be an integer of at least 1' });
      }
      event.capacity = parsedCapacity;
    }

    // Validate date if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      event.date = parsedDate;
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (time !== undefined) event.time = time;
    if (venue !== undefined) event.venue = venue;

    await event.save();

    return res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error.message);
    return res.status(500).json({ message: 'Server error updating event', error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer only, owner only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ownership check: only the organizer who created the event can delete it
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access forbidden: You can only delete your own events' });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error.message);
    return res.status(500).json({ message: 'Server error deleting event' });
  }
};

// @desc    Get all events created by the logged-in organizer
// @route   GET /api/events/organizer/my-events
// @access  Private (Organizer only)
const getMyEvents = async (req, res) => {
  try {
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({ message: 'Not authorized, user profile not attached' });
    }

    const rawUserId = req.user._id || req.user.id;
    const organizerStr = rawUserId.toString();
    const organizerObjId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    // Strict ownership query: matches only events where organizer equals the authenticated user's ID
    const events = await Event.find({
      $or: [
        { organizer: organizerObjId },
        { organizer: organizerStr }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Additional strict filter in memory to strictly guarantee zero leaks across organizers
    const ownedEvents = events.filter((evt) => {
      if (!evt.organizer) return false;
      const evtOrgStr = evt.organizer._id ? evt.organizer._id.toString() : evt.organizer.toString();
      return evtOrgStr === organizerStr;
    });

    const eventsWithStats = await Promise.all(
      ownedEvents.map(async (evt) => {
        const activeRegs = await Registration.find({ event: evt._id, status: 'registered' });
        const registeredCount = activeRegs.length;
        const checkedInCount = activeRegs.filter(r => r.checkedIn).length;
        return {
          ...evt,
          registeredCount,
          checkedInCount,
          isFull: registeredCount >= evt.capacity
        };
      })
    );

    return res.status(200).json({
      count: eventsWithStats.length,
      events: eventsWithStats
    });
  } catch (error) {
    console.error('Get my events error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving your events' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  bulkCreateEvents,
  updateEvent,
  deleteEvent,
  getMyEvents
};

