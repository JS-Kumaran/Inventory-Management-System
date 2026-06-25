const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const EmailService = require('../utils/emailService');

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('User already exists with this email', 400));
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: role || 'staff',
        });

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        const userData = user.toObject();
        delete userData.password;

        // Log registration
        await AuditLog.create({
            user: user._id,
            action: 'create',
            module: 'auth',
            documentId: user._id,
            status: 'success',
        });

        // Send welcome email
        await EmailService.sendWelcomeEmail(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: userData, token },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(new AppError('Invalid credentials', 401));
        }

        // Check if user is active
        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated', 401));
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new AppError('Invalid credentials', 401));
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        const userData = user.toObject();
        delete userData.password;

        // Log login
        await AuditLog.create({
            user: user._id,
            action: 'login',
            module: 'auth',
            status: 'success',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: userData, token },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findById(req.user.id);

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/changepassword
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(new AppError('Please provide current password and new password', 400));
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isPasswordMatch = await user.comparePassword(currentPassword);
        if (!isPasswordMatch) {
            return next(new AppError('Current password is incorrect', 401));
        }

        // Update password
        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();

        // Generate new token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: { token },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
    try {
        // Log logout
        await AuditLog.create({
            user: req.user.id,
            action: 'logout',
            module: 'auth',
            status: 'success',
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('No user found with this email', 404));
        }

        // Generate reset token
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Save reset token to user
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // Send reset email
        await EmailService.sendPasswordResetEmail(email, resetToken);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/resetpassword/:token
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({
            _id: decoded.id,
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return next(new AppError('Invalid or expired reset token', 400));
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordChangedAt = new Date();
        await user.save();

        // Generate new token
        const newToken = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: { token: newToken },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    forgotPassword,
    resetPassword,
};