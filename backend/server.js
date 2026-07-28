const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import modules
const connectDB = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const { globalLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Create upload directories
const uploadDirs = [
    './src/uploads',
    './src/uploads/products',
    './src/uploads/categories',
    './src/uploads/profiles',
    './temp',
    './logs'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ============================================
// CORS CONFIGURATION - FIXED
// ============================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
app.use('/api', globalLimiter);

// ============================================
// TEST ENDPOINT - ADD THIS
// ============================================
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API Base URL: http://localhost:${PORT}/api`);
    logger.info(`Test endpoint: http://localhost:${PORT}/api/test`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing server...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed. Process terminated.');
            process.exit(0);
        });
    });
});

module.exports = app;