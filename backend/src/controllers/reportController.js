const Product = require('../models/Product');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const PDFGenerator = require('../utils/pdfGenerator');
const { AppError } = require('../middleware/errorHandler');

// @desc    Generate inventory report
// @route   GET /api/reports/inventory
// @access  Private
const generateInventoryReport = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .populate('supplier', 'name');

        const reportData = products.map(product => ({
            sku: product.sku,
            name: product.name,
            category: product.category?.name || 'N/A',
            supplier: product.supplier?.name || 'N/A',
            quantity: product.stock.quantity,
            minThreshold: product.stock.minThreshold,
            costPrice: product.price.cost,
            sellingPrice: product.price.selling,
            stockValue: product.stock.quantity * product.price.cost,
            profitMargin: ((product.price.selling - product.price.cost) / product.price.cost * 100).toFixed(2),
        }));

        res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate sales report
// @route   GET /api/reports/sales
// @access  Private
const generateSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

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
            .populate('items.product', 'name sku')
            .populate('createdBy', 'firstName lastName');

        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;

        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.product._id.toString();
                if (!productSales[key]) {
                    productSales[key] = {
                        productName: item.product.name,
                        sku: item.product.sku,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productSales[key].quantity += item.quantity;
                productSales[key].revenue += item.total;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalSales,
                    totalOrders,
                    averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
                },
                topProducts,
                orders,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate low stock report
// @route   GET /api/reports/low-stock
// @access  Private
const generateLowStockReport = async (req, res, next) => {
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

// @desc    Export report to PDF
// @route   GET /api/reports/export/pdf
// @access  Private
const exportReportPDF = async (req, res, next) => {
    try {
        const { type } = req.query;

        let products = [];
        let filename = '';

        if (type === 'inventory') {
            products = await Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('supplier', 'name');
            filename = 'inventory-report.pdf';
        } else {
            return next(new AppError('Invalid report type', 400));
        }

        const filePath = await PDFGenerator.generateProductReport(products, filename);

        res.download(filePath, filename, (err) => {
            if (err) {
                next(err);
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateInventoryReport,
    generateSalesReport,
    generateLowStockReport,
    exportReportPDF,
};