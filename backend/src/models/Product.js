const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxLength: [200, 'Name cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxLength: [2000, 'Description cannot exceed 2000 characters'],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            enum: ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set'],
        },
        price: {
            cost: {
                type: Number,
                required: [true, 'Cost price is required'],
                min: [0, 'Cost cannot be negative'],
            },
            selling: {
                type: Number,
                required: [true, 'Selling price is required'],
                min: [0, 'Selling price cannot be negative'],
            },
            wholesale: {
                type: Number,
                min: [0, 'Wholesale price cannot be negative'],
            },
        },
        stock: {
            quantity: {
                type: Number,
                required: true,
                default: 0,
                min: [0, 'Stock cannot be negative'],
            },
            minThreshold: {
                type: Number,
                required: true,
                default: 10,
                min: [0, 'Minimum threshold cannot be negative'],
            },
            maxThreshold: {
                type: Number,
                min: [0, 'Maximum threshold cannot be negative'],
            },
            location: {
                aisle: String,
                shelf: String,
                bin: String,
            },
        },
        images: {
            type: [String],
            default: ['default-product.png'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        weight: {
            type: Number,
            min: [0, 'Weight cannot be negative'],
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
        },
        taxRate: {
            type: Number,
            default: 0,
            min: [0, 'Tax rate cannot be negative'],
            max: [100, 'Tax rate cannot exceed 100'],
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for total stock value
productSchema.virtual('stockValue').get(function () {
    return this.stock.quantity * this.price.cost;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function () {
    if (this.price.cost === 0) return 0;
    return ((this.price.selling - this.price.cost) / this.price.cost) * 100;
});

// Indexes for better performance
productSchema.index({ sku: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ 'stock.quantity': 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;