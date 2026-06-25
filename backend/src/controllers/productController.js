const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const PDFGenerator = require('../utils/pdfGenerator');

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
    try {
        const {
            sku,
            name,
            description,
            category,
            supplier,
            unit,
            price,
            stock,
            isActive,
            isFeatured,
            weight,
            dimensions,
            taxRate,
        } = req.body;

        // Check if SKU exists
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            return next(new AppError('Product with this SKU already exists', 400));
        }

        // Check category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return next(new AppError('Category not found', 404));
        }

        // Check supplier exists
        if (supplier) {
            const supplierExists = await Supplier.findById(supplier);
            if (!supplierExists) {
                return next(new AppError('Supplier not found', 404));
            }
        }

        // Create product
        const product = await Product.create({
            sku,
            name,
            description,
            category,
            supplier,
            unit,
            price,
            stock,
            isActive,
            isFeatured,
            weight,
            dimensions,
            taxRate,
            createdBy: req.user.id,
        });

        // Log creation
        await AuditLog.create({
            user: req.user.id,
            action: 'create',
            module: 'product',
            documentId: product._id,
            status: 'success',
        });

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('supplier', 'name company');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: populatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products with pagination, filtering, and search
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            category, 
            supplier,
            isActive,
            minPrice,
            maxPrice,
            minStock,
            maxStock,
            sort = '-createdAt'
        } = req.query;

        // Build filter
        const filter = {};

        if (search) {
            filter.$text = { $search: search };
        }

        if (category) {
            filter.category = category;
        }

        if (supplier) {
            filter.supplier = supplier;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        if (minPrice || maxPrice) {
            filter['price.selling'] = {};
            if (minPrice) filter['price.selling'].$gte = parseFloat(minPrice);
            if (maxPrice) filter['price.selling'].$lte = parseFloat(maxPrice);
        }

        if (minStock || maxStock) {
            filter['stock.quantity'] = {};
            if (minStock) filter['stock.quantity'].$gte = parseInt(minStock);
            if (maxStock) filter['stock.quantity'].$lte = parseInt(maxStock);
        }

        // Count total documents
        const total = await Product.countDocuments(filter);

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const pages = Math.ceil(total / limitNum);

        // Get products
        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('supplier', 'name company')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: products,
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description')
            .populate('supplier', 'name company email phone');

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        // Log view
        await AuditLog.create({
            user: req.user.id,
            action: 'view',
            module: 'product',
            documentId: product._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            category,
            supplier,
            unit,
            price,
            stock,
            isActive,
            isFeatured,
            weight,
            dimensions,
            taxRate,
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        // Check category exists
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return next(new AppError('Category not found', 404));
            }
        }

        // Check supplier exists
        if (supplier) {
            const supplierExists = await Supplier.findById(supplier);
            if (!supplierExists) {
                return next(new AppError('Supplier not found', 404));
            }
        }

        // Store old stock for audit
        const oldStock = product.stock.quantity;

        // Update product
        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (supplier) product.supplier = supplier;
        if (unit) product.unit = unit;
        if (price) product.price = { ...product.price, ...price };
        if (stock) {
            product.stock = { ...product.stock, ...stock };
        }
        if (isActive !== undefined) product.isActive = isActive;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;
        if (weight !== undefined) product.weight = weight;
        if (dimensions) product.dimensions = dimensions;
        if (taxRate !== undefined) product.taxRate = taxRate;
        
        product.updatedBy = req.user.id;

        await product.save();

        // Log stock change
        if (stock && stock.quantity !== undefined && stock.quantity !== oldStock) {
            await Inventory.create({
                product: product._id,
                transactionType: 'adjustment',
                quantity: stock.quantity - oldStock,
                previousQuantity: oldStock,
                newQuantity: stock.quantity,
                reference: 'Manual adjustment',
                performedBy: req.user.id,
            });
        }

        // Log update
        await AuditLog.create({
            user: req.user.id,
            action: 'update',
            module: 'product',
            documentId: product._id,
            status: 'success',
        });

        const updatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('supplier', 'name company');

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        // Check if product has inventory
        const inventoryCount = await Inventory.countDocuments({ product: product._id });
        if (inventoryCount > 0) {
            return next(new AppError('Cannot delete product with inventory records', 400));
        }

        await product.deleteOne();

        // Log deletion
        await AuditLog.create({
            user: req.user.id,
            action: 'delete',
            module: 'product',
            documentId: product._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload product image
// @route   POST /api/products/:id/upload
// @access  Private
const uploadProductImage = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        if (!req.file) {
            return next(new AppError('Please upload an image', 400));
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;

        // Add image to product
        product.images.push(imageUrl);
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: { imageUrl },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export products to PDF
// @route   GET /api/products/export/pdf
// @access  Private
const exportProductsPDF = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .populate('supplier', 'name')
            .limit(100);

        const filename = `product-report-${Date.now()}.pdf`;
        const filePath = await PDFGenerator.generateProductReport(products, filename);

        res.download(filePath, filename, (err) => {
            if (err) {
                logger.error(`Error downloading PDF: ${err.message}`);
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export products to CSV
// @route   GET /api/products/export/csv
// @access  Private
const exportProductsCSV = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('category', 'name')
            .populate('supplier', 'name');

        const csvWriter = require('csv-writer').createObjectCsvWriter({
            path: `temp/products-${Date.now()}.csv`,
            header: [
                { id: 'sku', title: 'SKU' },
                { id: 'name', title: 'Name' },
                { id: 'category', title: 'Category' },
                { id: 'supplier', title: 'Supplier' },
                { id: 'stock', title: 'Stock' },
                { id: 'costPrice', title: 'Cost Price' },
                { id: 'sellingPrice', title: 'Selling Price' },
                { id: 'stockValue', title: 'Stock Value' },
            ],
        });

        const records = products.map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category?.name || 'N/A',
            supplier: p.supplier?.name || 'N/A',
            stock: p.stock.quantity,
            costPrice: p.price.cost,
            sellingPrice: p.price.selling,
            stockValue: p.stock.quantity * p.price.cost,
        }));

        await csvWriter.writeRecords(records);

        res.download(`temp/products-${Date.now()}.csv`, 'products-export.csv', (err) => {
            if (err) {
                logger.error(`Error downloading CSV: ${err.message}`);
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search products by SKU or name
// @route   GET /api/products/search
// @access  Private
const searchProducts = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return next(new AppError('Please provide a search query', 400));
        }

        const products = await Product.find({
            $or: [
                { sku: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
            ],
        })
            .populate('category', 'name')
            .limit(20);

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            'stock.quantity': { $lte: '$stock.minThreshold' },
            isActive: true,
        })
            .populate('category', 'name')
            .sort('stock.quantity');

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private
const updateStock = async (req, res, next) => {
    try {
        const { quantity, type, reference, notes } = req.body;

        if (!quantity || !type) {
            return next(new AppError('Please provide quantity and type', 400));
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        const oldQuantity = product.stock.quantity;
        let newQuantity = oldQuantity;

        if (type === 'add') {
            newQuantity = oldQuantity + quantity;
        } else if (type === 'subtract') {
            if (oldQuantity < quantity) {
                return next(new AppError('Insufficient stock', 400));
            }
            newQuantity = oldQuantity - quantity;
        } else {
            return next(new AppError('Invalid type. Use "add" or "subtract"', 400));
        }

        product.stock.quantity = newQuantity;
        await product.save();

        // Create inventory record
        await Inventory.create({
            product: product._id,
            transactionType: 'adjustment',
            quantity: type === 'add' ? quantity : -quantity,
            previousQuantity: oldQuantity,
            newQuantity: newQuantity,
            reference: reference || 'Manual stock adjustment',
            notes,
            performedBy: req.user.id,
        });

        // Check if stock is low
        if (newQuantity <= product.stock.minThreshold) {
            logger.warn(`Product ${product.name} (${product.sku}) is low on stock`);
            // Send email notification (optional)
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            data: {
                product: product._id,
                previousQuantity: oldQuantity,
                newQuantity: newQuantity,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    exportProductsPDF,
    exportProductsCSV,
    searchProducts,
    getLowStockProducts,
    updateStock,
};