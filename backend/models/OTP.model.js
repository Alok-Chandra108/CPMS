const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
    unique: true, // Prevent duplicate OTPs for same email - fixes race condition
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL index — auto-delete after 10 minutes
  },
});

// Pre-save hook: hash OTP before storing
otpSchema.pre('save', async function () {
  if (!this.isModified('otp')) return;

  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

// Method: compare OTP
otpSchema.methods.compareOTP = async function (candidateOTP) {
  return bcrypt.compare(candidateOTP, this.otp);
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
