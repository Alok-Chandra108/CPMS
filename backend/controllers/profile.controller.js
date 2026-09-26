
const StudentProfile = require('../models/StudentProfile.model');
const ApiResponse = require('../utils/ApiResponse');
const cloudinary = require('../config/cloudinary');
const { logger } = require('../config/logger');

// ── Whitelist of updatable fields ───────────────────────────────
// Prevents clients from injecting fields like userId, resumeUrl, etc.
const ALLOWED_FIELDS = [
  'phone',
  'dateOfBirth',
  'gender',
  'address',
  'tenthPercentage',
  'tenthBoard',
  'tenthPassingYear',
  'twelfthPercentage',
  'twelfthBoard',
  'twelfthPassingYear',
  'cgpa',
  'backlogs',
  'skills',
  'projects',
  'certifications',
  'linkedIn',
  'github',
];

/**
 * Sanitize the request body — only allow whitelisted fields.
 */
const sanitizeUpdate = (body) => {
  const clean = {};
  const numericOrDateFields = [
    'dateOfBirth',
    'tenthPercentage',
    'tenthPassingYear',
    'twelfthPercentage',
    'twelfthPassingYear',
    'cgpa',
  ];

  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      if (numericOrDateFields.includes(key) && body[key] === '') {
        clean[key] = null;
      } else {
        clean[key] = body[key];
      }
    }
  }
  return clean;
};

/**
 * GET /api/profile/me
 * Fetch the current student's profile.
 * Auto-creates an empty profile shell if none exists.
 */
const getMyProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return ApiResponse.success(res, 'Profile fetched successfully', {
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/me
 * Update the current student's profile (partial update).
 * Only whitelisted fields are accepted.
 * The profile completion percentage is recalculated automatically via the pre-save hook.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    // Sanitize — strip out any fields not in the whitelist
    const updateData = sanitizeUpdate(req.body);

    if (Object.keys(updateData).length === 0) {
      return ApiResponse.error(res, 'No valid fields provided for update', 400);
    }

    // Find or create profile
    let profile = await StudentProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new StudentProfile({ userId: req.user._id });
    }

    // Apply updates to the document (so pre-save hook fires)
    Object.assign(profile, updateData);

    // Save — triggers pre-save hook which recalculates profileComplete
    await profile.save();

    return ApiResponse.success(res, 'Profile updated successfully', {
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/resume
 * Upload resume (PDF) to Cloudinary
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    let profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new StudentProfile({ userId: req.user._id });
    }

    // Delete existing old resume from Cloudinary
    if (profile.resumePublicId) {
      await cloudinary.uploader.destroy(profile.resumePublicId);
    }

    // Construct download URL by adding the 'fl_attachment' transformation
    // Original path: https://res.cloudinary.com/.../image/upload/v.../...
    // Download path: https://res.cloudinary.com/.../image/upload/fl_attachment/v.../...
    const downloadUrl = req.file.path.replace('/upload/', '/upload/fl_attachment/');

    // Update profile with new resume info
    profile.resumeUrl = downloadUrl;
    profile.resumePublicId = req.file.filename;

    await profile.save();

    return ApiResponse.success(res, 'Resume uploaded successfully', {
      resumeUrl: profile.resumeUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/profile/resume
 * Remove resume from Cloudinary & clear fields
 */
const deleteResume = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    
    if (!profile || !profile.resumePublicId) {
      return ApiResponse.error(res, 'No resume found to delete', 404);
    }

    // Delete from Cloudinary - we must specify the correct resource_type.
    // We can determine this by checking the resumeUrl.
    const resourceType = (profile.resumeUrl && profile.resumeUrl.includes('/raw/')) ? 'raw' : 'image';
    
    try {
      await cloudinary.uploader.destroy(profile.resumePublicId, { 
        resource_type: resourceType 
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary destroy error:', cloudinaryError);
      // We continue anyway to clear the database fields, 
      // as the file might already be gone from Cloudinary.
    }

    profile.resumeUrl = null;
    profile.resumePublicId = null;
    await profile.save();

    return ApiResponse.success(res, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  deleteResume,
};
