const { body } = require('express-validator');

const VALID_BRANCHES = [
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

const VALID_JOB_TYPES = ['Full-time', 'Internship', 'Internship + Full-time'];
const VALID_STATUSES  = ['upcoming', 'open', 'closed'];

/**
 * Shared validation rules used by both create and update.
 * Fields are optional during updates (via updateDriveValidation wrapper).
 */
const driveFieldRules = [
  body('companyName')
    .optional()
    .trim()
    .notEmpty().withMessage('Company name cannot be blank')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),

  body('companyDescription')
    .optional()
    .trim()
    .notEmpty().withMessage('Company description cannot be blank')
    .isLength({ max: 2000 }).withMessage('Company description cannot exceed 2000 characters'),

  body('jobRole')
    .optional()
    .trim()
    .notEmpty().withMessage('Job role cannot be blank')
    .isLength({ max: 100 }).withMessage('Job role cannot exceed 100 characters'),

  body('ctc')
    .optional()
    .trim()
    .notEmpty().withMessage('CTC cannot be blank')
    .isLength({ max: 100 }).withMessage('CTC cannot exceed 100 characters'),

  body('location')
    .optional()
    .trim()
    .notEmpty().withMessage('Location cannot be blank')
    .isLength({ max: 150 }).withMessage('Location cannot exceed 150 characters'),

  body('jobType')
    .optional()
    .isIn(VALID_JOB_TYPES)
    .withMessage(`Job type must be one of: ${VALID_JOB_TYPES.join(', ')}`),

  // Eligibility — nested object
  body('eligibility.minCgpa')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Min CGPA must be between 0 and 10'),

  body('eligibility.minTenthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min 10th percentage must be between 0 and 100'),

  body('eligibility.minTwelfthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min 12th percentage must be between 0 and 100'),

  body('eligibility.maxBacklogs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max backlogs must be a non-negative integer'),

  body('eligibility.eligibleBranches')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one eligible branch must be selected'),

  body('eligibility.eligibleBranches.*')
    .optional()
    .isIn(VALID_BRANCHES)
    .withMessage('One or more eligible branches are invalid'),

  // Dates
  body('registrationDeadline')
    .optional()
    .isISO8601().toDate()
    .withMessage('Registration deadline must be a valid date'),

  body('driveDate')
    .optional()
    .isISO8601().toDate()
    .withMessage('Drive date must be a valid date'),

  // Custom cross-field date validation
  body('driveDate').optional().custom((driveDate, { req }) => {
    const reg = req.body.registrationDeadline;
    if (driveDate && reg && new Date(driveDate) < new Date(reg)) {
      throw new Error('Drive date must be on or after the registration deadline');
    }
    return true;
  }),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('companyLogo')
    .optional({ nullable: true, checkFalsy: true }),
];

/**
 * @desc Validation for POST /api/drives (create)
 *       Makes required fields mandatory.
 */
const createDriveValidation = [
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),

  body('companyDescription')
    .trim()
    .notEmpty().withMessage('Company description is required')
    .isLength({ max: 2000 }).withMessage('Company description cannot exceed 2000 characters'),

  body('jobRole')
    .trim()
    .notEmpty().withMessage('Job role is required')
    .isLength({ max: 100 }).withMessage('Job role cannot exceed 100 characters'),

  body('ctc')
    .trim()
    .notEmpty().withMessage('CTC is required')
    .isLength({ max: 100 }).withMessage('CTC cannot exceed 100 characters'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 150 }).withMessage('Location cannot exceed 150 characters'),

  body('jobType')
    .notEmpty().withMessage('Job type is required')
    .isIn(VALID_JOB_TYPES)
    .withMessage(`Job type must be one of: ${VALID_JOB_TYPES.join(', ')}`),

  body('eligibility.minCgpa')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Min CGPA must be between 0 and 10'),

  body('eligibility.minTenthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min 10th percentage must be between 0 and 100'),

  body('eligibility.minTwelfthPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Min 12th percentage must be between 0 and 100'),

  body('eligibility.maxBacklogs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max backlogs must be a non-negative integer'),

  body('eligibility.eligibleBranches')
    .notEmpty().withMessage('At least one eligible branch must be selected')
    .isArray({ min: 1 }).withMessage('At least one eligible branch must be selected'),

  body('eligibility.eligibleBranches.*')
    .isIn(VALID_BRANCHES)
    .withMessage('One or more eligible branches are invalid'),

  body('registrationDeadline')
    .notEmpty().withMessage('Registration deadline is required')
    .isISO8601().toDate()
    .withMessage('Registration deadline must be a valid date'),

  body('driveDate')
    .notEmpty().withMessage('Drive date is required')
    .isISO8601().toDate()
    .withMessage('Drive date must be a valid date')
    .custom((driveDate, { req }) => {
      const reg = req.body.registrationDeadline;
      if (reg && new Date(driveDate) < new Date(reg)) {
        throw new Error('Drive date must be on or after the registration deadline');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('companyLogo')
    .optional({ nullable: true, checkFalsy: true }),
];

/**
 * @desc Validation for PATCH /api/drives/:id (partial update)
 *       All fields are optional — only validates what's present.
 */
const updateDriveValidation = driveFieldRules;

module.exports = {
  createDriveValidation,
  updateDriveValidation,
};
