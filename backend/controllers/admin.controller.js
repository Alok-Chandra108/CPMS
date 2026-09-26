const User = require('../models/User.model');
const Drive = require('../models/Drive.model');
const Notice = require('../models/Notice.model');
const StudentProfile = require('../models/StudentProfile.model');
const Application = require('../models/Application.model');
const { logger } = require('../config/logger');

/**
 * @desc    Get dashboard statistics for admin overview
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeDrives = await Drive.countDocuments({ status: 'open' });
    
    // Placed students: unique students who have at least one application with status 'selected'
    const placedStudentsList = await Application.distinct('studentId', { status: 'selected' });
    const placedStudents = placedStudentsList.length;

    // Pending applications: applications that have status 'applied'
    const pendingApplications = await Application.countDocuments({ status: 'applied' });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        activeDrives,
        placedStudents,
        pendingApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with pagination, search, and filtering
 * @route   GET /api/admin/students
 * @access  Private (Admin)
 */
exports.getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, branch } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query object
    const query = { role: 'student' };
    
    if (search) {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { usnNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    
    if (branch) {
      query.department = branch;
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    // Fetch profiles to get CGPA
    const userIds = users.map(user => user._id);
    const profiles = await StudentProfile.find({ userId: { $in: userIds } }).select('userId cgpa');
    
    const students = users.map(user => {
      const profile = profiles.find(p => p.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        cgpa: profile ? profile.cgpa : null
      };
    });

    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: students.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single student's full profile (User + StudentProfile)
 * @route   GET /api/admin/students/:id
 * @access  Private (Admin)
 */
exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: 'student' })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const profile = await StudentProfile.findOne({ userId: id });

    res.status(200).json({
      success: true,
      data: {
        user,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed report for a specific drive
 * @route   GET /api/admin/reports/drive/:driveId
 * @access  Private (Admin)
 */
exports.getDriveReport = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    // Fetch the drive details
    const drive = await Drive.findById(driveId).select('companyName jobRole driveDate status');
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    // Aggregate applications by status
    const applicationStats = await Application.aggregate([
      { $match: { driveId: drive._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format the stats into a more readable object
    const statusCounts = {
      applied: 0,
      shortlisted: 0,
      'not-shortlisted': 0,
      'test-cleared': 0,
      'test-failed': 0,
      'interview-scheduled': 0,
      selected: 0,
      rejected: 0,
    };

    let totalApplications = 0;
    applicationStats.forEach(stat => {
      if (statusCounts[stat._id] !== undefined) {
        statusCounts[stat._id] = stat.count;
      }
      totalApplications += stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        drive,
        totalApplications,
        statusCounts
      },
    });
  } catch (error) {
    next(error);
  }
};
