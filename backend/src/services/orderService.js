const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryService = require('./inventoryService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Order Service - Handles all order-related business logic
 */
class OrderService {
    /**
     * Generate order number
     */
    static generateOrderNumber(type) {
        const prefix = type === 'purchase' ? 'PO' : 'SO';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Create new order
     */
    static async createOrder(orderData, userId) {
        const {
            orderType,
            items,
            supplier,
            customer,
            shippingAddress,
            paymentMethod,
            discount = 0,
            shippingCost = 0,
            notes,
            expectedDeliveryDate,
        } = orderData;

        // Validate items
        if (!items || items.length === 0) {
            throw new AppError('Order must have at least one item', 400);
        }

        // Process items and calculate totals
        const processedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new AppError(`Product ${item.product} not found`, 404);
            }

            // Check stock for sales orders
            if (orderType === 'sale' && product.stock.quantity < item.quantity) {
                throw new AppError(`Insufficient stock for product ${product.name}`, 400);
            }

            const unitPrice = item.unitPrice || product.price.selling;
            const total = (unitPrice * item.quantity) - (item.discount || 0);

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
        const tax = subtotal * 0.1; // 10% tax rate (configurable)
        const total = subtotal + tax + shippingCost - discount;

        // Create order
        const order = await Order.create({
            orderNumber: this.generateOrderNumber(orderType),
            orderType,
            status: 'pending',
            items: processedItems,
            subtotal,
            tax,
            discount,
            shippingCost,
            total,
            supplier,
            customer,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            notes,
            expectedDeliveryDate,
            createdBy: userId,
        });

        // Update stock based on order type
        if (orderType === 'sale') {
            for (const item of processedItems) {
                await InventoryService.updateStock(
                    item.product,
                    -item.quantity,
                    'sale',
                    userId,
                    {
                        reference: `Order #${order.orderNumber}`,
                        referenceId: order._id,
                    }
                );
            }
        }

        if (orderType === 'purchase') {
            for (const item of processedItems) {
                await InventoryService.updateStock(
                    item.product,
                    item.quantity,
                    'purchase',
                    userId,
                    {
                        reference: `Order #${order.orderNumber}`,
                        referenceId: order._id,
                    }
                );
            }
        }

        // Populate the order before returning
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name sku price')
            .populate('supplier', 'name company')
            .populate('createdBy', 'firstName lastName');

        return populatedOrder;
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(orderId, status, userId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Validate status transition
        const validTransitions = {
            pending: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered', 'cancelled'],
            delivered: ['returned'],
            cancelled: [],
            returned: [],
        };

        if (!validTransitions[order.status].includes(status)) {
            throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
        }

        // Handle special cases
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        if (status === 'returned' && order.orderType === 'sale') {
            // Reverse stock for returned items
            for (const item of order.items) {
                await InventoryService.updateStock(
                    item.product,
                    item.quantity,
                    'return',
                    userId,
                    {
                        reference: `Return for Order #${order.orderNumber}`,
                        referenceId: order._id,
                    }
                );
            }
        }

        order.status = status;
        order.updatedBy = userId;
        await order.save();

        return order;
    }

    /**
     * Cancel order
     */
    static async cancelOrder(orderId, userId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status === 'cancelled') {
            throw new AppError('Order is already cancelled', 400);
        }

        if (order.status === 'delivered' || order.status === 'returned') {
            throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
        }

        // Reverse stock changes for sales orders
        if (order.orderType === 'sale' && order.status !== 'cancelled') {
            for (const item of order.items) {
                await InventoryService.updateStock(
                    item.product,
                    item.quantity,
                    'adjustment',
                    userId,
                    {
                        reference: `Cancellation of Order #${order.orderNumber}`,
                        referenceId: order._id,
                        notes: 'Stock restored due to order cancellation',
                    }
                );
            }
        }

        // Reverse stock changes for purchase orders
        if (order.orderType === 'purchase' && order.status !== 'cancelled') {
            for (const item of order.items) {
                await InventoryService.updateStock(
                    item.product,
                    -item.quantity,
                    'adjustment',
                    userId,
                    {
                        reference: `Cancellation of Order #${order.orderNumber}`,
                        referenceId: order._id,
                        notes: 'Stock removed due to order cancellation',
                    }
                );
            }
        }

        order.status = 'cancelled';
        order.updatedBy = userId;
        await order.save();

        return order;
    }

    /**
     * Get order summary
     */
    static async getOrderSummary() {
        const [
            totalOrders,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue,
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'processing' }),
            Order.countDocuments({ status: 'shipped' }),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' }),
            Order.aggregate([
                {
                    $match: {
                        orderType: 'sale',
                        status: 'delivered',
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' },
                    },
                },
            ]),
        ]);

        return {
            totalOrders,
            pendingOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            completionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
        };
    }
}

module.exports = OrderService;