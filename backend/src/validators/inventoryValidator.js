const { body, param, query } = require('express-validator');

// Stock adjustment validation
const adjustStockValidation = [
    body('productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid product ID'),

    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isNumeric().withMessage('Quantity must be a number')
        .custom((value) => {
            if (value === 0) {
                throw new Error('Quantity cannot be zero');
            }
            return true;
        }),

    body('reason')
        .optional()
        .isString().withMessage('Reason must be a string')
        .isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
        .trim()
        .escape(),

    body('notes')
        .optional()
        .isString().withMessage('Notes must be a string')
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
        .trim()
        .escape()
];

// Bulk stock adjustment validation
const bulkAdjustStockValidation = [
    body('adjustments')
        .isArray({ min: 1 }).withMessage('Adjustments must be an array with at least one item'),

    body('adjustments.*.productId')
        .notEmpty().withMessage('Product ID is required for each adjustment')
        .isMongoId().withMessage('Invalid product ID'),

    body('adjustments.*.quantity')
        .notEmpty().withMessage('Quantity is required for each adjustment')
        .isNumeric().withMessage('Quantity must be a number')
        .custom((value) => {
            if (value === 0) {
                throw new Error('Quantity cannot be zero');
            }
            return true;
        }),

    body('adjustments.*.reason')
        .optional()
        .isString().withMessage('Reason must be a string')
        .trim()
        .escape(),

    body('adjustments.*.notes')
        .optional()
        .isString().withMessage('Notes must be a string')
        .trim()
        .escape()
];

// Inventory query validation
const inventoryQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('productId')
        .optional()
        .isMongoId().withMessage('Invalid product ID'),

    query('transactionType')
        .optional()
        .isIn(['purchase', 'sale', 'return', 'adjustment', 'transfer'])
        .withMessage('Invalid transaction type'),

    query('startDate')
        .optional()
        .isISO8601().withMessage('Please provide a valid start date'),

    query('endDate')
        .optional()
        .isISO8601().withMessage('Please provide a valid end date'),

    query('search')
        .optional()
        .isString().withMessage('Search must be a string')
        .trim()
];

// Inventory ID validation
const inventoryIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid inventory ID')
];

// Product inventory validation
const productInventoryValidation = [
    param('productId')
        .isMongoId().withMessage('Invalid product ID')
];

// Category inventory validation
const categoryInventoryValidation = [
    param('categoryId')
        .isMongoId().withMessage('Invalid category ID')
];

module.exports = {
    adjustStockValidation,
    bulkAdjustStockValidation,
    inventoryQueryValidation,
    inventoryIdValidation,
    productInventoryValidation,
    categoryInventoryValidation
};