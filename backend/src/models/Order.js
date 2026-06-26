const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        orderType: {
            type: String,
            enum: ['purchase', 'sale'],
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
            index: true,
        },
        items: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'OrderItem',
            }
        ],
        // For backward compatibility - can also store items directly
        // But we'll use OrderItem as separate collection for better tracking
        subtotal: {
            type: Number,
            required: true,
            min: [0, 'Subtotal cannot be negative'],
        },
        tax: {
            type: Number,
            default: 0,
            min: [0, 'Tax cannot be negative'],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
        },
        shippingCost: {
            type: Number,
            default: 0,
            min: [0, 'Shipping cost cannot be negative'],
        },
        total: {
            type: Number,
            required: true,
            min: [0, 'Total cannot be negative'],
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            index: true,
        },
        customer: {
            name: {
                type: String,
                trim: true,
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
            },
            phone: {
                type: String,
                trim: true,
            },
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String,
                country: String,
            },
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'online'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
            index: true,
        },
        paymentDetails: {
            transactionId: String,
            paymentDate: Date,
            paymentGateway: String,
            cardLastFour: String,
        },
        notes: {
            type: String,
            trim: true,
            maxLength: [1000, 'Notes cannot exceed 1000 characters'],
        },
        expectedDeliveryDate: {
            type: Date,
        },
        deliveredAt: {
            type: Date,
        },
        // Tracking information
        trackingNumber: {
            type: String,
            trim: true,
        },
        trackingUrl: {
            type: String,
            trim: true,
        },
        shippingCarrier: {
            type: String,
            trim: true,
        },
        // For purchase orders
        purchaseOrderNumber: {
            type: String,
            trim: true,
        },
        // For returns
        returnReason: {
            type: String,
            trim: true,
        },
        returnApproved: {
            type: Boolean,
            default: false,
        },
        returnApprovedAt: {
            type: Date,
        },
        returnApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Approval workflow
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: {
            type: Date,
        },
        // Created by
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for order items
orderSchema.virtual('orderItems', {
    ref: 'OrderItem',
    localField: '_id',
    foreignField: 'order',
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function () {
    return this.items ? this.items.length : 0;
});

// Virtual for fulfillment status
orderSchema.virtual('fulfillmentStatus').get(function () {
    if (!this.items || this.items.length === 0) return 'pending';
    
    // This would be computed from order items
    // For now, return the overall status
    return this.status;
});

// Virtual for isFullyDelivered
orderSchema.virtual('isFullyDelivered').get(function () {
    return this.status === 'delivered';
});

// Virtual for isFullyPaid
orderSchema.virtual('isFullyPaid').get(function () {
    return this.paymentStatus === 'paid';
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function (next) {
    // If items are being modified, totals should be recalculated
    // but since we're using OrderItem collection, this will be handled separately
    next();
});

// Instance method to calculate totals from order items
orderSchema.methods.calculateTotals = async function () {
    const OrderItem = mongoose.model('OrderItem');
    const items = await OrderItem.find({ order: this._id });
    
    this.subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    this.discount = items.reduce((sum, item) => sum + item.discount, 0);
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
    
    return this.save();
};

// Instance method to get order summary with items
orderSchema.methods.getFullDetails = async function () {
    const OrderItem = mongoose.model('OrderItem');
    const items = await OrderItem.find({ order: this._id })
        .populate('product', 'name sku price category supplier')
        .sort('createdAt');
    
    return {
        order: this,
        items,
    };
};

// Static method to get order statistics
orderSchema.statics.getStatistics = async function (startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                totalTax: { $sum: '$tax' },
                totalDiscount: { $sum: '$discount' },
                averageOrderValue: { $avg: '$total' },
                maxOrderValue: { $max: '$total' },
                minOrderValue: { $min: '$total' },
            },
        },
    ]);
    
    return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
        averageOrderValue: 0,
        maxOrderValue: 0,
        minOrderValue: 0,
    };
};

// Create indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ supplier: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ trackingNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;