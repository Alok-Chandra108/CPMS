const { body } = require('express-validator');

const VALID_CATEGORIES = ['General', 'Placement', 'Urgent'];

/**
 * @desc Validation for POST /api/notices (create)
 */
const createNoticeValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Notice title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('body')
    .trim()
    .notEmpty().withMessage('Notice body/content is required')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),

  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('attachmentUrl')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Attachment URL must be a valid URL'),

  body('attachmentName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Attachment name cannot exceed 200 characters'),
];

/**
 * @desc Validation for PUT /api/notices/:id (full update)
 *       Title & body required, others optional.
 */
const updateNoticeValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Notice title cannot be blank')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('body')
    .optional()
    .trim()
    .notEmpty().withMessage('Notice body cannot be blank')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),

  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),

  body('attachmentUrl')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Attachment URL must be a valid URL'),

  body('attachmentName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Attachment name cannot exceed 200 characters'),
];

module.exports = {
  createNoticeValidation,
  updateNoticeValidation,
};
