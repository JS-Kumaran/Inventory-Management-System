const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    generateInventoryReport,
    generateSalesReport,
    generateLowStockReport,
    exportReportPDF,
} = require('../controllers/reportController');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/inventory', generateInventoryReport);
router.get('/sales', generateSalesReport);
router.get('/low-stock', generateLowStockReport);
router.get('/export/pdf', exportReportPDF);

module.exports = router;