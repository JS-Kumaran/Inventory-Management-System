const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
    try {
        // Get counts
        const [totalProducts, totalCategories, totalSuppliers, totalOrders, totalUsers] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Category.countDocuments({ isActive: true }),
            Supplier.countDocuments({ isActive: true }),
            Order.countDocuments(),
            User.countDocuments({ isActive: true }),
        ]);

        // Get total stock value
        const products = await Product.find({ isActive: true });
        const totalStockValue = products.reduce((sum, product) => {
            return sum + (product.stock.quantity * product.price.cost);
        }, 0);

        // Get low stock products
        const lowStockProducts = await Product.countDocuments({
            isActive: true,
            'stock.quantity': { $lte: '$stock.minThreshold' },
        });

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('createdBy', 'firstName lastName')
            .sort('-createdAt')
            .limit(5);

        // Get monthly sales
        const startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const monthlySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    orderType: 'sale',
                    status: { $in: ['delivered', 'completed'] },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const monthlySalesTotal = monthlySales.length > 0 ? monthlySales[0].total : 0;
        const monthlyOrderCount = monthlySales.length > 0 ? monthlySales[0].count : 0;

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                totalSuppliers,
                totalOrders,
                totalUsers,
                totalStockValue: totalStockValue.toFixed(2),
                lowStockProducts,
                recentOrders,
                monthlySales: {
                    total: monthlySalesTotal,
                    count: monthlyOrderCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sales chart data
// @route   GET /api/dashboard/sales-chart
// @access  Private
const getSalesChart = async (req, res, next) => {
    try {
        const { period = 30 } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderType: 'sale',
                    status: { $in: ['delivered', 'completed'] },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    total: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const labels = salesData.map(item => item._id);
        const values = salesData.map(item => item.total);
        const counts = salesData.map(item => item.count);

        res.status(200).json({
            success: true,
            data: {
                labels,
                values,
                counts,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory status
// @route   GET /api/dashboard/inventory-status
// @access  Private
const getInventoryStatus = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('category', 'name');

        const totalStock = products.reduce((sum, p) => sum + p.stock.quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.stock.quantity * p.price.cost), 0);

        // Category wise distribution
        const categoryDistribution = await Product.aggregate([
            {
                $match: { isActive: true },
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    stockValue: { $sum: { $multiply: ['$stock.quantity', '$price.cost'] } },
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
                $unwind: '$category',
            },
            {
                $project: {
                    categoryName: '$category.name',
                    count: 1,
                    stockValue: 1,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStock,
                totalValue: totalValue.toFixed(2),
                categoryDistribution,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recent orders
// @route   GET /api/dashboard/recent-orders
// @access  Private
const getRecentOrders = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const orders = await Order.find()
            .populate('items.product', 'name sku')
            .populate('createdBy', 'firstName lastName')
            .sort('-createdAt')
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
// @route   GET /api/dashboard/low-stock
// @access  Private
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            isActive: true,
            $expr: {
                $lte: ['$stock.quantity', '$stock.minThreshold'],
            },
        })
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort('stock.quantity');

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getSalesChart,
    getInventoryStatus,
    getRecentOrders,
    getLowStockProducts,
};