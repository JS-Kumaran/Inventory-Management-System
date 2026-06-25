const logger = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`Error: ${error.message}`);
    logger.error(err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field} already exists. Please use a different ${field}`;
        error = new AppError(message, 400);
    }

    // Mongoose cast error (invalid ID)
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new AppError(message, 404);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token. Please log in again.', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired. Please log in again.', 401);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { AppError, errorHandler };