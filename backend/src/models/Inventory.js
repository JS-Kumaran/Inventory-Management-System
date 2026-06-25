const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        transactionType: {
            type: String,
            enum: ['purchase', 'sale', 'return', 'adjustment', 'transfer'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        previousQuantity: {
            type: Number,
            required: true,
        },
        newQuantity: {
            type: Number,
            required: true,
        },
        reference: {
            type: String,
            trim: true,
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            // Can reference Order, Purchase, etc.
        },
        notes: {
            type: String,
            trim: true,
            maxLength: [500, 'Notes cannot exceed 500 characters'],
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better performance
inventorySchema.index({ product: 1 });
inventorySchema.index({ transactionType: 1 });
inventorySchema.index({ createdAt: -1 });
inventorySchema.index({ product: 1, createdAt: -1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;