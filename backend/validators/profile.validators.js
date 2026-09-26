const { body } = require('express-validator');

/**
 * Validation rules for PUT /api/profile/me
 * All fields are optional (partial update), but if provided they must be valid.
 */
const updateProfileValidation = [
  // ── Personal Info ────────────────────────────────────────────
  body('phone')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Please enter a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const dob = new Date(value);
      const now = new Date();
      const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 15 || age > 40) {
        throw new Error('Date of birth must correspond to an age between 15 and 40');
      }
      return true;
    }),

  body('gender')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address cannot exceed 300 characters'),

  // ── Academic Details ─────────────────────────────────────────
  body('tenthPercentage')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('10th percentage must be between 0 and 100'),

  body('tenthBoard')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('10th Board name cannot exceed 50 characters'),

  body('tenthPassingYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 2000, max: new Date().getFullYear() })
    .withMessage(`10th passing year must be between 2000 and ${new Date().getFullYear()}`),

  body('twelfthPercentage')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('12th percentage must be between 0 and 100'),

  body('twelfthBoard')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('12th Board name cannot exceed 50 characters'),

  body('twelfthPassingYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 2000, max: new Date().getFullYear() })
    .withMessage(`12th passing year must be between 2000 and ${new Date().getFullYear()}`),

  body('cgpa')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),

  body('backlogs')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Backlogs must be a number between 0 and 20'),

  // ── Skills ───────────────────────────────────────────────────
  body('skills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Skills must be an array with a maximum of 20 items'),

  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be 1-50 characters'),

  // ── Projects ─────────────────────────────────────────────────
  body('projects')
    .optional()
    .isArray({ max: 5 })
    .withMessage('You can add a maximum of 5 projects'),

  body('projects.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ max: 100 })
    .withMessage('Project title cannot exceed 100 characters'),

  body('projects.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Project description cannot exceed 500 characters'),

  body('projects.*.techStack')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tech stack must be an array with a maximum of 10 items'),

  body('projects.*.techStack.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tech stack item must be 1-30 characters'),

  body('projects.*.link')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // allow empty string
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Project link must be a valid URL');
      }
    }),

  // ── Certifications ───────────────────────────────────────────
  body('certifications')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Certifications must be an array with a maximum of 10 items'),

  body('certifications.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each certification must be 1-100 characters'),

  // ── Social Links ─────────────────────────────────────────────
  body('linkedIn')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // allow clearing
      try {
        const url = new URL(value);
        if (!url.hostname.includes('linkedin.com')) {
          throw new Error();
        }
        return true;
      } catch {
        throw new Error('Please enter a valid LinkedIn URL');
      }
    }),

  body('github')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // allow clearing
      try {
        const url = new URL(value);
        if (!url.hostname.includes('github.com')) {
          throw new Error();
        }
        return true;
      } catch {
        throw new Error('Please enter a valid GitHub URL');
      }
    }),
];

module.exports = { updateProfileValidation };
