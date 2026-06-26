const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, body, validateObjectId } = require('../middleware/validation');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    generateOrderPDF,
} = require('../controllers/orderController');

router.use(protect);

router.get('/', getOrders);

router.post(
    '/',
    [
        body('orderType').isIn(['purchase', 'sale']).withMessage('Invalid order type'),
        body('items').isArray().withMessage('Items must be an array'),
        body('items.*.product').isMongoId().withMessage('Invalid product ID'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('supplier').optional().isMongoId().withMessage('Invalid supplier'),
        body('paymentMethod').optional().isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'online']),
    ],
    validate,
    authorize('admin', 'manager'),
    createOrder
);

router.get('/:id', validateObjectId('id'), validate, getOrder);

router.put(
    '/:id/status',
    validateObjectId('id'),
    [
        body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
            .withMessage('Invalid status'),
    ],
    validate,
    authorize('admin', 'manager'),
    updateOrderStatus
);

router.put(
    '/:id/payment',
    validateObjectId('id'),
    [
        body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded'])
            .withMessage('Invalid payment status'),
    ],
    validate,
    authorize('admin', 'manager'),
    updatePaymentStatus
);

router.delete(
    '/:id',
    validateObjectId('id'),
    validate,
    authorize('admin'),
    deleteOrder
);

router.get('/:id/pdf', validateObjectId('id'), validate, generateOrderPDF);

module.exports = router;