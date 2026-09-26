const express = require('express');
const {
  createDrive,
  getAllDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} = require('../controllers/drive.controller');
const { verifyAccessToken, restrictToRoles } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const {
  createDriveValidation,
  updateDriveValidation,
} = require('../validators/drive.validators');
const { uploadDriveFiles } = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

const parseEligibility = (req, res, next) => {
  if (req.body && req.body.eligibility && typeof req.body.eligibility === 'string') {
    try {
      req.body.eligibility = JSON.parse(req.body.eligibility);
    } catch(e) {}
  }
  next();
};

// Apply verifyAccessToken to all routes
router.use(verifyAccessToken);

// Route: /api/drives
router
  .route('/')
  .get(getAllDrives) // Public/Students
  .post(restrictToRoles(ROLES.ADMIN), uploadDriveFiles.fields([{ name: 'companyLogo', maxCount: 1 }, { name: 'drivePdf', maxCount: 1 }]), parseEligibility, ...createDriveValidation, validateRequest, createDrive); // Admin only

// Route: /api/drives/:id
router
  .route('/:id')
  .get(getDriveById) // Public/Students
  .patch(restrictToRoles(ROLES.ADMIN), uploadDriveFiles.fields([{ name: 'companyLogo', maxCount: 1 }, { name: 'drivePdf', maxCount: 1 }]), parseEligibility, ...updateDriveValidation, validateRequest, updateDrive) // Admin only
  .delete(restrictToRoles(ROLES.ADMIN), deleteDrive); // Admin only

module.exports = router;

 
