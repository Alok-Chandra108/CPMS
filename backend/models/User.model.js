const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../constants/roles');

const { EMAIL_REGEX } = require('../constants/validation');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxLength: [60, 'Full name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address'],
    },
    usnNumber: {
      type: String,
      required: [true, 'USN Number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: [ROLES.STUDENT, ROLES.ADMIN],
      default: ROLES.STUDENT,
    },
    department: {
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
      required: [true, 'Department is required'],
    },
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', 'Final Year'],
      required: [true, 'Year of study is required'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileComplete: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
    readNotices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice',
      },
    ],
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

// Method: generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// Compound indexes for admin directory filtering and role queries
userSchema.index({ role: 1, department: 1, createdAt: -1 });
userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
