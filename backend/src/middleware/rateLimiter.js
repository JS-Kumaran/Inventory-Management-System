const rateLimit = require('express-rate-limit');

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// API rate limiter
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: {
        success: false,
        message: 'Too many API requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, apiLimiter };