/**
 * Dashboard Module - Simplified Version
 * @version 1.0.0
 */

// Load dashboard without API calls
function loadDashboard() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2 class="mb-4"><i class="fas fa-chart-pie me-2"></i>Dashboard</h2>' +
                '<div class="row">' +
                    '<div class="col-xl-3 col-md-6 mb-4">' +
                        '<div class="card stat-card primary">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-box"></i></div>' +
                                '<div class="stat-label">Total Products</div>' +
                                '<div class="stat-number">0</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xl-3 col-md-6 mb-4">' +
                        '<div class="card stat-card success">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-tags"></i></div>' +
                                '<div class="stat-label">Categories</div>' +
                                '<div class="stat-number">0</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xl-3 col-md-6 mb-4">' +
                        '<div class="card stat-card warning">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-truck"></i></div>' +
                                '<div class="stat-label">Suppliers</div>' +
                                '<div class="stat-number">0</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xl-3 col-md-6 mb-4">' +
                        '<div class="card stat-card info">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>' +
                                '<div class="stat-label">Total Orders</div>' +
                                '<div class="stat-number">0</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-xl-6 col-md-6 mb-4">' +
                        '<div class="card stat-card danger">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-warehouse"></i></div>' +
                                '<div class="stat-label">Stock Value</div>' +
                                '<div class="stat-number">$0.00</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xl-6 col-md-6 mb-4">' +
                        '<div class="card stat-card warning">' +
                            '<div class="card-body">' +
                                '<div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>' +
                                '<div class="stat-label">Low Stock Items</div>' +
                                '<div class="stat-number">0</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="row">' +
                    '<div class="col-xl-8 col-lg-7">' +
                        '<div class="card mb-4">' +
                            '<div class="card-header">' +
                                '<i class="fas fa-chart-area me-1"></i> Sales Overview' +
                            '</div>' +
                            '<div class="card-body">' +
                                '<div class="chart-container">' +
                                    '<canvas id="salesChart"></canvas>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xl-4 col-lg-5">' +
                        '<div class="card mb-4">' +
                            '<div class="card-header">' +
                                '<i class="fas fa-list me-1"></i> Quick Actions' +
                            '</div>' +
                            '<div class="card-body">' +
                                '<div class="d-grid gap-2">' +
                                    '<button class="btn btn-primary" onclick="showPage(\'products\')">' +
                                        '<i class="fas fa-box me-2"></i>Manage Products' +
                                    '</button>' +
                                    '<button class="btn btn-success" onclick="showPage(\'orders\')">' +
                                        '<i class="fas fa-shopping-cart me-2"></i>View Orders' +
                                    '</button>' +
                                    '<button class="btn btn-warning" onclick="showPage(\'inventory\')">' +
                                        '<i class="fas fa-warehouse me-2"></i>Check Inventory' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Dashboard loaded successfully! Connect to backend API to see real data.' +
                '</div>' +
            '</div>';

        // Initialize a simple chart
        initializeSimpleChart();
    }
}

// Initialize a simple chart
function initializeSimpleChart() {
    var ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Sales',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + Number(value).toFixed(0);
                        },
                    },
                },
            },
        },
    });
}

// Make functions globally available
window.loadDashboard = loadDashboard;