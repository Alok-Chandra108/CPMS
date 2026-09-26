const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Middleware: Verify access token from Authorization header
 */
const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password -refreshToken');
      if (!user) {
        user = await User.findById(decoded.id).select('-password -refreshToken');
      }
    } else {
      user = await User.findById(decoded.id).select('-password -refreshToken');
      if (!user) {
        user = await Admin.findById(decoded.id).select('-password -refreshToken');
      }
    }

    if (!user) {
      return ApiResponse.error(res, 'User not found', 401);
    }

    // Since Admin model might not have isActive defined yet, we check specifically for false
    if (user.isActive === false) {
      return ApiResponse.error(res, 'Account has been deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Access token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 'Invalid access token', 401);
    }
    return ApiResponse.error(res, 'Authentication failed', 401);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 */
const restrictToRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

module.exports = { verifyAccessToken, restrictToRoles };
