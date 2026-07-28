/**
 * Inventory Module
 * @version 1.0.0
 */

var currentInventoryPage = 1;
var inventoryFilters = {};

// Load inventory page
async function loadInventory() {
    showLoader();
    var content = document.getElementById('pageContent');

    try {
        // Load summary
        var summaryResponse = await api.get('/inventory/summary');
        var summary = summaryResponse.data;

        // Load transactions
        var transactionsResponse = await api.get('/inventory', {
            page: currentInventoryPage,
            limit: 10,
            transactionType: inventoryFilters.transactionType || undefined,
            startDate: inventoryFilters.startDate || undefined,
            endDate: inventoryFilters.endDate || undefined,
        });

        var transactions = transactionsResponse.data || [];
        var pagination = transactionsResponse.pagination || {};

        var html = '';
        html += '<div class="page-content">';
        html += '<div class="d-flex justify-content-between align-items-center mb-4">';
        html += '<h2><i class="fas fa-warehouse me-2"></i>Inventory Management</h2>';
        html += '<div>';
        html += '<button class="btn btn-primary" onclick="openAdjustModal()">';
        html += '<i class="fas fa-edit me-1"></i>Adjust Stock';
        html += '</button>';
        html += '<button class="btn btn-success" onclick="exportInventory()">';
        html += '<i class="fas fa-file-export me-1"></i>Export';
        html += '</button>';
        html += '</div>';
        html += '</div>';

        // Summary Cards
        html += '<div class="row mb-4">';
        html += '<div class="col-md-3"><div class="card stat-card primary"><div class="card-body"><div class="stat-label">Total Products</div><div class="stat-number">' + (summary.summary.totalProducts || 0) + '</div></div></div></div>';
        html += '<div class="col-md-3"><div class="card stat-card success"><div class="card-body"><div class="stat-label">Stock Value</div><div class="stat-number">' + formatCurrency(summary.summary.totalStockValue) + '</div></div></div></div>';
        html += '<div class="col-md-3"><div class="card stat-card warning"><div class="card-body"><div class="stat-label">Low Stock</div><div class="stat-number">' + (summary.summary.lowStockCount || 0) + '</div></div></div></div>';
        html += '<div class="col-md-3"><div class="card stat-card danger"><div class="card-body"><div class="stat-label">Out of Stock</div><div class="stat-number">' + (summary.summary.outOfStockCount || 0) + '</div></div></div></div>';
        html += '</div>';

        // Filters
        html += '<div class="card mb-4"><div class="card-body"><div class="row">';
        html += '<div class="col-md-3"><label class="form-label">Transaction Type</label><select class="form-control" id="filterType" onchange="applyInventoryFilters()"><option value="">All Types</option><option value="purchase">Purchase</option><option value="sale">Sale</option><option value="return">Return</option><option value="adjustment">Adjustment</option><option value="transfer">Transfer</option></select></div>';
        html += '<div class="col-md-3"><label class="form-label">Start Date</label><input type="date" class="form-control" id="filterStartDate" onchange="applyInventoryFilters()"></div>';
        html += '<div class="col-md-3"><label class="form-label">End Date</label><input type="date" class="form-control" id="filterEndDate" onchange="applyInventoryFilters()"></div>';
        html += '<div class="col-md-3 d-flex align-items-end"><button class="btn btn-secondary w-100" onclick="clearInventoryFilters()"><i class="fas fa-undo me-1"></i>Clear Filters</button></div>';
        html += '</div></div></div>';

        // Transactions Table
        html += '<div class="card"><div class="card-header"><i class="fas fa-history me-1"></i>Recent Inventory Transactions</div>';
        html += '<div class="card-body"><div class="table-responsive"><table class="table table-hover">';
        html += '<thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Type</th><th>Quantity</th><th>Previous</th><th>New</th><th>Reference</th><th>Performed By</th></tr></thead><tbody>';

        if (transactions.length === 0) {
            html += '<tr><td colspan="9" class="text-center py-4"><i class="fas fa-boxes fa-3x d-block mb-2 text-muted"></i><p class="text-muted">No inventory transactions found</p></td></tr>';
        } else {
            for (var i = 0; i < transactions.length; i++) {
                var t = transactions[i];
                var typeColors = { purchase: 'bg-success', sale: 'bg-danger', return: 'bg-warning', adjustment: 'bg-info', transfer: 'bg-primary' };
                var badgeColor = typeColors[t.transactionType] || 'bg-secondary';
                var qtyClass = t.quantity > 0 ? 'text-success' : 'text-danger';
                var qtySign = t.quantity > 0 ? '+' : '';

                html += '<tr>';
                html += '<td>' + formatDate(t.createdAt) + '</td>';
                html += '<td><strong>' + (t.product ? t.product.name : 'Unknown') + '</strong></td>';
                html += '<td>' + (t.product ? t.product.sku : 'N/A') + '</td>';
                html += '<td><span class="badge ' + badgeColor + '">' + t.transactionType + '</span></td>';
                html += '<td><span class="' + qtyClass + '">' + qtySign + t.quantity + '</span></td>';
                html += '<td>' + t.previousQuantity + '</td>';
                html += '<td>' + t.newQuantity + '</td>';
                html += '<td>' + (t.reference || 'N/A') + '</td>';
                html += '<td>' + (t.performedBy ? t.performedBy.firstName : 'Unknown') + '</td>';
                html += '</tr>';
            }
        }

        html += '</tbody></table></div></div></div>';

        // Pagination
        if (pagination && pagination.pages > 1) {
            html += '<nav class="mt-4"><ul class="pagination justify-content-center">';
            html += '<li class="page-item ' + (pagination.page <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" onclick="changeInventoryPage(' + (pagination.page - 1) + ')">Previous</a></li>';
            for (var p = 1; p <= pagination.pages; p++) {
                html += '<li class="page-item ' + (p === pagination.page ? 'active' : '') + '"><a class="page-link" href="#" onclick="changeInventoryPage(' + p + ')">' + p + '</a></li>';
            }
            html += '<li class="page-item ' + (pagination.page >= pagination.pages ? 'disabled' : '') + '"><a class="page-link" href="#" onclick="changeInventoryPage(' + (pagination.page + 1) + ')">Next</a></li>';
            html += '</ul></nav>';
        }

        html += '</div>';
        content.innerHTML = html;

    } catch (error) {
        content.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error loading inventory: ' + error.message + '</div>';
    }
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
    var modal = document.getElementById('adjustModal');
    if (!modal) {
        createAdjustModal();
    }

    var form = document.getElementById('adjustForm');
    if (form) form.reset();
    
    var productSelect = document.getElementById('adjustProductId');
    if (productSelect) productSelect.value = '';
    
    var qtyInput = document.getElementById('adjustQuantity');
    if (qtyInput) qtyInput.value = 0;
    
    var reasonInput = document.getElementById('adjustReason');
    if (reasonInput) reasonInput.value = '';
    
    var notesInput = document.getElementById('adjustNotes');
    if (notesInput) notesInput.value = '';

    // Load products for dropdown
    loadProductDropdown();

    showModal('adjustModal');
}

// Create adjust modal
function createAdjustModal() {
    var modalHTML = '';
    modalHTML += '<div class="modal fade" id="adjustModal" tabindex="-1">';
    modalHTML += '<div class="modal-dialog">';
    modalHTML += '<div class="modal-content">';
    modalHTML += '<div class="modal-header">';
    modalHTML += '<h5 class="modal-title">Adjust Stock</h5>';
    modalHTML += '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-body">';
    modalHTML += '<form id="adjustForm">';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="adjustProductId" class="form-label">Product *</label>';
    modalHTML += '<select class="form-control" id="adjustProductId" required><option value="">Select Product</option></select>';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="adjustQuantity" class="form-label">Quantity (positive for add, negative for subtract) *</label>';
    modalHTML += '<input type="number" class="form-control" id="adjustQuantity" required step="1">';
    modalHTML += '<small class="text-muted">Positive to add stock, negative to subtract</small>';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="adjustReason" class="form-label">Reason</label>';
    modalHTML += '<input type="text" class="form-control" id="adjustReason" placeholder="e.g., Restock, Damaged, etc.">';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="adjustNotes" class="form-label">Notes</label>';
    modalHTML += '<textarea class="form-control" id="adjustNotes" rows="2"></textarea>';
    modalHTML += '</div>';
    modalHTML += '</form>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-footer">';
    modalHTML += '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>';
    modalHTML += '<button type="button" class="btn btn-primary" onclick="saveAdjustment()">Save Adjustment</button>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    modalHTML += '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Load product dropdown
async function loadProductDropdown() {
    try {
        var response = await api.get('/products', { limit: 100 });
        var select = document.getElementById('adjustProductId');
        if (!select) return;
        select.innerHTML = '<option value="">Select Product</option>';
        var products = response.data || [];
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var option = document.createElement('option');
            option.value = product._id;
            option.textContent = product.name + ' (' + product.sku + ') - Stock: ' + product.stock.quantity;
            select.appendChild(option);
        }
    } catch (error) {
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// Save adjustment
async function saveAdjustment() {
    var productId = document.getElementById('adjustProductId').value;
    var quantity = parseInt(document.getElementById('adjustQuantity').value);
    var reason = document.getElementById('adjustReason').value;
    var notes = document.getElementById('adjustNotes').value;

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
            productId: productId,
            quantity: quantity,
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
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var token = localStorage.getItem('token');
        var response = await fetch(apiBase + '/inventory/export?format=csv', {
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        });

        var blob = await response.blob();
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'inventory-report-' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Inventory exported successfully');
    } catch (error) {
        showToast('Error exporting inventory: ' + error.message, 'error');
    }
}

// Make functions globally available
window.loadInventory = loadInventory;
window.openAdjustModal = openAdjustModal;
window.saveAdjustment = saveAdjustment;
window.exportInventory = exportInventory;
window.changeInventoryPage = changeInventoryPage;
window.applyInventoryFilters = applyInventoryFilters;
window.clearInventoryFilters = clearInventoryFilters;