const Category = require('../models/Category');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
    try {
        const { name, description, parentCategory, image } = req.body;

        // Check if category exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return next(new AppError('Category with this name already exists', 400));
        }

        // Check parent category
        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent) {
                return next(new AppError('Parent category not found', 404));
            }
        }

        const category = await Category.create({
            name,
            description,
            parentCategory,
            image,
            createdBy: req.user.id,
        });

        // Log creation
        await AuditLog.create({
            user: req.user.id,
            action: 'create',
            module: 'category',
            documentId: category._id,
            status: 'success',
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({})
            .populate('parentCategory', 'name')
            .populate({
                path: 'subcategories',
                select: 'name description isActive',
            });

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parentCategory', 'name')
            .populate({
                path: 'subcategories',
                select: 'name description isActive',
            });

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
    try {
        const { name, description, parentCategory, image, isActive } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        // Check if name exists (excluding current category)
        if (name) {
            const existingCategory = await Category.findOne({ 
                name, 
                _id: { $ne: req.params.id } 
            });
            if (existingCategory) {
                return next(new AppError('Category with this name already exists', 400));
            }
            category.name = name;
        }

        if (description !== undefined) category.description = description;
        if (image) category.image = image;
        if (isActive !== undefined) category.isActive = isActive;
        category.updatedBy = req.user.id;

        // Check parent category
        if (parentCategory) {
            if (parentCategory === category._id.toString()) {
                return next(new AppError('Category cannot be its own parent', 400));
            }
            const parent = await Category.findById(parentCategory);
            if (!parent) {
                return next(new AppError('Parent category not found', 404));
            }
            category.parentCategory = parentCategory;
        }

        await category.save();

        // Log update
        await AuditLog.create({
            user: req.user.id,
            action: 'update',
            module: 'category',
            documentId: category._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        // Check if category has products
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return next(new AppError(`Cannot delete category with ${productCount} products`, 400));
        }

        // Check if category has subcategories
        const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
        if (subcategoryCount > 0) {
            return next(new AppError(`Cannot delete category with ${subcategoryCount} subcategories`, 400));
        }

        await category.deleteOne();

        // Log deletion
        await AuditLog.create({
            user: req.user.id,
            action: 'delete',
            module: 'category',
            documentId: category._id,
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload category image
// @route   POST /api/categories/:id/upload
// @access  Private
const uploadCategoryImage = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        if (!req.file) {
            return next(new AppError('Please upload an image', 400));
        }

        const imageUrl = `/uploads/categories/${req.file.filename}`;
        category.image = imageUrl;
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: { imageUrl },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
};