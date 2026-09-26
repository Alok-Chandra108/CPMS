const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: null, // Can store Cloudinary URL
    },
    drivePdf: {
      type: String,
      default: null, // Stores Cloudinary URL for the drive PDF brochure
    },
    companyDescription: {
      type: String,
      required: [true, 'Company description is required'],
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    ctc: {
      type: String, // e.g., "12 LPA", "Fixed 8 + 2 Variable"
      required: [true, 'CTC is required'],
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Internship + Full-time'],
      required: [true, 'Job type is required'],
    },
    eligibility: {
      minCgpa: {
        type: Number,
        default: 0,
      },
      minTenthPercent: {
        type: Number,
        default: 0,
      },
      minTwelfthPercent: {
        type: Number,
        default: 0,
      },
      maxBacklogs: {
        type: Number,
        default: 0, // 0 means no active backlogs allowed
      },
      eligibleBranches: [
        {
          type: String,
          enum: [
            'Aeronautical Engineering',
            'Artificial Intelligence & Machine Learning',
            'Civil Engineering',
            'Computer Science & Engineering',
            'Computer Science & Engineering (Artificial Intelligence & Machine Learning)',
            'Computer Science & Engineering (IoT & Cyber Security with Blockchain Technology)',
            'Electronics & Communication Engineering',
            'Information Science & Engineering',
            'Mechanical Engineering',
            'Mechatronics Engineering',
            'Robotics & Artificial Intelligence',
            'MCA (Master of Computer Applications)',
            'MBA (Master of Business Administration)',
            'M.Tech in Computer Science & Engineering',
            'M.Tech in Mechatronics',
          ],
        },
      ],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    driveDate: {
      type: Date,
      required: [true, 'Drive date is required'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel', // dynamic ref — resolves to 'Admin' or 'User'
      required: true,
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'User'],
      default: 'Admin', // drives are always created by admins
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if registration is open
driveSchema.virtual('isRegistrationOpen').get(function () {
  return this.status === 'open' && new Date() <= this.registrationDeadline;
});

// Auto-update status based on dates (optional logic to run on save or fetch)
driveSchema.pre('save', function () {
  const now = new Date();
  if (this.status !== 'closed') {
    if (now > this.registrationDeadline) {
      this.status = 'closed';
    } else if (this.isNew) {
      // For new documents, auto-transition to 'open' if it defaulted to 'upcoming' or was explicitly set to 'open'
      const isUpcomingDefaulted = this.status === 'upcoming' && (typeof this.$isDefault === 'function' ? this.$isDefault('status') : true);
      const isOpenExplicit = this.status === 'open';
      if (isUpcomingDefaulted || isOpenExplicit) {
        this.status = 'open';
      }
    }
    // Existing documents keep their status (e.g. 'upcoming' stays 'upcoming') unless expired
  }
});

// Allow virtuals in JSON
driveSchema.set('toJSON', { virtuals: true });
driveSchema.set('toObject', { virtuals: true });

// Only return active drives in queries by default
driveSchema.pre(/^find/, function () {
  // Allow bypassing for admin queries by passing { isActive: { $exists: true } }
  if (this.getFilter().isActive === undefined) {
    this.where({ isActive: true });
  }
});

// Compound indexes for high-traffic query acceleration
driveSchema.index({ isActive: 1, status: 1, createdAt: -1 });
driveSchema.index({ status: 1, registrationDeadline: 1 });
driveSchema.index({ createdBy: 1, createdAt: -1 });

const Drive = mongoose.model('Drive', driveSchema);

module.exports = Drive;
