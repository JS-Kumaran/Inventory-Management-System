let currentInventoryPage = 1;
let inventoryFilters = {};

// Load inventory page
async function loadInventory() {
    showLoader();
    const content = document.getElementById('pageContent');

    try {
        // Load summary
        const summaryResponse = await api.get('/inventory/summary');
        const summary = summaryResponse.data;

        // Load transactions
        const transactionsResponse = await api.get('/inventory', {
            page: currentInventoryPage,
            limit: 10,
            ...inventoryFilters,
        });

        const transactions = transactionsResponse.data;
        const pagination = transactionsResponse.pagination;

        content.innerHTML = `
            <div class="page-content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-warehouse me-2"></i>Inventory Management</h2>
                    <div>
                        <button class="btn btn-primary" onclick="openAdjustModal()">
                            <i class="fas fa-edit me-1"></i>Adjust Stock
                        </button>
                        <button class="btn btn-success" onclick="exportInventory()">
                            <i class="fas fa-file-export me-1"></i>Export
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card stat-card primary">
                            <div class="card-body">
                                <div class="stat-label">Total Products</div>
                                <div class="stat-number">${summary.summary.totalProducts}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card success">
                            <div class="card-body">
                                <div class="stat-label">Stock Value</div>
                                <div class="stat-number">${formatCurrency(summary.summary.totalStockValue)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card warning">
                            <div class="card-body">
                                <div class="stat-label">Low Stock</div>
                                <div class="stat-number">${summary.summary.lowStockCount}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card stat-card danger">
                            <div class="card-body">
                                <div class="stat-label">Out of Stock</div>
                                <div class="stat-number">${summary.summary.outOfStockCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="form-label">Transaction Type</label>
                                <select class="form-control" id="filterType" onchange="applyInventoryFilters()">
                                    <option value="">All Types</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="sale">Sale</option>
                                    <option value="return">Return</option>
                                    <option value="adjustment">Adjustment</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="filterStartDate" onchange="applyInventoryFilters()">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" id="filterEndDate" onchange="applyInventoryFilters()">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-secondary w-100" onclick="clearInventoryFilters()">
                                    <i class="fas fa-undo me-1"></i>Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-history me-1"></i>
                        Recent Inventory Transactions
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Previous</th>
                                        <th>New</th>
                                        <th>Reference</th>
                                        <th>Performed By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transactions.length === 0 ? `
                                        <tr>
                                            <td colspan="9" class="text-center py-4">
                                                <i class="fas fa-boxes fa-3x d-block mb-2 text-muted"></i>
                                                <p class="text-muted">No inventory transactions found</p>
                                            </td>
                                        </tr>
                                    ` : transactions.map(t => `
                                        <tr>
                                            <td>${formatDate(t.createdAt)}</td>
                                            <td>
                                                <strong>${t.product?.name || 'Unknown'}</strong>
                                            </td>
                                            <td>${t.product?.sku || 'N/A'}</td>
                                            <td>
                                                <span class="badge ${getTransactionBadgeColor(t.transactionType)}">
                                                    ${t.transactionType}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="${t.quantity > 0 ? 'text-success' : 'text-danger'}">
                                                    ${t.quantity > 0 ? '+' : ''}${t.quantity}
                                                </span>
                                            </td>
                                            <td>${t.previousQuantity}</td>
                                            <td>${t.newQuantity}</td>
                                            <td>${t.reference || 'N/A'}</td>
                                            <td>${t.performedBy?.firstName || 'Unknown'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                ${pagination && pagination.pages > 1 ? `
                    <nav class="mt-4">
                        <ul class="pagination justify-content-center">
                            <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeInventoryPage(${pagination.page - 1})">Previous</a>
                            </li>
                            ${Array.from({length: pagination.pages}, (_, i) => i + 1).map(p => `
                                <li class="page-item ${p === pagination.page ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="changeInventoryPage(${p})">${p}</a>
                                </li>
                            `).join('')}
                            <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeInventoryPage(${pagination.page + 1})">Next</a>
                            </li>
                        </ul>
                    </nav>
                ` : ''}
            </div>
        `;

        // Initialize transaction summary chart
        if (summary.transactionSummary && summary.transactionSummary.length > 0) {
            initializeTransactionChart(summary.transactionSummary);
        }

    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading inventory: ${error.message}
            </div>
        `;
    }
}

// Get transaction badge color
function getTransactionBadgeColor(type) {
    const colors = {
        purchase: 'bg-success',
        sale: 'bg-danger',
        return: 'bg-warning',
        adjustment: 'bg-info',
        transfer: 'bg-primary',
    };
    return colors[type] || 'bg-secondary';
}

// Initialize transaction chart
function initializeTransactionChart(data) {
    const ctx = document.getElementById('transactionChart');
    if (!ctx) return;

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d._id),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#36b9cc'],
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });
}

