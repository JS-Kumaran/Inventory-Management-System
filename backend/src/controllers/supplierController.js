const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res, next) => {
    try {
        const {
            name,
            company,
            email,
            phone,
            address,
            taxId,
            paymentTerms,
            leadTime,
        } = req.body;

        // Check if supplier exists
        const existingSupplier = await Supplier.findOne({ email });
        if (existingSupplier) {
            return next(new AppError('Supplier with this email already exists', 400));
        }

        const supplier = await Supplier.create({
            name,
            company,
            email,
            phone,
            address,
            taxId,
            paymentTerms,
            leadTime,
            createdBy: req.user.id,
        });

        // Log creation
        await AuditLog.create({
            user: req.user.id,
            action: 'create',
            module: 'supplier',
            documentId: supplier._id,
            status: 'success',
        });

        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', isActive } = req.query;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const total = await Supplier.countDocuments(filter);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const pages = Math.ceil(total / limitNum);

        const suppliers = await Supplier.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: suppliers,
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

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email');

        if (!supplier) {
            return next(new AppError('Supplier not found', 404));
        }

        res.status(200).json({
            success: true,
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res, next) => {
    try {
        const {
            name,
            company,
            email,
            phone,
            address,
            taxId,
            paymentTerms,
            leadTime,
            isActive,
        } = req.body;

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return next(new AppError('Supplier not found', 404));
        }

        // Check email uniqueness
        if (email) {
            const existingSupplier = await Supplier.findOne({
                email,
                _id: { $ne: req.params.id },
            });
            if (existingSupplier) {
                return next(new AppError('Supplier with this email already exists', 400));
            }
            supplier.email = email;
        }

        if (name) supplier.name = name;
        if (company) supplier.company = company;
        if (phone) supplier.phone = phone;
        if (address) supplier.address = address;
        if (taxId) supplier.taxId = taxId;
        if (paymentTerms) supplier.paymentTerms = paymentTerms;
        if (leadTime !== undefined) supplier.leadTime = leadTime;
        if (isActive !== undefined) supplier.isActive = isActive;
        supplier.updatedBy = req.user.id;

        await supplier.save();

        // Log update
        await AuditLog.create({
            user: req.user.id,
            action: 'update',
            module: 'supplier',
            documentId: supplier._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully',
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return next(new AppError('Supplier not found', 404));
        }

        // Check if supplier has products
        const productCount = await Product.countDocuments({ supplier: supplier._id });
        if (productCount > 0) {
            return next(new AppError(`Cannot delete supplier with ${productCount} products`, 400));
        }

        await supplier.deleteOne();

        // Log deletion
        await AuditLog.create({
            user: req.user.id,
            action: 'delete',
            module: 'supplier',
            documentId: supplier._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier,
};