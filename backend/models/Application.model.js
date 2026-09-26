const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'not-shortlisted', 'test-cleared', 'test-failed', 'interview-scheduled', 'selected', 'rejected'],
      default: 'applied',
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    resumeSnapshot: {
      type: String, // Store the resume URL at the time of application
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
applicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

// Compound indexes for high-traffic query acceleration
applicationSchema.index({ driveId: 1, appliedAt: -1 });
applicationSchema.index({ driveId: 1, status: 1 });
applicationSchema.index({ studentId: 1, appliedAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
