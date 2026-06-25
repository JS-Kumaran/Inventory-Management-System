const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        orderType: {
            type: String,
            enum: ['purchase', 'sale'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Quantity must be at least 1'],
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: [0, 'Price cannot be negative'],
                },
                discount: {
                    type: Number,
                    default: 0,
                    min: [0, 'Discount cannot be negative'],
                },
                total: {
                    type: Number,
                    required: true,
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
        customer: {
            name: String,
            email: String,
            phone: String,
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Create indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ supplier: 1 });
orderSchema.index({ 'customer.email': 1 });

// Pre-save middleware to calculate totals
orderSchema.pre('save', function (next) {
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    
    // Calculate total
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
    
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;