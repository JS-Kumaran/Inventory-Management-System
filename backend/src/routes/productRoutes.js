const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    validate, 
    body, 
    param, 
    query,
    validateObjectId,
    validatePagination
} = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    exportProductsPDF,
    exportProductsCSV,
    searchProducts,
    getLowStockProducts,
    updateStock,
} = require('../controllers/productController');

// Public routes (within private system)
router.use(protect);

// Product search
router.get(
    '/search',
    [
        query('query').notEmpty().withMessage('Search query is required'),
    ],
    validate,
    searchProducts
);

// Export routes
router.get('/export/pdf', exportProductsPDF);
router.get('/export/csv', exportProductsCSV);

// Low stock products
router.get('/low-stock', getLowStockProducts);

// Main CRUD routes
router.get(
    '/',
    validatePagination(),
    validate,
    getProducts
);

router.post(
    '/',
    [
        body('sku').notEmpty().withMessage('SKU is required'),
        body('name').notEmpty().withMessage('Product name is required'),
        body('category').isMongoId().withMessage('Invalid category'),
        body('unit').isIn(['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set'])
            .withMessage('Invalid unit'),
        body('price.cost').isNumeric().withMessage('Cost price must be a number'),
        body('price.selling').isNumeric().withMessage('Selling price must be a number'),
        body('stock.quantity').optional().isNumeric(),
        body('stock.minThreshold').optional().isNumeric(),
        body('supplier').optional().isMongoId().withMessage('Invalid supplier'),
        body('taxRate').optional().isNumeric().withMessage('Tax rate must be a number'),
    ],
    validate,
    authorize('admin', 'manager'),
    createProduct
);

router.get(
    '/:id',
    validateObjectId('id'),
    validate,
    getProduct
);

router.put(
    '/:id',
    validateObjectId('id'),
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('category').optional().isMongoId().withMessage('Invalid category'),
        body('supplier').optional().isMongoId().withMessage('Invalid supplier'),
        body('unit').optional().isIn(['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set'])
            .withMessage('Invalid unit'),
        body('price.cost').optional().isNumeric().withMessage('Cost must be a number'),
        body('price.selling').optional().isNumeric().withMessage('Selling must be a number'),
        body('stock.quantity').optional().isNumeric().withMessage('Stock must be a number'),
        body('stock.minThreshold').optional().isNumeric().withMessage('Min threshold must be a number'),
        body('taxRate').optional().isNumeric().withMessage('Tax rate must be a number'),
    ],
    validate,
    authorize('admin', 'manager'),
    updateProduct
);

router.delete(
    '/:id',
    validateObjectId('id'),
    validate,
    authorize('admin'),
    deleteProduct
);

// Stock update
router.patch(
    '/:id/stock',
    validateObjectId('id'),
    [
        body('quantity').isNumeric().withMessage('Quantity must be a number'),
        body('type').isIn(['add', 'subtract']).withMessage('Type must be "add" or "subtract"'),
        body('reference').optional().isString(),
        body('notes').optional().isString(),
    ],
    validate,
    authorize('admin', 'manager'),
    updateStock
);

// Image upload
router.post(
    '/:id/upload',
    validateObjectId('id'),
    validate,
    uploadSingle('image'),
    authorize('admin', 'manager'),
    uploadProductImage
);

module.exports = router;