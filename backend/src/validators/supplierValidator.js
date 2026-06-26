const { body, param, query } = require('express-validator');

// Supplier creation validation
const createSupplierValidation = [
    body('name')
        .notEmpty().withMessage('Supplier name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Supplier name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('company')
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .trim()
        .toLowerCase(),

    body('phone')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .trim(),

    body('address')
        .optional()
        .isObject().withMessage('Address must be an object'),

    body('address.street')
        .optional()
        .isString().withMessage('Street must be a string')
        .trim(),

    body('address.city')
        .optional()
        .isString().withMessage('City must be a string')
        .trim(),

    body('address.state')
        .optional()
        .isString().withMessage('State must be a string')
        .trim(),

    body('address.zipCode')
        .optional()
        .isPostalCode('any').withMessage('Please provide a valid postal code')
        .trim(),

    body('address.country')
        .optional()
        .isString().withMessage('Country must be a string')
        .trim(),

    body('taxId')
        .optional()
        .isString().withMessage('Tax ID must be a string')
        .trim(),

    body('paymentTerms')
        .optional()
        .isIn(['net30', 'net60', 'net90', 'cod', 'prepaid'])
        .withMessage('Invalid payment terms'),

    body('leadTime')
        .optional()
        .isInt({ min: 0 }).withMessage('Lead time must be a non-negative integer'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
];

// Supplier update validation
const updateSupplierValidation = [
    param('id')
        .isMongoId().withMessage('Invalid supplier ID'),

    body('name')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('Supplier name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('company')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters')
        .trim()
        .escape(),

    body('email')
        .optional()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .trim()
        .toLowerCase(),

    body('phone')
        .optional()
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .trim(),

    body('address')
        .optional()
        .isObject().withMessage('Address must be an object'),

    body('taxId')
        .optional()
        .isString().withMessage('Tax ID must be a string')
        .trim(),

    body('paymentTerms')
        .optional()
        .isIn(['net30', 'net60', 'net90', 'cod', 'prepaid'])
        .withMessage('Invalid payment terms'),

    body('leadTime')
        .optional()
        .isInt({ min: 0 }).withMessage('Lead time must be a non-negative integer'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
];

// Supplier query validation
const supplierQueryValidation = [
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

    query('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
];

// Supplier ID validation
const supplierIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid supplier ID')
];

module.exports = {
    createSupplierValidation,
    updateSupplierValidation,
    supplierQueryValidation,
    supplierIdValidation
};