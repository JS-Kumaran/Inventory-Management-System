const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = './src/uploads';
        
        // Determine subfolder based on file type
        if (file.fieldname === 'productImage' || file.fieldname === 'images') {
            uploadPath = './src/uploads/products';
        } else if (file.fieldname === 'categoryImage') {
            uploadPath = './src/uploads/categories';
        } else if (file.fieldname === 'profileImage') {
            uploadPath = './src/uploads/profiles';
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new AppError('Only image files are allowed (jpeg, jpg, png, gif, webp)', 400));
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    },
    fileFilter: fileFilter,
});

// Middleware for multiple files
const uploadMultiple = (fieldName, maxCount = 5) => {
    return upload.array(fieldName, maxCount);
};

// Middleware for single file
const uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

// Middleware for multiple fields
const uploadFields = (fields) => {
    return upload.fields(fields);
};

module.exports = { uploadSingle, uploadMultiple, uploadFields, upload };