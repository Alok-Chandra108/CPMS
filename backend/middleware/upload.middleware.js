const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Max file size constant (2MB) - used in limits and error messages
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// PDF upload configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Sanitize the filename for security
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.pdf$/i, '');
    return {
      folder: `cpms/resumes/${req.user._id}`,
      format: 'pdf', // Cloudinary will automatically handle it as the correct resource type
      public_id: `${Date.now()}-${sanitizedName}`
    };
  },
});

// PDF file filter - checks both mimetype AND extension for defense-in-depth
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf'];
  const allowedExtensions = ['.pdf'];

  const mimeOk = allowedMimeTypes.includes(file.mimetype);
  const extOk = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// 2MB size limit for PDFs + defensive multipart limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,         // Only 1 file per request
    parts: 10,        // Max total parts (fields + files)
    headerPairs: 20,  // Max header key-value pairs per part
  },
});

// Image upload configuration
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.(png|jpg|jpeg)$/i, '');
    return {
      folder: 'cpms/logos',
      allowedFormats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}-${sanitizedName}`
    };
  },
});

// Image file filter - checks both mimetype AND extension
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];

  const mimeOk = allowedMimeTypes.includes(file.mimetype);
  const extOk = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG) are allowed!'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 2MB limit
    files: 1,
    parts: 10,
    headerPairs: 20,
  },
});

// Drive files (Logo + PDF) configuration
const driveStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'drivePdf') {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.pdf$/i, '');
      return {
        folder: 'cpms/drives/pdfs',
        format: 'pdf',
        public_id: `${Date.now()}-${sanitizedName}`
      };
    }
    // Default to logo
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.(png|jpg|jpeg)$/i, '');
    return {
      folder: 'cpms/logos',
      allowedFormats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}-${sanitizedName}`
    };
  },
});

const driveFileFilter = (req, file, cb) => {
  if (file.fieldname === 'companyLogo') {
    return imageFileFilter(req, file, cb);
  } else if (file.fieldname === 'drivePdf') {
    return fileFilter(req, file, cb);
  }
  cb(new Error('Unexpected field!'), false);
};

const uploadDriveFiles = multer({
  storage: driveStorage,
  fileFilter: driveFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 2MB limit per file
    files: 2, // Up to 2 files (1 logo, 1 pdf)
    parts: 20,
    headerPairs: 20,
  },
});

// Notice PDF configuration
const noticeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.pdf$/i, '');
    return {
      folder: 'cpms/notices/pdfs',
      format: 'pdf',
      public_id: `${Date.now()}-${sanitizedName}`
    };
  },
});

const uploadNoticeFile = multer({
  storage: noticeStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 2MB limit
    files: 1, // Only 1 file per request
    parts: 10,
    headerPairs: 20,
  },
});

module.exports = {
  upload,
  uploadImage,
  uploadDriveFiles,
  uploadNoticeFile,
  MAX_FILE_SIZE,
};
