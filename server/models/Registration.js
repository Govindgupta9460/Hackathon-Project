const mongoose = require('mongoose');
const crypto = require('crypto');

const registrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required']
  },
  ticketId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['registered', 'cancelled'],
      message: '{VALUE} is not a valid registration status'
    },
    default: 'registered'
  }
});

// Pre-save hook to ensure ticketId is generated if not present
registrationSchema.pre('save', function (next) {
  if (!this.ticketId) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const timestampStr = Date.now().toString(36).toUpperCase();
    this.ticketId = `TKT-${randomHex}-${timestampStr}`;
  }
  next();
});

// Compound unique index to prevent duplicate registrations at the database level
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);

