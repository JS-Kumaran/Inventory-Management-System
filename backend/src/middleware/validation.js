const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation rules
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const extractedErrors = [];
        errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: extractedErrors,
        });
    };
};

// Common validation rules
const validateObjectId = (paramName = 'id') => {
    return param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`);
};

const validatePagination = () => {
    return [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('sort')
            .optional()
            .isString()
            .withMessage('Sort must be a string'),
        query('search')
            .optional()
            .isString()
            .withMessage('Search must be a string'),
    ];
};

module.exports = {
    validate,
    validateObjectId,
    validatePagination,
    body,
    param,
    query,
};