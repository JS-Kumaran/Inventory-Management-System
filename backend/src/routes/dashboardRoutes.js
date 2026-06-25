const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getDashboardStats,
    getSalesChart,
    getInventoryStatus,
    getRecentOrders,
    getLowStockProducts,
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/inventory-status', getInventoryStatus);
router.get('/recent-orders', getRecentOrders);
router.get('/low-stock', getLowStockProducts);

module.exports = router;