/* global showLoader, APP, showToast, api, formatCurrency */
/* exported loadReports, generateInventoryReport, exportInventoryReport, generateSalesReport, generateLowStockReport, viewActivityLog */

// Load reports
async function loadReports() {
    showLoader();
    const content = document.getElementById('pageContent');

    content.innerHTML = `
        <div class="page-content">
            <h2 class="mb-4"><i class="fas fa-file-alt me-2"></i>Reports</h2>

            <div class="row">
                <!-- Inventory Report -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-warehouse me-1"></i>
                            Inventory Report
                        </div>
                        <div class="card-body">
                            <p class="text-muted">Generate a complete inventory report with all products and stock levels.</p>
                            <button class="btn btn-primary" onclick="generateInventoryReport()">
                                <i class="fas fa-file-pdf me-1"></i>Generate PDF
                            </button>
                            <button class="btn btn-success" onclick="exportInventoryReport()">
                                <i class="fas fa-file-csv me-1"></i>Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Sales Report -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-chart-line me-1"></i>
                            Sales Report
                        </div>
                        <div class="card-body">
                            <p class="text-muted">Generate sales report with revenue and top products.</p>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label>Start Date</label>
                                    <input type="date" class="form-control" id="salesStartDate">
                                </div>
                                <div class="col-md-6">
                                    <label>End Date</label>
                                    <input type="date" class="form-control" id="salesEndDate">
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="generateSalesReport()">
                                <i class="fas fa-file-pdf me-1"></i>Generate Report
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Low Stock Report -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            Low Stock Report
                        </div>
                        <div class="card-body">
                            <p class="text-muted">List of products that are below minimum stock threshold.</p>
                            <button class="btn btn-warning" onclick="generateLowStockReport()">
                                <i class="fas fa-file-alt me-1"></i>Generate Report
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Activity Log -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-history me-1"></i>
                            Activity Log
                        </div>
                        <div class="card-body">
                            <p class="text-muted">View system activity and audit logs.</p>
                            <button class="btn btn-info" onclick="viewActivityLog()">
                                <i class="fas fa-list me-1"></i>View Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate inventory report
async function generateInventoryReport() {
    try {
        const response = await fetch(`${APP.apiBase}/reports/export/pdf?type=inventory`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Inventory report generated successfully');
    } catch (error) {
        showToast('Error generating report: ' + error.message, 'error');
    }
}

// Export inventory report (CSV)
async function exportInventoryReport() {
    try {
        const response = await fetch(`${APP.apiBase}/reports/export/csv`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Inventory exported successfully');
    } catch (error) {
        showToast('Error exporting inventory: ' + error.message, 'error');
    }
}

// Generate sales report
async function generateSalesReport() {
    const startDate = document.getElementById('salesStartDate').value;
    const endDate = document.getElementById('salesEndDate').value;

    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'warning');
        return;
    }

    try {
        const response = await api.get('/reports/sales', { startDate, endDate });
        const data = response.data;

        // Show report in a modal or alert
        let message = `Sales Report\n${startDate} to ${endDate}\n\n`;
        message += `Total Sales: ${formatCurrency(data.summary.totalSales)}\n`;
        message += `Total Orders: ${data.summary.totalOrders}\n`;
        message += `Average Order Value: ${formatCurrency(data.summary.averageOrderValue)}\n\n`;
        message += `Top Products:\n`;
        data.topProducts.forEach((p, i) => {
            message += `${i+1}. ${p.productName} - ${p.quantity} units - ${formatCurrency(p.revenue)}\n`;
        });

        alert(message);
        showToast('Sales report generated successfully');
    } catch (error) {
        showToast('Error generating sales report: ' + error.message, 'error');
    }
}

// Generate low stock report
async function generateLowStockReport() {
    try {
        const response = await api.get('/reports/low-stock');
        const products = response.data;

        if (products.length === 0) {
            showToast('No low stock products found', 'success');
            return;
        }

        let message = `Low Stock Report\n${new Date().toLocaleDateString()}\n\n`;
        message += `Found ${products.length} products below threshold\n\n`;
        products.forEach((p, i) => {
            message += `${i+1}. ${p.name} (${p.sku})\n`;
            message += `   Current: ${p.stock.quantity}, Threshold: ${p.stock.minThreshold}\n`;
            message += `   Category: ${p.category?.name || 'N/A'}\n\n`;
        });

        alert(message);
        showToast('Low stock report generated');
    } catch (error) {
        showToast('Error generating low stock report: ' + error.message, 'error');
    }
}

// View activity log
async function viewActivityLog() {
    try {
        // This would call an audit log endpoint
        // For now, show a placeholder
        alert('Activity Log\n\nThis feature will display all system activities including:\n' +
              '- User logins/logouts\n' +
              '- Product creations/updates/deletions\n' +
              '- Order creations/updates\n' +
              '- Stock adjustments\n' +
              '- And more...\n\n' +
              'You can filter by user, action type, date range, and module.');
    } catch (error) {
        showToast('Error loading activity log: ' + error.message, 'error');
    }
}