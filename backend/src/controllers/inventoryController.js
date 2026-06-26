const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    Get inventory transactions with pagination
// @route   GET /api/inventory
// @access  Private
const getInventoryTransactions = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            productId,
            transactionType,
            startDate,
            endDate,
            search,
        } = req.query;

        const filter = {};

        if (productId) {
            filter.product = productId;
        }

        if (transactionType) {
            filter.transactionType = transactionType;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Inventory.countDocuments(filter);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const pages = Math.ceil(total / limitNum);

        const transactions = await Inventory.find(filter)
            .populate('product', 'name sku price')
            .populate('performedBy', 'firstName lastName email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages,
                nextPage: pageNum < pages ? pageNum + 1 : null,
                prevPage: pageNum > 1 ? pageNum - 1 : null,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory by product
// @route   GET /api/inventory/product/:productId
// @access  Private
const getInventoryByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        const transactions = await Inventory.find({ product: productId })
            .populate('performedBy', 'firstName lastName email')
            .sort('-createdAt')
            .limit(50);

        const summary = {
            product: {
                _id: product._id,
                name: product.name,
                sku: product.sku,
                currentStock: product.stock.quantity,
                minThreshold: product.stock.minThreshold,
            },
            totalTransactions: transactions.length,
            transactions,
        };

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory summary
// @route   GET /api/inventory/summary
// @access  Private
const getInventorySummary = async (req, res, next) => {
    try {
        // Get total products
        const totalProducts = await Product.countDocuments({ isActive: true });

        // Get total stock value
        const products = await Product.find({ isActive: true });
        const totalStockValue = products.reduce((sum, p) => sum + (p.stock.quantity * p.price.cost), 0);

        // Get low stock count
        const lowStockCount = await Product.countDocuments({
            isActive: true,
            $expr: {
                $lte: ['$stock.quantity', '$stock.minThreshold'],
            },
        });

        // Get out of stock count
        const outOfStockCount = await Product.countDocuments({
            isActive: true,
            'stock.quantity': 0,
        });

        // Get recent transactions
        const recentTransactions = await Inventory.find()
            .populate('product', 'name sku')
            .populate('performedBy', 'firstName lastName')
            .sort('-createdAt')
            .limit(10);

        // Get transaction type summary
        const transactionSummary = await Inventory.aggregate([
            {
                $group: {
                    _id: '$transactionType',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalProducts,
                    totalStockValue: totalStockValue.toFixed(2),
                    lowStockCount,
                    outOfStockCount,
                },
                transactionSummary,
                recentTransactions,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get stock movement for a product
// @route   GET /api/inventory/movement/:productId
// @access  Private
const getStockMovement = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;

        const product = await Product.findById(productId);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const transactions = await Inventory.find({
            product: productId,
            createdAt: { $gte: startDate },
        }).sort('createdAt');

        // Prepare movement data
        const movementData = [];
        let runningStock = 0;

        transactions.forEach(transaction => {
            runningStock += transaction.quantity;
            movementData.push({
                date: transaction.createdAt,
                type: transaction.transactionType,
                quantity: transaction.quantity,
                runningStock,
                reference: transaction.reference,
            });
        });

        res.status(200).json({
            success: true,
            data: {
                product: {
                    _id: product._id,
                    name: product.name,
                    sku: product.sku,
                },
                period: `${days} days`,
                currentStock: product.stock.quantity,
                movements: movementData,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Adjust stock manually
// @route   POST /api/inventory/adjust
// @access  Private
const adjustStock = async (req, res, next) => {
    try {
        const {
            productId,
            quantity,
            reason,
            notes,
        } = req.body;

        if (!productId || quantity === undefined) {
            return next(new AppError('Product ID and quantity are required', 400));
        }

        const product = await Product.findById(productId);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        const oldQuantity = product.stock.quantity;
        const newQuantity = oldQuantity + quantity;

        if (newQuantity < 0) {
            return next(new AppError('Stock cannot be negative', 400));
        }

        // Update product stock
        product.stock.quantity = newQuantity;
        await product.save();

        // Create inventory transaction
        const transaction = await Inventory.create({
            product: product._id,
            transactionType: 'adjustment',
            quantity: quantity,
            previousQuantity: oldQuantity,
            newQuantity: newQuantity,
            reference: reason || 'Manual adjustment',
            notes: notes || '',
            performedBy: req.user.id,
        });

        // Log adjustment
        logger.info(`Stock adjusted for product ${product.name} (${product.sku}): ${quantity} units. New stock: ${newQuantity}`);

        res.status(200).json({
            success: true,
            message: 'Stock adjusted successfully',
            data: {
                product: {
                    _id: product._id,
                    name: product.name,
                    sku: product.sku,
                },
                previousQuantity: oldQuantity,
                newQuantity: newQuantity,
                adjustment: quantity,
                transaction,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk inventory adjustment
// @route   POST /api/inventory/bulk-adjust
// @access  Private
const bulkAdjustStock = async (req, res, next) => {
    try {
        const { adjustments } = req.body;

        if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
            return next(new AppError('Please provide an array of adjustments', 400));
        }

        const results = [];
        const errors = [];

        for (const adjustment of adjustments) {
            try {
                const { productId, quantity, reason, notes } = adjustment;

                if (!productId || quantity === undefined) {
                    errors.push({ productId, error: 'Product ID and quantity are required' });
                    continue;
                }

                const product = await Product.findById(productId);
                if (!product) {
                    errors.push({ productId, error: 'Product not found' });
                    continue;
                }

                const oldQuantity = product.stock.quantity;
                const newQuantity = oldQuantity + quantity;

                if (newQuantity < 0) {
                    errors.push({ productId, error: 'Stock cannot be negative' });
                    continue;
                }

                product.stock.quantity = newQuantity;
                await product.save();

                const transaction = await Inventory.create({
                    product: product._id,
                    transactionType: 'adjustment',
                    quantity: quantity,
                    previousQuantity: oldQuantity,
                    newQuantity: newQuantity,
                    reference: reason || 'Bulk adjustment',
                    notes: notes || '',
                    performedBy: req.user.id,
                });

                results.push({
                    productId,
                    productName: product.name,
                    sku: product.sku,
                    previousQuantity: oldQuantity,
                    newQuantity: newQuantity,
                    adjustment: quantity,
                    transaction: transaction._id,
                });
            } catch (error) {
                errors.push({
                    productId: adjustment.productId,
                    error: error.message,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `${results.length} adjustments completed successfully`,
            data: {
                successful: results,
                failed: errors,
                total: adjustments.length,
                successCount: results.length,
                failureCount: errors.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory by category
// @route   GET /api/inventory/category/:categoryId
// @access  Private
const getInventoryByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const products = await Product.find({
            category: categoryId,
            isActive: true,
        })
            .populate('category', 'name')
            .populate('supplier', 'name');

        const totalValue = products.reduce((sum, p) => sum + (p.stock.quantity * p.price.cost), 0);
        const totalStock = products.reduce((sum, p) => sum + p.stock.quantity, 0);

        res.status(200).json({
            success: true,
            data: {
                category: products[0]?.category || null,
                productCount: products.length,
                totalStock,
                totalValue: totalValue.toFixed(2),
                products,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export inventory report
// @route   GET /api/inventory/export
// @access  Private
const exportInventoryReport = async (req, res, next) => {
    try {
        const { format = 'csv' } = req.query;

        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .populate('supplier', 'name');

        if (format === 'csv') {
            // CSV export
            const csvWriter = require('csv-writer').createObjectCsvWriter({
                path: `temp/inventory-${Date.now()}.csv`,
                header: [
                    { id: 'sku', title: 'SKU' },
                    { id: 'name', title: 'Product' },
                    { id: 'category', title: 'Category' },
                    { id: 'supplier', title: 'Supplier' },
                    { id: 'stock', title: 'Stock' },
                    { id: 'minThreshold', title: 'Min Threshold' },
                    { id: 'costPrice', title: 'Cost Price' },
                    { id: 'sellingPrice', title: 'Selling Price' },
                    { id: 'stockValue', title: 'Stock Value' },
                    { id: 'status', title: 'Status' },
                ],
            });

            const records = products.map(p => ({
                sku: p.sku,
                name: p.name,
                category: p.category?.name || 'N/A',
                supplier: p.supplier?.name || 'N/A',
                stock: p.stock.quantity,
                minThreshold: p.stock.minThreshold,
                costPrice: p.price.cost,
                sellingPrice: p.price.selling,
                stockValue: p.stock.quantity * p.price.cost,
                status: p.isActive ? 'Active' : 'Inactive',
            }));

            await csvWriter.writeRecords(records);

            res.download(`temp/inventory-${Date.now()}.csv`, 'inventory-report.csv', (err) => {
                if (err) {
                    logger.error(`Error downloading CSV: ${err.message}`);
                }
            });
        } else {
            // PDF export (using existing PDF generator)
            const filename = `inventory-report-${Date.now()}.pdf`;
            const filePath = await PDFGenerator.generateProductReport(products, filename);
            res.download(filePath, filename, (err) => {
                if (err) {
                    logger.error(`Error downloading PDF: ${err.message}`);
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory history for product
// @route   GET /api/inventory/history/:productId
// @access  Private
const getInventoryHistory = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { limit = 20, startDate, endDate } = req.query;

        const filter = { product: productId };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const history = await Inventory.find(filter)
            .populate('performedBy', 'firstName lastName email')
            .sort('-createdAt')
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventoryTransactions,
    getInventoryByProduct,
    getInventorySummary,
    getStockMovement,
    adjustStock,
    bulkAdjustStock,
    getInventoryByCategory,
    exportInventoryReport,
    getInventoryHistory,
};