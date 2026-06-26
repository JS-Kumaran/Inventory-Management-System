const { body, validationResult } = require('express-validator');

// User registration validation rules
const registerValidation = [
    body('firstName')
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
        .trim()
        .escape(),

    body('lastName')
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
        .trim()
        .escape(),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .trim()
        .toLowerCase(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('phone')
        .optional()
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .trim(),

    body('role')
        .optional()
        .isIn(['admin', 'manager', 'staff']).withMessage('Invalid role')
];

// User login validation rules
const loginValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .trim()
        .toLowerCase(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

// Password change validation rules
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Password reset validation rules
const resetPasswordValidation = [
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Forgot password validation
const forgotPasswordValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .trim()
        .toLowerCase()
];

// Profile update validation
const updateProfileValidation = [
    body('firstName')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
        .trim()
        .escape(),

    body('lastName')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
        .trim()
        .escape(),

    body('phone')
        .optional()
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .trim(),

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
        .trim()
];

module.exports = {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    resetPasswordValidation,
    forgotPasswordValidation,
    updateProfileValidation
};