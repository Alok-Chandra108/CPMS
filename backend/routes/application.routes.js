const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { verifyAccessToken, restrictToRoles } = require('../middleware/auth.middleware');
const { applyLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../constants/roles');

// All application routes are protected
router.use(verifyAccessToken);

router.post('/apply/:driveId', restrictToRoles(ROLES.STUDENT), applyLimiter, applicationController.applyToDrive);
router.get('/my-applications', restrictToRoles(ROLES.STUDENT), applicationController.getStudentApplications);

// Admin Routes
router.get('/drive/:driveId', restrictToRoles(ROLES.ADMIN), applicationController.getDriveApplications);
router.patch('/bulk-status', restrictToRoles(ROLES.ADMIN), applicationController.updateBulkApplicationStatus);
router.patch('/:applicationId/status', restrictToRoles(ROLES.ADMIN), applicationController.updateApplicationStatus);

module.exports = router;
