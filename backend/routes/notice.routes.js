const express = require('express');
const {
  createNotice,
  getAllNotices,
  getNoticeById,
  deleteNotice,
  updateNotice,
  archiveNotice,
  restoreNotice,
  getArchivedNotices,
  markNoticeRead,
  getReadNotices,
} = require('../controllers/notice.controller');
const { verifyAccessToken, restrictToRoles } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const {
  createNoticeValidation,
  updateNoticeValidation,
} = require('../validators/notice.validators');
const { ROLES } = require('../constants/roles');
const { uploadNoticeFile } = require('../middleware/upload.middleware');


const router = express.Router();

// Apply token verification to all notice routes
router.use(verifyAccessToken);

// ── Admin-only: Archive management ──────────────────────────────────────────────
// IMPORTANT: /archived must be defined BEFORE /:id to avoid route collision
router.get('/archived', restrictToRoles(ROLES.ADMIN), getArchivedNotices);
router.patch('/:id/archive', restrictToRoles(ROLES.ADMIN), archiveNotice);
router.patch('/:id/restore', restrictToRoles(ROLES.ADMIN), restoreNotice);

// ── Read-tracking (all authenticated users) ─────────────────────────────────────
// IMPORTANT: /read must be defined BEFORE /:id to avoid route collision
router.get('/read', getReadNotices);
router.patch('/:id/read', markNoticeRead);

// Route: /api/notices
router
  .route('/')
  .get(getAllNotices)                              // All logged-in users (students read)
  .post(restrictToRoles(ROLES.ADMIN), uploadNoticeFile.single('noticePdf'), ...createNoticeValidation, validateRequest, createNotice); // Admin only

// Route: /api/notices/:id
router
  .route('/:id')
  .get(getNoticeById)                              // All logged-in users
  .put(restrictToRoles(ROLES.ADMIN), uploadNoticeFile.single('noticePdf'), ...updateNoticeValidation, validateRequest, updateNotice)     // Admin only
  .delete(restrictToRoles(ROLES.ADMIN), deleteNotice); // Admin only

module.exports = router;
