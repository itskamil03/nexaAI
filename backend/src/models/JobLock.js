const mongoose = require('mongoose');

const jobLockSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g., 'daily_roi_2026-10-31'
      required: true,
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PROCESSING',
    },
    workerId: {
      type: String,
      required: true,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const JobLock = mongoose.model('JobLock', jobLockSchema);

module.exports = JobLock;
