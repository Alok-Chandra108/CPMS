const mongoose = require('mongoose');
const User = require('./User.model');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxLength: [100, 'Project title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'Project description cannot exceed 500 characters'],
    },
    techStack: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ── Personal Details ────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['', 'Male', 'Female', 'Other'],
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxLength: [300, 'Address cannot exceed 300 characters'],
      default: '',
    },

    // ── Academic Details ────────────────────────────────────────
    tenthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    tenthBoard: {
      type: String,
      trim: true,
      default: '',
    },
    tenthPassingYear: {
      type: Number,
      default: null,
    },
    twelfthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    twelfthBoard: {
      type: String,
      trim: true,
      default: '',
    },
    twelfthPassingYear: {
      type: Number,
      default: null,
    },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
      default: null,
    },
    backlogs: {
      type: Number,
      min: [0, 'Backlogs cannot be negative'],
      default: 0,
    },

    // ── Skills & Projects ───────────────────────────────────────
    skills: {
      type: [String],
      default: [],
    },
    projects: {
      type: [projectSchema],
      validate: {
        validator: function (arr) {
          return arr.length <= 5;
        },
        message: 'You can add a maximum of 5 projects',
      },
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },

    // ── Resume ──────────────────────────────────────────────────
    resumeUrl: {
      type: String,
      default: null,
    },
    resumePublicId: {
      type: String,
      default: null,
    },

    // ── Social / Links ──────────────────────────────────────────
    linkedIn: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Profile Completion Calculator ─────────────────────────────────
/**
 * Calculates weighted profile completion percentage.
 *
 * Weighted sections:
 *  - Personal Info  (phone, DOB, gender)     → 15%
 *  - Academics      (10th, 12th, CGPA)       → 30%
 *  - Skills         (at least 3 skills)      → 15%
 *  - Projects       (at least 1 project)     → 15%
 *  - Resume         (uploaded)               → 25%
 */
studentProfileSchema.methods.calculateCompletion = function () {
  let score = 0;

  // ── Personal Info (15%) ───────────────────────────────────────
  const personalFields = [this.phone, this.dateOfBirth, this.gender];
  const personalFilled = personalFields.filter((f) => {
    if (f === null || f === undefined) return false;
    if (typeof f === 'string' && f.trim() === '') return false;
    return true;
  }).length;
  score += (personalFilled / personalFields.length) * 15;

  // ── Academics (30%) ───────────────────────────────────────────
  const academicFields = [
    this.tenthPercentage,
    this.tenthBoard,
    this.twelfthPercentage,
    this.twelfthBoard,
    this.cgpa,
  ];
  const academicFilled = academicFields.filter((f) => {
    if (f === null || f === undefined) return false;
    if (typeof f === 'string' && f.trim() === '') return false;
    return true;
  }).length;
  score += (academicFilled / academicFields.length) * 30;

  // ── Skills (15%) ──────────────────────────────────────────────
  if (this.skills && this.skills.length >= 3) {
    score += 15;
  } else if (this.skills && this.skills.length > 0) {
    score += (this.skills.length / 3) * 15;
  }

  // ── Projects (15%) ────────────────────────────────────────────
  if (this.projects && this.projects.length >= 1) {
    score += 15;
  }

  // ── Resume (25%) ──────────────────────────────────────────────
  if (this.resumeUrl && this.resumeUrl.trim() !== '') {
    score += 25;
  }

  return Math.round(score);
};

// ── Pre-save hook: sync completion to User.profileComplete ────────
studentProfileSchema.pre('save', async function () {
  const completion = this.calculateCompletion();
  await User.findByIdAndUpdate(this.userId, { profileComplete: completion });
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
