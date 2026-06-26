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

// Initialize Express
const app = express();

// Connect Database
connectDB();

// Create required folders
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

// Security
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Uploads
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logger
app.use(morgan('combined', { stream: logger.stream }));

// Rate Limiter
app.use('/api', globalLimiter);

// Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
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

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Frontend: http://localhost:${PORT}`);
    logger.info(`API: http://localhost:${PORT}/api`);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', err => {
    logger.error(err);
    server.close(() => process.exit(1));
});

// Uncaught Exception
process.on('uncaughtException', err => {
    logger.error(err);
    server.close(() => process.exit(1));
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    server.close(() => {
        mongoose.connection.close(false, () => {
            logger.info('MongoDB disconnected');
            process.exit(0);
        });
    });
});

module.exports = app;