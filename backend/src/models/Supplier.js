const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            trim: true,
            maxLength: [100, 'Name cannot exceed 100 characters'],
        },
        company: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        taxId: {
            type: String,
            trim: true,
        },
        paymentTerms: {
            type: String,
            enum: ['net30', 'net60', 'net90', 'cod', 'prepaid'],
            default: 'net30',
        },
        leadTime: {
            type: Number, // in days
            default: 7,
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
    }
);

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ company: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;