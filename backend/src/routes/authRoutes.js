const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    validate, 
    body, 
    validateObjectId 
} = require('../middleware/validation');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');

// Public routes
router.post(
    '/register',
    [
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('phone').optional().isString(),
        body('role').optional().isIn(['admin', 'manager', 'staff']),
    ],
    validate,
    register
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    login
);

router.post(
    '/forgotpassword',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
    ],
    validate,
    forgotPassword
);

router.post(
    '/resetpassword/:token',
    [
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
    ],
    validate,
    resetPassword
);

// Private routes
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put(
    '/changepassword',
    protect,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
    ],
    validate,
    changePassword
);
router.post('/logout', protect, logout);

module.exports = router;