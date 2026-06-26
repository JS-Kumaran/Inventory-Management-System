const { body, param, query } = require('express-validator');

// Category creation validation
const createCategoryValidation = [
    body('name')
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
        .trim()
        .escape(),

    body('parentCategory')
        .optional()
        .isMongoId().withMessage('Invalid parent category ID')
        .custom((value, { req }) => {
            // Check for circular reference
            if (value === req.params.id) {
                throw new Error('Category cannot be its own parent');
            }
            return true;
        }),

    body('image')
        .optional()
        .isURL().withMessage('Image must be a valid URL')
        .trim(),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
];

// Category update validation
const updateCategoryValidation = [
    param('id')
        .isMongoId().withMessage('Invalid category ID'),

    body('name')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
        .trim()
        .escape(),

    body('parentCategory')
        .optional()
        .isMongoId().withMessage('Invalid parent category ID')
        .custom((value, { req }) => {
            if (value === req.params.id) {
                throw new Error('Category cannot be its own parent');
            }
            return true;
        }),

    body('image')
        .optional()
        .isURL().withMessage('Image must be a valid URL')
        .trim(),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
];

// Category ID validation
const categoryIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid category ID')
];

module.exports = {
    createCategoryValidation,
    updateCategoryValidation,
    categoryIdValidation
};