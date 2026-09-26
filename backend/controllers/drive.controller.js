const Drive = require('../models/Drive.model');
const ApiResponse = require('../utils/ApiResponse');
const cloudinary = require('../config/cloudinary');
const { logger } = require('../config/logger');
const { getCache, setCache, invalidateCache } = require('../services/cache.service');

/**
 * @desc    Create a new drive
 * @route   POST /api/drives
 * @access  Private (Admin/HR)
 */
exports.createDrive = async (req, res, next) => {
  try {
    const driveData = {
      ...req.body,
      createdBy: req.user.id,
      createdByModel: req.user.role === 'admin' ? 'Admin' : 'User',
    };

    if (req.files) {
      if (req.files['companyLogo'] && req.files['companyLogo'][0]) {
        driveData.companyLogo = req.files['companyLogo'][0].path;
      }
      if (req.files['drivePdf'] && req.files['drivePdf'][0]) {
        driveData.drivePdf = req.files['drivePdf'][0].path;
      }
    }

    const drive = await Drive.create(driveData);

    // Invalidate drives cache on new drive creation
    await invalidateCache('drives:*');

    return ApiResponse.success(res, 'Drive created successfully', drive, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all drives (with optional filtering)
 * @route   GET /api/drives
 * @access  Private (Students, Admin, HR)
 */
exports.getAllDrives = async (req, res, next) => {
  try {
    // Generate cache key based on query parameters (Cache-Aside Pattern)
    const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : 'all';
    const cacheKey = `drives:${queryString}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, 'Drives fetched successfully', cachedData);
    }

    const filter = {};
    if (req.query.status && typeof req.query.status === 'string') {
      filter.status = req.query.status;
    }

    if (req.query.search && typeof req.query.search === 'string') {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [
        { companyName: searchRegex },
        { jobRole: searchRegex }
      ];
    }

    const limit = parseInt(req.query.limit, 10) || 0;
    const page  = parseInt(req.query.page, 10)  || 1;
    const skip  = limit > 0 ? (page - 1) * limit : 0;

    const query = Drive.find(filter).sort({ createdAt: -1 });
    
    if (limit > 0) {
      query.skip(skip).limit(limit);
    }

    const [drives, total] = await Promise.all([
      query,
      Drive.countDocuments(filter),
    ]);

    const result = {
      drives,
      total,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 1,
    };

    // Cache drives list for 60 seconds in memory
    await setCache(cacheKey, result, 60);

    return ApiResponse.success(res, 'Drives fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single drive by ID
 * @route   GET /api/drives/:id
 * @access  Private (Students, Admin, HR)
 */
exports.getDriveById = async (req, res, next) => {
  try {
    const cacheKey = `drive:${req.params.id}`;
    const cachedDrive = await getCache(cacheKey);
    if (cachedDrive) {
      return ApiResponse.success(res, 'Drive details fetched successfully', cachedDrive);
    }

    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return ApiResponse.error(res, 'Drive not found', 404);
    }

    await setCache(cacheKey, drive, 60);

    return ApiResponse.success(res, 'Drive details fetched successfully', drive);
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid drive ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Update drive details
 * @route   PATCH /api/drives/:id
 * @access  Private (Admin/HR)
 */
exports.updateDrive = async (req, res, next) => {
  try {
    const existingDrive = await Drive.findById(req.params.id);
    if (!existingDrive) {
      return ApiResponse.error(res, 'Drive not found', 404);
    }

    // Whitelist editable fields — prevents injection of isActive, createdBy, etc.
    const ALLOWED_DRIVE_FIELDS = [
      'companyName', 'companyDescription', 'jobRole', 'ctc', 'location',
      'jobType', 'eligibility', 'registrationDeadline', 'driveDate', 'status',
    ];
    const updateData = {};
    ALLOWED_DRIVE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    if (req.files) {
      if (req.files['companyLogo'] && req.files['companyLogo'][0]) {
        updateData.companyLogo = req.files['companyLogo'][0].path;

        // Delete old logo if it exists
        if (existingDrive.companyLogo && existingDrive.companyLogo.includes('res.cloudinary.com')) {
          try {
            const parts = existingDrive.companyLogo.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1) {
              let pathParts = parts.slice(uploadIndex + 1);
              if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
                 pathParts = pathParts.slice(1);
              }
              const publicIdWithExt = pathParts.join('/');
              const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
              if (publicId) {
                 await cloudinary.uploader.destroy(publicId);
              }
            }
          } catch (err) {
            logger.error({ err, driveId: req.params.id }, 'Error deleting old logo from Cloudinary');
          }
        }
      }

      if (req.files['drivePdf'] && req.files['drivePdf'][0]) {
        updateData.drivePdf = req.files['drivePdf'][0].path;

        // Delete old PDF if it exists
        if (existingDrive.drivePdf && existingDrive.drivePdf.includes('res.cloudinary.com')) {
          try {
            const parts = existingDrive.drivePdf.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1) {
              let pathParts = parts.slice(uploadIndex + 1);
              if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
                 pathParts = pathParts.slice(1);
              }
              const publicIdWithExt = pathParts.join('/');
              const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
              if (publicId) {
                 await cloudinary.uploader.destroy(publicId);
              }
            }
          } catch (err) {
            logger.error({ err, driveId: req.params.id }, 'Error deleting old PDF from Cloudinary');
          }
        }
      }
    }

    // Handle explicit removal of drive PDF brochure
    if (String(req.body.removeDrivePdf) === 'true' && (!req.files || !req.files['drivePdf'])) {
      if (existingDrive.drivePdf && existingDrive.drivePdf.includes('res.cloudinary.com')) {
        try {
          const parts = existingDrive.drivePdf.split('/');
          const uploadIndex = parts.indexOf('upload');
          if (uploadIndex !== -1) {
            let pathParts = parts.slice(uploadIndex + 1);
            if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
               pathParts = pathParts.slice(1);
            }
            const publicIdWithExt = pathParts.join('/');
            const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
            if (publicId) {
               await cloudinary.uploader.destroy(publicId);
            }
          }
        } catch (err) {
          logger.error({ err, driveId: req.params.id }, 'Error deleting PDF on removal request from Cloudinary');
        }
      }
      updateData.drivePdf = null;
    }

    const drive = await Drive.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!drive) {
      return ApiResponse.error(res, 'Drive not found', 404);
    }

    // Invalidate drive list and specific drive cache
    await invalidateCache('drives:*', `drive:${req.params.id}`);

    return ApiResponse.success(res, 'Drive updated successfully', drive);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a drive
 * @route   DELETE /api/drives/:id
 * @access  Private (Admin/HR)
 */
exports.deleteDrive = async (req, res, next) => {
  try {
    // Bypass the isActive pre-find hook to find the raw document
    const drive = await Drive.findOne({
      _id: req.params.id,
      isActive: { $exists: true },
    });

    if (!drive) {
      return ApiResponse.error(res, 'Drive not found', 404);
    }

    drive.isActive = false;
    await drive.save();

    // Invalidate drive cache
    await invalidateCache('drives:*', `drive:${req.params.id}`);

    return ApiResponse.success(res, 'Drive deleted successfully');
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid drive ID format', 400);
    }
    next(error);
  }
};
