const Order = require('../models/Order');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');
const PDFGenerator = require('../utils/pdfGenerator');

// Generate order number
const generateOrderNumber = (type) => {
    const prefix = type === 'purchase' ? 'PO' : 'SO';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
    try {
        const {
            orderType,
            items,
            supplier,
            customer,
            shippingAddress,
            paymentMethod,
            discount,
            shippingCost,
            notes,
            expectedDeliveryDate,
        } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return next(new AppError('Order must have at least one item', 400));
        }

        // Process items
        const processedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return next(new AppError(`Product ${item.product} not found`, 404));
            }

            // Check stock for sales orders
            if (orderType === 'sale' && product.stock.quantity < item.quantity) {
                return next(new AppError(`Insufficient stock for product ${product.name}`, 400));
            }

            const unitPrice = item.unitPrice || product.price.selling;
            const total = unitPrice * item.quantity - (item.discount || 0);

            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                unitPrice,
                discount: item.discount || 0,
                total,
            });

            subtotal += total;
        }

        // Calculate totals
        const tax = subtotal * 0.1; // 10% tax rate
        const total = subtotal + tax + (shippingCost || 0) - (discount || 0);

        // Create order
        const order = await Order.create({
            orderNumber: generateOrderNumber(orderType),
            orderType,
            status: 'pending',
            items: processedItems,
            subtotal,
            tax,
            discount: discount || 0,
            shippingCost: shippingCost || 0,
            total,
            supplier,
            customer,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            notes,
            expectedDeliveryDate,
            createdBy: req.user.id,
        });

        // Update stock for sales orders
        if (orderType === 'sale') {
            for (const item of processedItems) {
                const product = await Product.findById(item.product);
                product.stock.quantity -= item.quantity;
                await product.save();

                // Create inventory record
                await Inventory.create({
                    product: product._id,
                    transactionType: 'sale',
                    quantity: -item.quantity,
                    previousQuantity: product.stock.quantity + item.quantity,
                    newQuantity: product.stock.quantity,
                    reference: `Order #${order.orderNumber}`,
                    referenceId: order._id,
                    performedBy: req.user.id,
                });
            }
        }

        // Update stock for purchase orders
        if (orderType === 'purchase') {
            for (const item of processedItems) {
                const product = await Product.findById(item.product);
                const oldQuantity = product.stock.quantity;
                product.stock.quantity += item.quantity;
                await product.save();

                // Create inventory record
                await Inventory.create({
                    product: product._id,
                    transactionType: 'purchase',
                    quantity: item.quantity,
                    previousQuantity: oldQuantity,
                    newQuantity: product.stock.quantity,
                    reference: `Order #${order.orderNumber}`,
                    referenceId: order._id,
                    performedBy: req.user.id,
                });
            }
        }

        // Log creation
        await AuditLog.create({
            user: req.user.id,
            action: 'create',
            module: 'order',
            documentId: order._id,
            status: 'success',
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name sku')
            .populate('supplier', 'name company')
            .populate('createdBy', 'firstName lastName');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: populatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            orderType,
            status,
            paymentStatus,
            startDate,
            endDate,
        } = req.query;

        const filter = {};
        if (orderType) filter.orderType = orderType;
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Order.countDocuments(filter);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const pages = Math.ceil(total / limitNum);

        const orders = await Order.find(filter)
            .populate('items.product', 'name sku')
            .populate('supplier', 'name company')
            .populate('createdBy', 'firstName lastName')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: orders,
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name sku price')
            .populate('supplier', 'name company email phone')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status) {
            return next(new AppError('Status is required', 400));
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Check valid status transition
        const validTransitions = {
            pending: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered', 'cancelled'],
            delivered: ['returned'],
            cancelled: [],
            returned: [],
        };

        if (!validTransitions[order.status].includes(status)) {
            return next(new AppError(`Cannot transition from ${order.status} to ${status}`, 400));
        }

        order.status = status;
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }
        order.updatedBy = req.user.id;

        await order.save();

        // Handle returns
        if (status === 'returned' && order.orderType === 'sale') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                product.stock.quantity += item.quantity;
                await product.save();

                await Inventory.create({
                    product: product._id,
                    transactionType: 'return',
                    quantity: item.quantity,
                    previousQuantity: product.stock.quantity - item.quantity,
                    newQuantity: product.stock.quantity,
                    reference: `Return for Order #${order.orderNumber}`,
                    referenceId: order._id,
                    performedBy: req.user.id,
                });
            }
        }

        // Log update
        await AuditLog.create({
            user: req.user.id,
            action: 'update',
            module: 'order',
            documentId: order._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus } = req.body;

        if (!paymentStatus) {
            return next(new AppError('Payment status is required', 400));
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        order.paymentStatus = paymentStatus;
        order.updatedBy = req.user.id;
        await order.save();

        // Log update
        await AuditLog.create({
            user: req.user.id,
            action: 'update',
            module: 'order',
            documentId: order._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Only allow deletion of pending orders
        if (order.status !== 'pending') {
            return next(new AppError('Only pending orders can be deleted', 400));
        }

        // Reverse stock changes
        if (order.orderType === 'sale') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                product.stock.quantity += item.quantity;
                await product.save();
            }
        }

        if (order.orderType === 'purchase') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                product.stock.quantity -= item.quantity;
                await product.save();
            }
        }

        await order.deleteOne();

        // Log deletion
        await AuditLog.create({
            user: req.user.id,
            action: 'delete',
            module: 'order',
            documentId: order._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate order PDF
// @route   GET /api/orders/:id/pdf
// @access  Private
const generateOrderPDF = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name sku')
            .populate('supplier', 'name company email phone')
            .populate('createdBy', 'firstName lastName');

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        const filename = `order-${order.orderNumber}-${Date.now()}.pdf`;
        const filePath = await PDFGenerator.generateOrderReport(order, filename);

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
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    generateOrderPDF,
};