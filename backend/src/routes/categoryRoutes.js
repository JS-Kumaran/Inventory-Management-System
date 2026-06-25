const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    validate, 
    body, 
    validateObjectId 
} = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');
const {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
} = require('../controllers/categoryController');

router.use(protect);

router.get('/', getCategories);

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Category name is required'),
        body('description').optional().isString(),
        body('parentCategory').optional().isMongoId().withMessage('Invalid parent category'),
    ],
    validate,
    authorize('admin', 'manager'),
    createCategory
);

router.get(
    '/:id',
    validateObjectId('id'),
    validate,
    getCategory
);

router.put(
    '/:id',
    validateObjectId('id'),
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().isString(),
        body('parentCategory').optional().isMongoId().withMessage('Invalid parent category'),
        body('isActive').optional().isBoolean(),
    ],
    validate,
    authorize('admin', 'manager'),
    updateCategory
);

router.delete(
    '/:id',
    validateObjectId('id'),
    validate,
    authorize('admin'),
    deleteCategory
);

router.post(
    '/:id/upload',
    validateObjectId('id'),
    validate,
    uploadSingle('image'),
    authorize('admin', 'manager'),
    uploadCategoryImage
);

module.exports = router;