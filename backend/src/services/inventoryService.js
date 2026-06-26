const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middleware/errorHandler');

/**
 * Inventory Service - Handles all inventory-related business logic
 */
class InventoryService {
    /**
     * Update product stock and create inventory transaction
     */
    static async updateStock(productId, quantity, transactionType, userId, options = {}) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const oldQuantity = product.stock.quantity;
        const newQuantity = oldQuantity + quantity;

        if (newQuantity < 0) {
            throw new AppError('Stock cannot be negative', 400);
        }

        // Update product stock
        product.stock.quantity = newQuantity;
        await product.save();

        // Create inventory transaction
        const transaction = await Inventory.create({
            product: product._id,
            transactionType,
            quantity,
            previousQuantity: oldQuantity,
            newQuantity: newQuantity,
            reference: options.reference || null,
            referenceId: options.referenceId || null,
            notes: options.notes || '',
            performedBy: userId,
        });

        // Check if stock is low
        if (newQuantity <= product.stock.minThreshold) {
            // Trigger low stock notification
            await this.checkLowStock(product);
        }

        return {
            product: product._id,
            previousQuantity: oldQuantity,
            newQuantity: newQuantity,
            transaction,
        };
    }

    /**
     * Check and handle low stock
     */
    static async checkLowStock(product) {
        // Log low stock warning
        console.warn(`Low stock alert: ${product.name} (${product.sku}) - Current: ${product.stock.quantity}, Threshold: ${product.stock.minThreshold}`);
        
        // Here you could send email notifications, create alerts, etc.
        return {
            isLowStock: true,
            product: product._id,
            currentStock: product.stock.quantity,
            threshold: product.stock.minThreshold,
        };
    }

    /**
     * Get inventory summary for a product
     */
    static async getProductInventorySummary(productId) {
        const product = await Product.findById(productId)
            .populate('category', 'name')
            .populate('supplier', 'name');

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const transactions = await Inventory.find({ product: productId })
            .sort('-createdAt')
            .limit(50);

        const totalIn = transactions
            .filter(t => t.quantity > 0)
            .reduce((sum, t) => sum + t.quantity, 0);

        const totalOut = transactions
            .filter(t => t.quantity < 0)
            .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

        return {
            product: {
                _id: product._id,
                name: product.name,
                sku: product.sku,
                currentStock: product.stock.quantity,
                minThreshold: product.stock.minThreshold,
            },
            summary: {
                totalTransactions: transactions.length,
                totalIn,
                totalOut,
                netMovement: totalIn - totalOut,
            },
            recentTransactions: transactions.slice(0, 10),
        };
    }

    /**
     * Get inventory value report
     */
    static async getInventoryValueReport() {
        const products = await Product.find({ isActive: true })
            .populate('category', 'name');

        const totalValue = products.reduce((sum, p) => sum + (p.stock.quantity * p.price.cost), 0);

        const categoryBreakdown = await Product.aggregate([
            {
                $match: { isActive: true },
            },
            {
                $group: {
                    _id: '$category',
                    totalValue: {
                        $sum: { $multiply: ['$stock.quantity', '$price.cost'] },
                    },
                    totalStock: { $sum: '$stock.quantity' },
                    productCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    categoryName: '$category.name',
                    totalValue: 1,
                    totalStock: 1,
                    productCount: 1,
                },
            },
        ]);

        return {
            totalValue,
            totalProducts: products.length,
            categoryBreakdown,
            products: products.map(p => ({
                name: p.name,
                sku: p.sku,
                category: p.category?.name || 'Uncategorized',
                stock: p.stock.quantity,
                value: p.stock.quantity * p.price.cost,
            })),
        };
    }

    /**
     * Reconcile inventory (match physical count with system)
     */
    static async reconcileInventory(productId, physicalCount, userId, notes = '') {
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const systemCount = product.stock.quantity;
        const difference = physicalCount - systemCount;

        if (difference === 0) {
            return {
                product: product._id,
                systemCount,
                physicalCount,
                difference: 0,
                message: 'Counts match, no adjustment needed',
            };
        }

        // Update stock
        const result = await this.updateStock(
            productId,
            difference,
            'adjustment',
            userId,
            {
                reference: 'Physical inventory reconciliation',
                notes: `Physical count: ${physicalCount}${notes ? ', ' + notes : ''}`,
            }
        );

        return {
            product: product._id,
            systemCount,
            physicalCount,
            difference,
            adjustment: result,
        };
    }
}

module.exports = InventoryService;