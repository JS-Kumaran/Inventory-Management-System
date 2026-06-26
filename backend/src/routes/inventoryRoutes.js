const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, body, param, query, validateObjectId } = require('../middleware/validation');
const {
    getInventoryTransactions,
    getInventoryByProduct,
    getInventorySummary,
    getStockMovement,
    adjustStock,
    bulkAdjustStock,
    getInventoryByCategory,
    exportInventoryReport,
    getInventoryHistory,
} = require('../controllers/inventoryController');

router.use(protect);

// Summary routes
router.get('/summary', getInventorySummary);

// Export route
router.get('/export', exportInventoryReport);

// Bulk adjustment
router.post(
    '/bulk-adjust',
    [
        body('adjustments').isArray().withMessage('Adjustments must be an array'),
        body('adjustments.*.productId').isMongoId().withMessage('Invalid product ID'),
        body('adjustments.*.quantity').isNumeric().withMessage('Quantity must be a number'),
    ],
    validate,
    authorize('admin', 'manager'),
    bulkAdjustStock
);

// Main transactions route
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('productId').optional().isMongoId(),
        query('transactionType').optional().isIn(['purchase', 'sale', 'return', 'adjustment', 'transfer']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    validate,
    getInventoryTransactions
);

// Adjust stock
router.post(
    '/adjust',
    [
        body('productId').isMongoId().withMessage('Invalid product ID'),
        body('quantity').isNumeric().withMessage('Quantity must be a number'),
        body('reason').optional().isString(),
        body('notes').optional().isString(),
    ],
    validate,
    authorize('admin', 'manager'),
    adjustStock
);

// Product specific routes
router.get(
    '/product/:productId',
    validateObjectId('productId'),
    validate,
    getInventoryByProduct
);

router.get(
    '/history/:productId',
    validateObjectId('productId'),
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    validate,
    getInventoryHistory
);

router.get(
    '/movement/:productId',
    validateObjectId('productId'),
    [
        query('days').optional().isInt({ min: 1 }),
    ],
    validate,
    getStockMovement
);

// Category specific
router.get(
    '/category/:categoryId',
    validateObjectId('categoryId'),
    validate,
    getInventoryByCategory
);

module.exports = router;