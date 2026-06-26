const { body, param, query } = require('express-validator');

// Product creation validation
const createProductValidation = [
    body('sku')
        .notEmpty().withMessage('SKU is required')
        .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters')
        .matches(/^[A-Za-z0-9\-_]+$/).withMessage('SKU can only contain letters, numbers, hyphens, and underscores')
        .trim()
        .toUpperCase(),

    body('name')
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters')
        .trim()
        .escape(),

    body('description')
        .optional()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')
        .trim()
        .escape(),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isMongoId().withMessage('Invalid category ID'),

    body('supplier')
        .optional()
        .isMongoId().withMessage('Invalid supplier ID'),

    body('unit')
        .notEmpty().withMessage('Unit is required')
        .isIn(['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set'])
        .withMessage('Invalid unit'),

    body('price.cost')
        .notEmpty().withMessage('Cost price is required')
        .isNumeric().withMessage('Cost price must be a number')
        .isFloat({ min: 0 }).withMessage('Cost price cannot be negative'),

    body('price.selling')
        .notEmpty().withMessage('Selling price is required')
        .isNumeric().withMessage('Selling price must be a number')
        .isFloat({ min: 0 }).withMessage('Selling price cannot be negative')
        .custom((value, { req }) => {
            if (req.body.price && req.body.price.cost && value < req.body.price.cost) {
                throw new Error('Selling price must be greater than or equal to cost price');
            }
            return true;
        }),

    body('price.wholesale')
        .optional()
        .isNumeric().withMessage('Wholesale price must be a number')
        .isFloat({ min: 0 }).withMessage('Wholesale price cannot be negative'),

    body('stock.quantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),

    body('stock.minThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Minimum threshold must be a non-negative integer'),

    body('stock.maxThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Maximum threshold must be a non-negative integer')
        .custom((value, { req }) => {
            if (req.body.stock && req.body.stock.minThreshold && value < req.body.stock.minThreshold) {
                throw new Error('Maximum threshold must be greater than or equal to minimum threshold');
            }
            return true;
        }),

    body('stock.location')
        .optional()
        .isObject().withMessage('Location must be an object'),

    body('taxRate')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),

    body('weight')
        .optional()
        .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),

    body('dimensions')
        .optional()
        .isObject().withMessage('Dimensions must be an object'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    body('isFeatured')
        .optional()
        .isBoolean().withMessage('isFeatured must be a boolean')
];

// Product update validation
const updateProductValidation = [
    param('id')
        .isMongoId().withMessage('Invalid product ID'),

    body('sku')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters')
        .matches(/^[A-Za-z0-9\-_]+$/).withMessage('SKU can only contain letters, numbers, hyphens, and underscores')
        .trim()
        .toUpperCase(),

    body('name')
        .optional()
        .isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters')
        .trim()
        .escape(),

    body('description')
        .optional()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')
        .trim()
        .escape(),

    body('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),

    body('supplier')
        .optional()
        .isMongoId().withMessage('Invalid supplier ID'),

    body('unit')
        .optional()
        .isIn(['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set'])
        .withMessage('Invalid unit'),

    body('price.cost')
        .optional()
        .isNumeric().withMessage('Cost price must be a number')
        .isFloat({ min: 0 }).withMessage('Cost price cannot be negative'),

    body('price.selling')
        .optional()
        .isNumeric().withMessage('Selling price must be a number')
        .isFloat({ min: 0 }).withMessage('Selling price cannot be negative'),

    body('price.wholesale')
        .optional()
        .isNumeric().withMessage('Wholesale price must be a number')
        .isFloat({ min: 0 }).withMessage('Wholesale price cannot be negative'),

    body('stock.quantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),

    body('stock.minThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Minimum threshold must be a non-negative integer'),

    body('stock.maxThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Maximum threshold must be a non-negative integer'),

    body('taxRate')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),

    body('weight')
        .optional()
        .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    body('isFeatured')
        .optional()
        .isBoolean().withMessage('isFeatured must be a boolean')
];

// Product query validation
const productQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('search')
        .optional()
        .isString().withMessage('Search must be a string')
        .trim(),

    query('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),

    query('supplier')
        .optional()
        .isMongoId().withMessage('Invalid supplier ID'),

    query('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    query('minPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum price must be a non-negative number'),

    query('maxPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum price must be a non-negative number'),

    query('minStock')
        .optional()
        .isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),

    query('maxStock')
        .optional()
        .isInt({ min: 0 }).withMessage('Maximum stock must be a non-negative integer'),

    query('sort')
        .optional()
        .isString().withMessage('Sort must be a string')
];

// Stock update validation
const stockUpdateValidation = [
    param('id')
        .isMongoId().withMessage('Invalid product ID'),

    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),

    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['add', 'subtract']).withMessage('Type must be "add" or "subtract"'),

    body('reference')
        .optional()
        .isString().withMessage('Reference must be a string')
        .trim()
        .escape(),

    body('notes')
        .optional()
        .isString().withMessage('Notes must be a string')
        .trim()
        .escape()
];

// Product ID validation
const productIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid product ID')
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    productQueryValidation,
    stockUpdateValidation,
    productIdValidation
};