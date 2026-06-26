const { body, param, query } = require('express-validator');

// Order creation validation
const createOrderValidation = [
    body('orderType')
        .notEmpty().withMessage('Order type is required')
        .isIn(['purchase', 'sale']).withMessage('Order type must be "purchase" or "sale"'),

    body('items')
        .isArray({ min: 1 }).withMessage('Order must have at least one item'),

    body('items.*.product')
        .notEmpty().withMessage('Product is required for each item')
        .isMongoId().withMessage('Invalid product ID'),

    body('items.*.quantity')
        .notEmpty().withMessage('Quantity is required for each item')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    body('items.*.unitPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),

    body('items.*.discount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),

    body('supplier')
        .custom((value, { req }) => {
            if (req.body.orderType === 'purchase' && !value) {
                throw new Error('Supplier is required for purchase orders');
            }
            return true;
        })
        .optional()
        .isMongoId().withMessage('Invalid supplier ID'),

    body('customer')
        .custom((value, { req }) => {
            if (req.body.orderType === 'sale' && !value) {
                throw new Error('Customer is required for sale orders');
            }
            return true;
        })
        .optional()
        .isObject().withMessage('Customer must be an object'),

    body('customer.name')
        .optional()
        .isString().withMessage('Customer name must be a string')
        .trim()
        .escape(),

    body('customer.email')
        .optional()
        .isEmail().withMessage('Please provide a valid customer email')
        .normalizeEmail()
        .trim()
        .toLowerCase(),

    body('customer.phone')
        .optional()
        .isMobilePhone().withMessage('Please provide a valid customer phone number')
        .trim(),

    body('shippingAddress')
        .optional()
        .isObject().withMessage('Shipping address must be an object'),

    body('shippingAddress.street')
        .optional()
        .isString().withMessage('Street must be a string')
        .trim(),

    body('shippingAddress.city')
        .optional()
        .isString().withMessage('City must be a string')
        .trim(),

    body('shippingAddress.state')
        .optional()
        .isString().withMessage('State must be a string')
        .trim(),

    body('shippingAddress.zipCode')
        .optional()
        .isPostalCode('any').withMessage('Please provide a valid postal code')
        .trim(),

    body('shippingAddress.country')
        .optional()
        .isString().withMessage('Country must be a string')
        .trim(),

    body('paymentMethod')
        .optional()
        .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'online'])
        .withMessage('Invalid payment method'),

    body('discount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),

    body('shippingCost')
        .optional()
        .isFloat({ min: 0 }).withMessage('Shipping cost must be a non-negative number'),

    body('notes')
        .optional()
        .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
        .trim()
        .escape(),

    body('expectedDeliveryDate')
        .optional()
        .isISO8601().withMessage('Please provide a valid date')
];

// Order status update validation
const updateOrderStatusValidation = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
        .withMessage('Invalid status')
];

// Payment status update validation
const updatePaymentStatusValidation = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body('paymentStatus')
        .notEmpty().withMessage('Payment status is required')
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Invalid payment status')
];

// Order query validation
const orderQueryValidation = [
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

    query('orderType')
        .optional()
        .isIn(['purchase', 'sale']).withMessage('Order type must be "purchase" or "sale"'),

    query('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
        .withMessage('Invalid status'),

    query('paymentStatus')
        .optional()
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Invalid payment status'),

    query('startDate')
        .optional()
        .isISO8601().withMessage('Please provide a valid start date'),

    query('endDate')
        .optional()
        .isISO8601().withMessage('Please provide a valid end date')
];

// Order ID validation
const orderIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid order ID')
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation,
    updatePaymentStatusValidation,
    orderQueryValidation,
    orderIdValidation
};