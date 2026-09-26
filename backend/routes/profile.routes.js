const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  deleteResume,
} = require('../controllers/profile.controller');
const {
  updateProfileValidation,
} = require('../validators/profile.validators');
const { verifyAccessToken, restrictToRoles } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const { upload } = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');


// All profile routes require authentication + student role
router.use(verifyAccessToken);
router.use(restrictToRoles(ROLES.STUDENT));

// GET  /api/profile/me — Fetch current student's profile
router.get('/me', getMyProfile);

// PUT  /api/profile/me — Update current student's profile
router.put('/me', updateProfileValidation, validateRequest, updateMyProfile);

// POST /api/profile/resume — Upload resume
router.post('/resume', upload.single('resume'), uploadResume);

// DELETE /api/profile/resume — Delete resume
router.delete('/resume', deleteResume);

module.exports = router;
