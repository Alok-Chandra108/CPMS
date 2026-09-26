const { body } = require('express-validator');

const DEPARTMENTS = [
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
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Full name must be 2-60 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('usnNumber')
    .trim()
    .notEmpty().withMessage('USN Number is required')
    .isLength({ min: 6, max: 20 }).withMessage('USN Number must be 6-20 characters')
    .isAlphanumeric().withMessage('USN Number must be alphanumeric'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isIn(DEPARTMENTS).withMessage('Please select a valid department'),

  body('yearOfStudy')
    .trim()
    .notEmpty().withMessage('Year of study is required')
    .isIn(YEARS).withMessage('Please select a valid year'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?\":{}|<>]/).withMessage('Password must contain at least one special character'),
];

const verifyEmailValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
];

const resendOTPValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const validateResetTokenValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Token is required'),
];

const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Token is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const adminChangePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendOTPValidation,
  forgotPasswordValidation,
  validateResetTokenValidation,
  resetPasswordValidation,
  adminChangePasswordValidation,
  updateVerifyEmailValidation: [
    body('oldEmail')
      .trim()
      .notEmpty().withMessage('Old email is required')
      .isEmail().withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('newEmail')
      .trim()
      .notEmpty().withMessage('New email is required')
      .isEmail().withMessage('Please enter a valid email')
      .normalizeEmail(),
  ],
};
