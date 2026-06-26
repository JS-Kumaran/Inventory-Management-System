const Product = require('../models/Product');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { AppError } = require('../middleware/errorHandler');

/**
 * Report Service - Handles all report generation logic
 */
class ReportService {
    /**
     * Generate inventory report
     */
    static async generateInventoryReport(filters = {}) {
        const { category, supplier, minStock, maxStock } = filters;

        const query = { isActive: true };
        if (category) query.category = category;
        if (supplier) query.supplier = supplier;
        if (minStock) query['stock.quantity'] = { $gte: parseInt(minStock) };
        if (maxStock) query['stock.quantity'] = { $lte: parseInt(maxStock) };

        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('supplier', 'name');

        const reportData = products.map(product => ({
            sku: product.sku,
            name: product.name,
            category: product.category?.name || 'N/A',
            supplier: product.supplier?.name || 'N/A',
            quantity: product.stock.quantity,
            minThreshold: product.stock.minThreshold,
            maxThreshold: product.stock.maxThreshold,
            costPrice: product.price.cost,
            sellingPrice: product.price.selling,
            stockValue: product.stock.quantity * product.price.cost,
            profitMargin: ((product.price.selling - product.price.cost) / product.price.cost * 100).toFixed(2),
            status: product.stock.quantity <= product.stock.minThreshold ? 'Low Stock' :
                    product.stock.quantity === 0 ? 'Out of Stock' : 'In Stock',
        }));

        const summary = {
            totalProducts: reportData.length,
            totalStockValue: reportData.reduce((sum, p) => sum + p.stockValue, 0),
            totalItems: reportData.reduce((sum, p) => sum + p.quantity, 0),
            lowStockItems: reportData.filter(p => p.status === 'Low Stock').length,
            outOfStockItems: reportData.filter(p => p.status === 'Out of Stock').length,
        };

        return { summary, data: reportData };
    }

    /**
     * Generate sales report
     */
    static async generateSalesReport(startDate, endDate) {
        const filter = {
            orderType: 'sale',
            status: { $in: ['delivered', 'completed'] },
        };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(filter)
            .populate('items.product', 'name sku category')
            .populate('createdBy', 'firstName lastName');

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;

        // Product sales breakdown
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.product._id.toString();
                if (!productSales[key]) {
                    productSales[key] = {
                        productId: item.product._id,
                        productName: item.product.name,
                        sku: item.product.sku,
                        category: item.product.category?.name || 'N/A',
                        quantity: 0,
                        revenue: 0,
                        orders: 0,
                    };
                }
                productSales[key].quantity += item.quantity;
                productSales[key].revenue += item.total;
                productSales[key].orders += 1;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue);

        // Daily sales trend
        const dailyTrend = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailyTrend[date]) {
                dailyTrend[date] = { date, revenue: 0, orders: 0 };
            }
            dailyTrend[date].revenue += order.total;
            dailyTrend[date].orders += 1;
        });

        return {
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                startDate,
                endDate,
                periodDays: startDate && endDate ? 
                    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 
                    'N/A',
            },
            topProducts: topProducts.slice(0, 10),
            dailyTrend: Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date)),
            orders,
        };
    }

    /**
     * Generate low stock report
     */
    static async generateLowStockReport() {
        const products = await Product.find({
            isActive: true,
            $expr: {
                $lte: ['$stock.quantity', '$stock.minThreshold'],
            },
        })
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort('stock.quantity');

        const summary = {
            totalProducts: products.length,
            criticalStock: products.filter(p => p.stock.quantity === 0).length,
            totalValue: products.reduce((sum, p) => sum + (p.stock.quantity * p.price.cost), 0),
        };

        return { summary, data: products };
    }

    /**
     * Generate category report
     */
    static async generateCategoryReport() {
        const categories = await Product.aggregate([
            {
                $match: { isActive: true },
            },
            {
                $group: {
                    _id: '$category',
                    productCount: { $sum: 1 },
                    totalStock: { $sum: '$stock.quantity' },
                    totalValue: {
                        $sum: { $multiply: ['$stock.quantity', '$price.cost'] },
                    },
                    avgPrice: { $avg: '$price.selling' },
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
                    categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
                    productCount: 1,
                    totalStock: 1,
                    totalValue: 1,
                    avgPrice: { $round: ['$avgPrice', 2] },
                },
            },
            {
                $sort: { totalValue: -1 },
            },
        ]);

        const summary = {
            totalCategories: categories.length,
            totalProducts: categories.reduce((sum, c) => sum + c.productCount, 0),
            totalStockValue: categories.reduce((sum, c) => sum + c.totalValue, 0),
        };

        return { summary, data: categories };
    }

    /**
     * Export report to CSV format
     */
    static async exportToCSV(data, headers, filename) {
        const createCsvWriter = require('csv-writer').createObjectCsvWriter;
        
        const csvWriter = createCsvWriter({
            path: `temp/${filename}`,
            header: headers,
        });

        await csvWriter.writeRecords(data);
        return `temp/${filename}`;
    }

    /**
     * Generate audit log report
     */
    static async generateAuditReport(startDate, endDate, userId = null, module = null) {
        const AuditLog = require('../models/AuditLog');
        
        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (userId) filter.user = userId;
        if (module) filter.module = module;

        const logs = await AuditLog.find(filter)
            .populate('user', 'firstName lastName email')
            .sort('-createdAt');

        const summary = {
            totalLogs: logs.length,
            actions: {},
            modules: {},
            status: { success: 0, failed: 0 },
        };

        logs.forEach(log => {
            summary.actions[log.action] = (summary.actions[log.action] || 0) + 1;
            summary.modules[log.module] = (summary.modules[log.module] || 0) + 1;
            summary.status[log.status] = (summary.status[log.status] || 0) + 1;
        });

        return { summary, data: logs };
    }
}

module.exports = ReportService;