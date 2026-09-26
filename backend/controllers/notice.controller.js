const Notice = require('../models/Notice.model');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const ApiResponse = require('../utils/ApiResponse');
const { logger } = require('../config/logger');
const cloudinary = require('../config/cloudinary');
const { getCache, setCache, invalidateCache } = require('../services/cache.service');

// Helper: return the correct model based on the authenticated user's role
const getActorModel = (role) => (role === 'admin' ? Admin : User);

// ── Timeframe Constants ────────────────────────────────────────────────────────
const ARCHIVE_AFTER_DAYS = 30;  // Auto-archive active notices after 30 days
const PURGE_AFTER_DAYS   = 60;  // Permanently delete archived notices after 60 days

// ────────────────────────────────────────────────────────────────────────────────
//  CREATE / READ / UPDATE / DELETE (Standard CRUD)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new notice
 * @route   POST /api/notices
 * @access  Private (Admin / HR)
 */
exports.createNotice = async (req, res, next) => {
  try {
    const { title, body, category } = req.body;
    let { attachmentUrl, attachmentName } = req.body;

    // Override with uploaded file if present
    if (req.file) {
      attachmentUrl = req.file.path;
      attachmentName = req.file.originalname;
    }

    const notice = await Notice.create({
      title,
      body,
      category,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      postedBy: req.user.id,
      postedByModel: req.user.role === 'admin' ? 'Admin' : 'User',
    });

    // Populate postedBy for the response
    await notice.populate('postedBy', 'fullName role');

    logger.info({ event: 'notice_created', noticeId: notice._id, userId: req.user.id }, 'Notice created');

    // Invalidate notices cache
    await invalidateCache('notices:*');

    return ApiResponse.success(res, 'Notice created successfully', notice, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active (non-archived) notices (with filters & pagination)
 * @route   GET /api/notices
 * @access  Private (All authenticated users)
 */
exports.getAllNotices = async (req, res, next) => {
  try {
    // Generate cache key based on query parameters (Cache-Aside Pattern)
    const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : 'all';
    const cacheKey = `notices:${queryString}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, 'Notices fetched successfully', cachedData);
    }

    const filter = {}; // isActive: true AND isArchived: false applied automatically by pre-find hook

    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category;
    }

    if (req.query.search && typeof req.query.search === 'string') {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapeRegex(req.query.search), $options: 'i' } },
        { body: { $regex: escapeRegex(req.query.search), $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 0;
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const query = Notice.find(filter)
      .populate('postedBy', 'fullName role')
      .sort(sort);

    if (limit > 0) {
      query.skip(skip).limit(limit);
    }

    const [notices, total] = await Promise.all([
      query,
      Notice.countDocuments(filter),
    ]);

    const result = {
      notices,
      total,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 1,
      pagination: {
        currentPage: page,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
        totalItems: total,
        itemsPerPage: limit || total,
      },
    };

    // Cache notices list for 60 seconds in memory
    await setCache(cacheKey, result, 60);

    return ApiResponse.success(res, 'Notices fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

// Alias for backwards compatibility
exports.getNotices = exports.getAllNotices;

/**
 * @desc    Get a single notice by ID
 * @route   GET /api/notices/:id
 * @access  Private (All authenticated users)
 */
exports.getNoticeById = async (req, res, next) => {
  try {
    const cacheKey = `notice:${req.params.id}`;
    const cachedNotice = await getCache(cacheKey);
    if (cachedNotice) {
      return ApiResponse.success(res, 'Notice fetched successfully', cachedNotice);
    }

    const notice = await Notice.findById(req.params.id).populate('postedBy', 'fullName role');

    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    await setCache(cacheKey, notice, 60);

    return ApiResponse.success(res, 'Notice fetched successfully', notice);
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Update a notice
 * @route   PUT /api/notices/:id
 * @access  Private (Admin / HR who created it)
 */
exports.updateNotice = async (req, res, next) => {
  try {
    const { title, body, category, removePdf } = req.body;
    let { attachmentUrl, attachmentName } = req.body;

    const notice = await Notice.findOne({
      _id: req.params.id,
      isActive: { $exists: true },
    });

    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    // Check authorization - only creator or admin can update
    if (notice.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to update this notice', 403);
    }

    // Explicit removal of attachment requested
    if (String(removePdf) === 'true' && !req.file) {
      if (notice.attachmentUrl) {
        try {
          const publicIdMatch = notice.attachmentUrl.match(/\/v\d+\/(.+?)\.\w+$/);
          const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
          }
        } catch (err) {
          logger.error('Failed to delete notice PDF from Cloudinary on removal:', err);
        }
      }
      attachmentUrl = null;
      attachmentName = null;
      notice.attachmentUrl = null;
      notice.attachmentName = null;
    }
    // Handle new file upload
    else if (req.file) {
      attachmentUrl = req.file.path;
      attachmentName = req.file.originalname;

      // Clean up old file from Cloudinary if it exists
      if (notice.attachmentUrl) {
        try {
          const publicIdMatch = notice.attachmentUrl.match(/\/v\d+\/(.+?)\.\w+$/);
          const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
          }
        } catch (err) {
          logger.error('Failed to delete old notice PDF from Cloudinary:', err);
        }
      }
      notice.attachmentUrl = attachmentUrl;
      notice.attachmentName = attachmentName;
    } else {
      if (attachmentUrl !== undefined) notice.attachmentUrl = attachmentUrl;
      if (attachmentName !== undefined) notice.attachmentName = attachmentName;
    }

    if (title) notice.title = title;
    if (body) notice.body = body;
    if (category) notice.category = category;

    await notice.save();
    await notice.populate('postedBy', 'fullName role');

    logger.info({ event: 'notice_updated', noticeId: notice._id, userId: req.user.id }, 'Notice updated');

    // Invalidate notices list and specific notice cache
    await invalidateCache('notices:*', `notice:${notice._id}`);

    return ApiResponse.success(res, 'Notice updated successfully', notice);
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Soft-delete a notice (sets isActive = false)
 * @route   DELETE /api/notices/:id
 * @access  Private (Admin / HR who created it)
 */
exports.deleteNotice = async (req, res, next) => {
  try {
    // Bypass the isActive pre-find hook to find the raw document
    const notice = await Notice.findOne({
      _id: req.params.id,
      isActive: { $exists: true },
    });

    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    // Check authorization
    if (notice.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to delete this notice', 403);
    }

    // Clean up file from Cloudinary if it exists
    if (notice.attachmentUrl) {
      try {
        const publicIdMatch = notice.attachmentUrl.match(/\/v\d+\/(.+?)\.\w+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        }
      } catch (err) {
        logger.error('Failed to delete notice PDF from Cloudinary on notice deletion:', err);
      }
    }

    notice.isActive = false;
    await notice.save();

    logger.info({ event: 'notice_deleted', noticeId: notice._id, userId: req.user.id }, 'Notice soft-deleted');

    // Invalidate notices cache
    await invalidateCache('notices:*', `notice:${req.params.id}`);

    return ApiResponse.success(res, 'Notice deleted successfully');
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
//  ARCHIVE / UNARCHIVE (Soft Delete / Restore)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Archive a notice (admin action)
 *          Sets isArchived=true, archivedAt=now — immediately hides from students
 * @route   PATCH /api/notices/:id/archive
 * @access  Private (Admin / HR who created it)
 */
exports.archiveNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({
      _id: req.params.id,
      isActive: { $exists: true },
    });

    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    if (notice.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to archive this notice', 403);
    }

    if (notice.isArchived) {
      return ApiResponse.error(res, 'Notice is already archived', 400);
    }

    notice.isArchived = true;
    notice.archivedAt = new Date();
    await notice.save();

    logger.info({ event: 'notice_archived', noticeId: notice._id, userId: req.user.id }, 'Notice archived');

    // Invalidate notices cache
    await invalidateCache('notices:*', `notice:${notice._id}`);

    return ApiResponse.success(res, 'Notice archived successfully', notice);
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Restore an archived notice back to active
 *          Clears isArchived and archivedAt — notice reappears on student dashboard
 * @route   PATCH /api/notices/:id/restore
 * @access  Private (Admin only)
 */
exports.restoreNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({
      _id: req.params.id,
      isActive: { $exists: true },
    });

    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    if (!notice.isArchived) {
      return ApiResponse.error(res, 'Notice is not archived', 400);
    }

    notice.isArchived = false;
    notice.archivedAt = null;
    await notice.save();

    logger.info({ event: 'notice_restored', noticeId: notice._id, userId: req.user.id }, 'Notice restored');

    // Invalidate notices cache
    await invalidateCache('notices:*', `notice:${notice._id}`);

    return ApiResponse.success(res, 'Notice restored successfully', notice);
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get all archived notices (Admin only)
 * @route   GET /api/notices/archived
 * @access  Private (Admin only)
 */
exports.getArchivedNotices = async (req, res, next) => {
  try {
    const filter = { isActive: { $exists: true }, isArchived: true };

    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category;
    }

    if (req.query.search && typeof req.query.search === 'string') {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapeRegex(req.query.search), $options: 'i' } },
        { body: { $regex: escapeRegex(req.query.search), $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 0;
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const sortBy = req.query.sortBy || 'archivedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const query = Notice.find(filter)
      .populate('postedBy', 'fullName role')
      .sort(sort);

    if (limit > 0) {
      query.skip(skip).limit(limit);
    }

    const [notices, total] = await Promise.all([
      query,
      Notice.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 'Archived notices fetched successfully', {
      notices,
      total,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 1,
      pagination: {
        currentPage: page,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
        totalItems: total,
        itemsPerPage: limit || total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Read-tracking (per-user) ───────────────────────────────────────────────────

/**
 * @desc    Mark a notice as read for the logged-in user
 * @route   PATCH /api/notices/:id/read
 * @access  Private (All authenticated users)
 */
exports.markNoticeRead = async (req, res, next) => {
  try {
    const noticeId = req.params.id;

    // Validate that the notice exists
    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return ApiResponse.error(res, 'Notice not found', 404);
    }

    // Route to the correct collection — Admin docs live in Admin, students in User
    const ActorModel = getActorModel(req.user.role);

    // $addToSet ensures no duplicates
    await ActorModel.findByIdAndUpdate(req.user.id, {
      $addToSet: { readNotices: noticeId },
    });

    return ApiResponse.success(res, 'Notice marked as read');
  } catch (error) {
    if (error.name === 'CastError') {
      return ApiResponse.error(res, 'Invalid notice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get the list of notice IDs the logged-in user has read
 * @route   GET /api/notices/read
 * @access  Private (All authenticated users)
 */
exports.getReadNotices = async (req, res, next) => {
  try {
    // Route to the correct collection — Admin docs live in Admin, students in User
    const ActorModel = getActorModel(req.user.role);
    const actor = await ActorModel.findById(req.user.id).select('readNotices');
    return ApiResponse.success(res, 'Read notices fetched', {
      readNotices: actor?.readNotices || [],
    });
  } catch (error) {
    next(error);
  }
};

// ── Internal Cron Handlers ─────────────────────────────────────────────────────

/**
 * Auto-archive all active notices older than ARCHIVE_AFTER_DAYS (30 days).
 * Called by the cron service daily at midnight.
 */
exports.runAutoArchive = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS);

  const result = await Notice.updateMany(
    {
      isArchived: { $ne: true },
      isActive: true,
      createdAt: { $lt: cutoff },
    },
    {
      $set: { isArchived: true, archivedAt: new Date() },
    }
  );

  return result.modifiedCount;
};

/**
 * Permanently hard-delete archived notices older than PURGE_AFTER_DAYS (60 days) from archivedAt.
 * Called by the cron service daily at midnight.
 */
exports.runPurgeArchived = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS);

  const result = await Notice.deleteMany({
    isActive: { $exists: true },
    isArchived: true,
    archivedAt: { $lt: cutoff },
  });

  return result.deletedCount;
};

/**
 * @desc    Get notice statistics (Admin only)
 * @route   GET /api/notices/stats
 * @access  Private (Admin only)
 */
exports.getNoticeStats = async (req, res, next) => {
  try {
    const [activeCount, archivedCount, totalCount] = await Promise.all([
      Notice.countDocuments({ isActive: true, isArchived: { $ne: true } }),
      Notice.countDocuments({ isActive: { $exists: true }, isArchived: true }),
      Notice.countDocuments({ isActive: { $exists: true } }),
    ]);

    const byCategory = await Notice.aggregate([
      { $match: { isActive: true, isArchived: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ApiResponse.success(res, 'Notice statistics fetched successfully', {
      active: activeCount,
      archived: archivedCount,
      total: totalCount,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
};
