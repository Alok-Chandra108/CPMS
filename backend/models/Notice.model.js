const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notice body is required'],
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: ['General', 'Placement', 'Urgent'],
      default: 'General',
    },
    attachmentUrl: {
      type: String,
      default: null, // Cloudinary PDF URL
    },
    attachmentName: {
      type: String,
      default: null, // Display name e.g. "Resume_Template.pdf"
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'postedByModel', // dynamic ref — resolves to 'Admin' or 'User'
      required: true,
    },
    postedByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'User'],
      default: 'Admin', // notices are always posted by admins
    },
    isActive: {
      type: Boolean,
      default: true, // Soft-delete: false = hidden from students
    },
    // ── Archiving ──────────────────────────────────────────────────────────────
    isArchived: {
      type: Boolean,
      default: false, // true = hidden from students, visible in admin archive tab
    },
    archivedAt: {
      type: Date,
      default: null, // Set when notice is archived (manual or auto); used for 60-day TTL purge
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-find hook — student-facing queries automatically exclude:
 *   • Soft-deleted notices  (isActive: false)
 *   • Archived notices      (isArchived: true)
 *
 * Admin bypasses this by passing { isActive: { $exists: true } } in the filter,
 * which signals "raw" access (no default filtering applied).
 */
noticeSchema.pre(/^(find|countDocuments)/, function () {
  if (this.getFilter().isActive === undefined) {
    this.where({ isActive: true, isArchived: { $ne: true } });
  }
});

// Compound indexes for high-traffic query acceleration
noticeSchema.index({ isActive: 1, isArchived: 1, createdAt: -1 });
noticeSchema.index({ isActive: 1, isArchived: 1, category: 1, createdAt: -1 });
noticeSchema.index({ isArchived: 1, archivedAt: -1 });
noticeSchema.index({ postedBy: 1, createdAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