// Change inventory page
function changeInventoryPage(page) {
    currentInventoryPage = page;
    loadInventory();
}

// Apply inventory filters
function applyInventoryFilters() {
    inventoryFilters = {
        transactionType: document.getElementById('filterType').value || undefined,
        startDate: document.getElementById('filterStartDate').value || undefined,
        endDate: document.getElementById('filterEndDate').value || undefined,
    };
    currentInventoryPage = 1;
    loadInventory();
}

// Clear inventory filters
function clearInventoryFilters() {
    document.getElementById('filterType').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    inventoryFilters = {};
    currentInventoryPage = 1;
    loadInventory();
}

// Open adjust stock modal
function openAdjustModal() {
    const modal = document.getElementById('adjustModal');
    if (!modal) {
        createAdjustModal();
    }

    document.getElementById('adjustForm').reset();
    document.getElementById('adjustProductId').value = '';
    document.getElementById('adjustQuantity').value = 0;
    document.getElementById('adjustReason').value = '';
    document.getElementById('adjustNotes').value = '';

    // Load products for dropdown
    loadProductDropdown();

    showModal('adjustModal');
}

// Create adjust modal
function createAdjustModal() {
    const modalHTML = `
        <div class="modal fade" id="adjustModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Adjust Stock</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="adjustForm">
                            <div class="mb-3">
                                <label for="adjustProductId" class="form-label">Product *</label>
                                <select class="form-control" id="adjustProductId" required>
                                    <option value="">Select Product</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="adjustQuantity" class="form-label">Quantity (positive for add, negative for subtract) *</label>
                                <input type="number" class="form-control" id="adjustQuantity" required step="1">
                            </div>
                            <div class="mb-3">
                                <label for="adjustReason" class="form-label">Reason</label>
                                <input type="text" class="form-control" id="adjustReason" placeholder="e.g., Restock, Damaged, etc.">
                            </div>
                            <div class="mb-3">
                                <label for="adjustNotes" class="form-label">Notes</label>
                                <textarea class="form-control" id="adjustNotes" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAdjustment()">Save Adjustment</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Load product dropdown
async function loadProductDropdown() {
    try {
        const response = await api.get('/products', { limit: 100 });
        const select = document.getElementById('adjustProductId');
        select.innerHTML = '<option value="">Select Product</option>';
        response.data.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} (${product.sku}) - Stock: ${product.stock.quantity}`;
            select.appendChild(option);
        });
    } catch (error) {
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// Save adjustment
async function saveAdjustment() {
    const productId = document.getElementById('adjustProductId').value;
    const quantity = parseInt(document.getElementById('adjustQuantity').value);
    const reason = document.getElementById('adjustReason').value;
    const notes = document.getElementById('adjustNotes').value;

    if (!productId) {
        showToast('Please select a product', 'error');
        return;
    }

    if (isNaN(quantity) || quantity === 0) {
        showToast('Please enter a valid quantity (positive or negative)', 'error');
        return;
    }

    try {
        await api.post('/inventory/adjust', {
            productId,
            quantity,
            reason: reason || 'Manual adjustment',
            notes: notes || '',
        });

        showToast('Stock adjusted successfully');
        hideModal('adjustModal');
        loadInventory();
    } catch (error) {
        showToast('Error adjusting stock: ' + error.message, 'error');
    }
}

// Export inventory
async function exportInventory() {
    try {
        const response = await fetch(`${APP.apiBase}/inventory/export?format=csv`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Inventory exported successfully');
    } catch (error) {
        showToast('Error exporting inventory: ' + error.message, 'error');
    }
}