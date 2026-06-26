const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Order reference is required'],
            index: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required'],
            index: true,
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: [0, 'Unit price cannot be negative'],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
        },
        taxRate: {
            type: Number,
            default: 0,
            min: [0, 'Tax rate cannot be negative'],
            max: [100, 'Tax rate cannot exceed 100'],
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: [0, 'Tax amount cannot be negative'],
        },
        total: {
            type: Number,
            required: [true, 'Total is required'],
            min: [0, 'Total cannot be negative'],
        },
        // Additional fields for tracking
        batchNumber: {
            type: String,
            trim: true,
        },
        expiryDate: {
            type: Date,
        },
        serialNumber: {
            type: String,
            trim: true,
        },
        // For return tracking
        isReturned: {
            type: Boolean,
            default: false,
        },
        returnedQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Returned quantity cannot be negative'],
        },
        returnReason: {
            type: String,
            trim: true,
            maxLength: [500, 'Return reason cannot exceed 500 characters'],
        },
        // For status tracking
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
        },
        // For fulfillment tracking
        fulfilledQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Fulfilled quantity cannot be negative'],
        },
        fulfillmentStatus: {
            type: String,
            enum: ['pending', 'partial', 'fulfilled', 'cancelled'],
            default: 'pending',
        },
        // Metadata
        notes: {
            type: String,
            trim: true,
            maxLength: [500, 'Notes cannot exceed 500 characters'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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

// Compound index for faster queries
orderItemSchema.index({ order: 1, product: 1 });
orderItemSchema.index({ product: 1, order: 1 });
orderItemSchema.index({ status: 1 });
orderItemSchema.index({ fulfillmentStatus: 1 });

// Virtual for subtotal (quantity * unitPrice)
orderItemSchema.virtual('subtotal').get(function () {
    return this.quantity * this.unitPrice;
});

// Virtual for net total (subtotal - discount)
orderItemSchema.virtual('netTotal').get(function () {
    return this.subtotal - this.discount;
});

// Virtual for remaining quantity
orderItemSchema.virtual('remainingQuantity').get(function () {
    return this.quantity - this.fulfilledQuantity;
});

// Virtual for returnable quantity
orderItemSchema.virtual('returnableQuantity').get(function () {
    return this.fulfilledQuantity - this.returnedQuantity;
});

// Pre-save middleware to calculate totals
orderItemSchema.pre('save', function (next) {
    // Calculate tax amount
    this.taxAmount = (this.unitPrice * this.quantity * this.taxRate) / 100;
    
    // Calculate total (unitPrice * quantity - discount + taxAmount)
    this.total = (this.unitPrice * this.quantity) - this.discount + this.taxAmount;
    
    // Update fulfillment status based on quantities
    if (this.fulfilledQuantity === 0) {
        this.fulfillmentStatus = 'pending';
    } else if (this.fulfilledQuantity >= this.quantity) {
        this.fulfillmentStatus = 'fulfilled';
    } else if (this.fulfilledQuantity > 0 && this.fulfilledQuantity < this.quantity) {
        this.fulfillmentStatus = 'partial';
    }
    
    next();
});

// Instance method to check if item can be fulfilled
orderItemSchema.methods.canFulfill = function (quantity) {
    if (this.status === 'cancelled' || this.status === 'returned') {
        return false;
    }
    const remaining = this.quantity - this.fulfilledQuantity;
    return quantity <= remaining;
};

// Instance method to fulfill item
orderItemSchema.methods.fulfill = function (quantity, userId) {
    if (!this.canFulfill(quantity)) {
        throw new Error('Cannot fulfill requested quantity');
    }
    
    this.fulfilledQuantity += quantity;
    this.updatedBy = userId;
    
    // Update fulfillment status
    if (this.fulfilledQuantity >= this.quantity) {
        this.fulfillmentStatus = 'fulfilled';
    } else if (this.fulfilledQuantity > 0) {
        this.fulfillmentStatus = 'partial';
    }
    
    return this.save();
};

// Instance method to return item
orderItemSchema.methods.returnItem = function (quantity, reason, userId) {
    if (quantity > this.fulfilledQuantity - this.returnedQuantity) {
        throw new Error('Cannot return more than fulfilled quantity');
    }
    
    this.returnedQuantity += quantity;
    this.isReturned = true;
    this.returnReason = reason || this.returnReason;
    this.updatedBy = userId;
    this.status = 'returned';
    
    return this.save();
};

// Instance method to cancel item
orderItemSchema.methods.cancel = function (userId) {
    if (this.fulfilledQuantity > 0) {
        throw new Error('Cannot cancel item that has been partially fulfilled');
    }
    
    this.status = 'cancelled';
    this.fulfillmentStatus = 'cancelled';
    this.updatedBy = userId;
    
    return this.save();
};

// Static method to get order items summary
orderItemSchema.statics.getOrderSummary = async function (orderId) {
    const items = await this.find({ order: orderId })
        .populate('product', 'name sku price');
    
    const summary = {
        totalItems: items.length,
        totalQuantity: 0,
        totalAmount: 0,
        totalDiscount: 0,
        totalTax: 0,
        fulfilledQuantity: 0,
        returnedQuantity: 0,
        items: items.map(item => ({
            productId: item.product._id,
            productName: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxAmount: item.taxAmount,
            total: item.total,
            status: item.status,
            fulfillmentStatus: item.fulfillmentStatus,
            fulfilledQuantity: item.fulfilledQuantity,
            returnedQuantity: item.returnedQuantity,
            remainingQuantity: item.remainingQuantity,
        })),
    };
    
    // Calculate totals
    items.forEach(item => {
        summary.totalQuantity += item.quantity;
        summary.totalAmount += item.total;
        summary.totalDiscount += item.discount;
        summary.totalTax += item.taxAmount;
        summary.fulfilledQuantity += item.fulfilledQuantity;
        summary.returnedQuantity += item.returnedQuantity;
    });
    
    return summary;
};

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;