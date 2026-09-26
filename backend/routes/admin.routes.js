const express = require('express');
const { getDashboardStats, getAllStudents, getStudentById, getDriveReport } = require('../controllers/admin.controller');
const { verifyAccessToken, restrictToRoles } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(verifyAccessToken);
router.use(restrictToRoles(ROLES.ADMIN));

// Route: /api/admin/stats
router.get('/stats', getDashboardStats);

// Route: /api/admin/students
router.get('/students', getAllStudents);

// Route: /api/admin/students/:id
router.get('/students/:id', getStudentById);
// Route: /api/admin/reports/drive/:driveId
router.get('/reports/drive/:driveId', getDriveReport);

module.exports = router;
