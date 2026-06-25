const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            maxLength: [100, 'Category name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Description cannot exceed 500 characters'],
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        image: {
            type: String,
            default: 'default-category.png',
        },
        isActive: {
            type: Boolean,
            default: true,
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

// Virtual field for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory',
});

// Index for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;