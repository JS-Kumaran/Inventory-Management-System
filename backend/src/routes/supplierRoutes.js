const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, body, validateObjectId } = require('../middleware/validation');
const {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier,
} = require('../controllers/supplierController');

router.use(protect);

router.get('/', getSuppliers);

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Supplier name is required'),
        body('company').notEmpty().withMessage('Company name is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('phone').notEmpty().withMessage('Phone number is required'),
        body('address').optional(),
        body('taxId').optional().isString(),
        body('paymentTerms').optional().isIn(['net30', 'net60', 'net90', 'cod', 'prepaid']),
        body('leadTime').optional().isNumeric().withMessage('Lead time must be a number'),
    ],
    validate,
    authorize('admin', 'manager'),
    createSupplier
);

router.get(
    '/:id',
    validateObjectId('id'),
    validate,
    getSupplier
);

router.put(
    '/:id',
    validateObjectId('id'),
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('company').optional().notEmpty().withMessage('Company cannot be empty'),
        body('email').optional().isEmail().withMessage('Please provide a valid email'),
        body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
        body('paymentTerms').optional().isIn(['net30', 'net60', 'net90', 'cod', 'prepaid']),
        body('isActive').optional().isBoolean(),
    ],
    validate,
    authorize('admin', 'manager'),
    updateSupplier
);

router.delete(
    '/:id',
    validateObjectId('id'),
    validate,
    authorize('admin'),
    deleteSupplier
);

module.exports = router;