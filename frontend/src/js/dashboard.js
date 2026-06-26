let salesChart = null;
let inventoryChart = null;

// Load dashboard
async function loadDashboard() {
    showLoader();
    const content = document.getElementById('pageContent');

    try {
        // Load dashboard stats
        const statsResponse = await api.get('/dashboard/stats');
        const stats = statsResponse.data;

        // Load sales chart data
        const chartResponse = await api.get('/dashboard/sales-chart', { period: 30 });
        const chartData = chartResponse.data;

        // Load low stock products
        const lowStockResponse = await api.get('/dashboard/low-stock');
        const lowStockProducts = lowStockResponse.data;

        content.innerHTML = `
            <div class="page-content">
                <h2 class="mb-4"><i class="fas fa-chart-pie me-2"></i>Dashboard</h2>

                <!-- Stats Cards -->
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card primary">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-box"></i></div>
                                <div class="stat-label">Total Products</div>
                                <div class="stat-number">${stats.totalProducts}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card success">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-tags"></i></div>
                                <div class="stat-label">Categories</div>
                                <div class="stat-number">${stats.totalCategories}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card warning">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-truck"></i></div>
                                <div class="stat-label">Suppliers</div>
                                <div class="stat-number">${stats.totalSuppliers}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card info">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                                <div class="stat-label">Total Orders</div>
                                <div class="stat-number">${stats.totalOrders}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-xl-6 col-md-6 mb-4">
                        <div class="card stat-card danger">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-warehouse"></i></div>
                                <div class="stat-label">Stock Value</div>
                                <div class="stat-number">${formatCurrency(stats.totalStockValue)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-6 col-md-6 mb-4">
                        <div class="card stat-card warning">
                            <div class="card-body">
                                <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                                <div class="stat-label">Low Stock Items</div>
                                <div class="stat-number">${stats.lowStockProducts}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="row">
                    <div class="col-xl-8 col-lg-7">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fas fa-chart-area me-1"></i>
                                Sales Overview (Last 30 Days)
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="salesChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-4 col-lg-5">
                        <div class="card mb-4">
                            <div class="card-header">
                                <i class="fas fa-list me-1"></i>
                                Low Stock Products
                            </div>
                            <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                                ${lowStockProducts.length === 0 ? `
                                    <p class="text-muted text-center">No low stock products</p>
                                ` : lowStockProducts.slice(0, 5).map(product => `
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <strong>${product.name}</strong>
                                            <small class="text-muted d-block">${product.sku}</small>
                                        </div>
                                        <span class="badge bg-danger">${product.stock.quantity}</span>
                                    </div>
                                    <hr class="my-1">
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Orders -->
                <div class="card mb-4">
                    <div class="card-header">
                        <i class="fas fa-clock me-1"></i>
                        Recent Orders
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.recentOrders?.length === 0 ? `
                                        <tr>
                                            <td colspan="5" class="text-center">No recent orders</td>
                                        </tr>
                                    ` : stats.recentOrders?.map(order => `
                                        <tr>
                                            <td><strong>${order.orderNumber}</strong></td>
                                            <td>
                                                <span class="badge ${order.orderType === 'sale' ? 'bg-success' : 'bg-primary'}">
                                                    ${order.orderType}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge-status ${order.status}">
                                                    ${order.status}
                                                </span>
                                            </td>
                                            <td>${formatCurrency(order.total)}</td>
                                            <td>${formatDate(order.createdAt)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts
        initializeSalesChart(chartData);

    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading dashboard: ${error.message}
            </div>
        `;
    }
}

// Initialize sales chart
function initializeSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Sales',
                data: data.values || [],
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
                            return '$' + value.toFixed(0);
                        },
                    },
                },
            },
        },
    });
}