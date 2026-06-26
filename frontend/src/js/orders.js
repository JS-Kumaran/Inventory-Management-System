let currentOrderPage = 1;
let orderFilters = {};

// Load orders
async function loadOrders() {
    showLoader();
    const content = document.getElementById('pageContent');

    try {
        const response = await api.get('/orders', {
            page: currentOrderPage,
            limit: 10,
            ...orderFilters,
        });

        const orders = response.data;
        const pagination = response.pagination;

        content.innerHTML = `
            <div class="page-content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-shopping-cart me-2"></i>Orders</h2>
                    <button class="btn btn-primary" onclick="openOrderModal()">
                        <i class="fas fa-plus me-1"></i>Create Order
                    </button>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="form-label">Order Type</label>
                                <select class="form-control" id="orderTypeFilter" onchange="applyOrderFilters()">
                                    <option value="">All Types</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="sale">Sale</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select class="form-control" id="orderStatusFilter" onchange="applyOrderFilters()">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="returned">Returned</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Payment Status</label>
                                <select class="form-control" id="paymentStatusFilter" onchange="applyOrderFilters()">
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-secondary w-100" onclick="clearOrderFilters()">
                                    <i class="fas fa-undo me-1"></i>Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Orders Table -->
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.length === 0 ? `
                                    <tr>
                                        <td colspan="8" class="text-center py-4">
                                            <i class="fas fa-shopping-cart fa-3x d-block mb-2 text-muted"></i>
                                            <p class="text-muted">No orders found</p>
                                        </td>
                                    </tr>
                                ` : orders.map(order => `
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
                                        <td>${order.items.length}</td>
                                        <td>${formatCurrency(order.total)}</td>
                                        <td>
                                            <span class="badge ${order.paymentStatus === 'paid' ? 'bg-success' : order.paymentStatus === 'pending' ? 'bg-warning' : 'bg-danger'}">
                                                ${order.paymentStatus}
                                            </span>
                                        </td>
                                        <td>${formatDate(order.createdAt)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="viewOrder('${order._id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-primary" onclick="editOrder('${order._id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order._id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <button class="btn btn-sm btn-success" onclick="generateOrderPDF('${order._id}')">
                                                <i class="fas fa-file-pdf"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pagination -->
                ${pagination && pagination.pages > 1 ? `
                    <nav class="mt-4">
                        <ul class="pagination justify-content-center">
                            <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeOrderPage(${pagination.page - 1})">Previous</a>
                            </li>
                            ${Array.from({length: pagination.pages}, (_, i) => i + 1).map(p => `
                                <li class="page-item ${p === pagination.page ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="changeOrderPage(${p})">${p}</a>
                                </li>
                            `).join('')}
                            <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeOrderPage(${pagination.page + 1})">Next</a>
                            </li>
                        </ul>
                    </nav>
                ` : ''}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading orders: ${error.message}
            </div>
        `;
    }
}

// Change order page
function changeOrderPage(page) {
    currentOrderPage = page;
    loadOrders();
}

// Apply order filters
function applyOrderFilters() {
    orderFilters = {
        orderType: document.getElementById('orderTypeFilter').value || undefined,
        status: document.getElementById('orderStatusFilter').value || undefined,
        paymentStatus: document.getElementById('paymentStatusFilter').value || undefined,
    };
    currentOrderPage = 1;
    loadOrders();
}

// Clear order filters
function clearOrderFilters() {
    document.getElementById('orderTypeFilter').value = '';
    document.getElementById('orderStatusFilter').value = '';
    document.getElementById('paymentStatusFilter').value = '';
    orderFilters = {};
    currentOrderPage = 1;
    loadOrders();
}

// Open order modal
async function openOrderModal(orderId = null) {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        createOrderModal();
    }

    document.getElementById('orderForm').reset();
    document.getElementById('orderId').value = '';

    if (orderId) {
        document.getElementById('orderModalTitle').textContent = 'Edit Order';
        try {
            const response = await api.get(`/orders/${orderId}`);
            const order = response.data;
            document.getElementById('orderId').value = order._id;
            document.getElementById('orderType').value = order.orderType;
            // Populate other fields...
        } catch (error) {
            showToast('Error loading order: ' + error.message, 'error');
            return;
        }
    } else {
        document.getElementById('orderModalTitle').textContent = 'Create Order';
    }

    await loadProductsForOrder();
    showModal('orderModal');
}

// Create order modal
function createOrderModal() {
    const modalHTML = `
        <div class="modal fade" id="orderModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="orderModalTitle">Create Order</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="orderForm">
                            <input type="hidden" id="orderId">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="orderType" class="form-label">Order Type *</label>
                                    <select class="form-control" id="orderType" required onchange="toggleOrderFields()">
                                        <option value="sale">Sale</option>
                                        <option value="purchase">Purchase</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="paymentMethod" class="form-label">Payment Method</label>
                                    <select class="form-control" id="paymentMethod">
                                        <option value="cash">Cash</option>
                                        <option value="credit_card">Credit Card</option>
                                        <option value="debit_card">Debit Card</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3" id="supplierField">
                                    <label for="orderSupplier" class="form-label">Supplier</label>
                                    <select class="form-control" id="orderSupplier"></select>
                                </div>
                                <div class="col-md-6 mb-3" id="customerField">
                                    <label for="customerName" class="form-label">Customer Name</label>
                                    <input type="text" class="form-control" id="customerName">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Order Items</label>
                                <div id="orderItemsContainer">
                                    <div class="order-item row mb-2">
                                        <div class="col-md-5">
                                            <select class="form-control product-select" onchange="updateItemTotal(this)">
                                                <option value="">Select Product</option>
                                            </select>
                                        </div>
                                        <div class="col-md-2">
                                            <input type="number" class="form-control item-quantity" placeholder="Qty" value="1" onchange="updateItemTotal(this)">
                                        </div>
                                        <div class="col-md-3">
                                            <input type="number" class="form-control item-price" placeholder="Price" step="0.01" onchange="updateItemTotal(this)">
                                        </div>
                                        <div class="col-md-2">
                                            <button type="button" class="btn btn-danger btn-sm" onclick="removeOrderItem(this)">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addOrderItem()">
                                    <i class="fas fa-plus"></i> Add Item
                                </button>
                            </div>

                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <label for="orderDiscount" class="form-label">Discount</label>
                                    <input type="number" class="form-control" id="orderDiscount" step="0.01" value="0">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label for="orderShipping" class="form-label">Shipping Cost</label>
                                    <input type="number" class="form-control" id="orderShipping" step="0.01" value="0">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="orderNotes" class="form-label">Notes</label>
                                    <textarea class="form-control" id="orderNotes" rows="2"></textarea>
                                </div>
                            </div>

                            <div class="alert alert-info">
                                <strong>Total: </strong> <span id="orderTotalDisplay">$0.00</span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="saveOrder()">Save Order</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Load products for order
async function loadProductsForOrder() {
    try {
        const response = await api.get('/products', { limit: 100, isActive: true });
        const products = response.data;

        // Populate all product selects
        document.querySelectorAll('.product-select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Product</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product._id;
                option.dataset.price = product.price.selling;
                option.textContent = `${product.name} (${product.sku}) - Stock: ${product.stock.quantity}`;
                select.appendChild(option);
            });
            select.value = currentValue;
        });

        // Load suppliers
        await loadSuppliersForOrder();
    } catch (error) {
        showToast('Error loading products: ' + error.message, 'error');
    }
}

// Load suppliers for order
async function loadSuppliersForOrder() {
    try {
        const response = await api.get('/suppliers', { limit: 100 });
        const select = document.getElementById('orderSupplier');
        select.innerHTML = '<option value="">Select Supplier</option>';
        response.data.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier._id;
            option.textContent = supplier.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

// Toggle order fields
function toggleOrderFields() {
    const type = document.getElementById('orderType').value;
    document.getElementById('supplierField').style.display = type === 'purchase' ? 'block' : 'none';
    document.getElementById('customerField').style.display = type === 'sale' ? 'block' : 'none';
}

// Add order item
function addOrderItem() {
    const container = document.getElementById('orderItemsContainer');
    const newItem = container.children[0].cloneNode(true);
    
    // Clear values
    newItem.querySelector('.product-select').value = '';
    newItem.querySelector('.item-quantity').value = 1;
    newItem.querySelector('.item-price').value = '';
    
    container.appendChild(newItem);
    loadProductsForOrder();
    updateOrderTotal();
}

// Remove order item
function removeOrderItem(button) {
    const container = document.getElementById('orderItemsContainer');
    if (container.children.length > 1) {
        button.closest('.order-item').remove();
        updateOrderTotal();
    } else {
        showToast('At least one item is required', 'warning');
    }
}

// Update item total
function updateItemTotal(element) {
    const row = element.closest('.order-item');
    const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    // Update total display if needed
    updateOrderTotal();
}

// Update order total
function updateOrderTotal() {
    let total = 0;
    const items = document.querySelectorAll('.order-item');
    
    items.forEach(item => {
        const quantity = parseInt(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });

    const discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
    const shipping = parseFloat(document.getElementById('orderShipping').value) || 0;

    const finalTotal = total - discount + shipping;
    document.getElementById('orderTotalDisplay').textContent = formatCurrency(finalTotal);
}

// Save order
async function saveOrder() {
    const orderType = document.getElementById('orderType').value;
    const items = [];
    const itemRows = document.querySelectorAll('.order-item');

    itemRows.forEach(row => {
        const productId = row.querySelector('.product-select').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;

        if (productId && quantity > 0 && unitPrice > 0) {
            items.push({ product: productId, quantity, unitPrice });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one valid item', 'error');
        return;
    }

    const orderData = {
        orderType,
        items,
        discount: parseFloat(document.getElementById('orderDiscount').value) || 0,
        shippingCost: parseFloat(document.getElementById('orderShipping').value) || 0,
        notes: document.getElementById('orderNotes').value,
        paymentMethod: document.getElementById('paymentMethod').value,
    };

    if (orderType === 'purchase') {
        orderData.supplier = document.getElementById('orderSupplier').value;
    } else {
        orderData.customer = {
            name: document.getElementById('customerName').value,
        };
    }

    try {
        const orderId = document.getElementById('orderId').value;
        let response;
        if (orderId) {
            response = await api.put(`/orders/${orderId}`, orderData);
            showToast('Order updated successfully');
        } else {
            response = await api.post('/orders', orderData);
            showToast('Order created successfully');
        }

        hideModal('orderModal');
        loadOrders();
    } catch (error) {
        showToast('Error saving order: ' + error.message, 'error');
    }
}

// View order
async function viewOrder(orderId) {
    try {
        const response = await api.get(`/orders/${orderId}`);
        const order = response.data;

        let itemsHtml = order.items.map(item => `
            <tr>
                <td>${item.product?.name || 'Unknown'}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.discount || 0)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `).join('');

        alert(`
            Order: ${order.orderNumber}
            Type: ${order.orderType}
            Status: ${order.status}
            Total: ${formatCurrency(order.total)}
            
            Items:
            ${order.items.map(item => `${item.product?.name || 'Unknown'} x${item.quantity} - ${formatCurrency(item.total)}`).join('\n')}
        `);
    } catch (error) {
        showToast('Error loading order: ' + error.message, 'error');
    }
}

// Edit order
function editOrder(orderId) {
    openOrderModal(orderId);
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }

    try {
        await api.delete(`/orders/${orderId}`);
        showToast('Order deleted successfully');
        loadOrders();
    } catch (error) {
        showToast('Error deleting order: ' + error.message, 'error');
    }
}

// Generate order PDF
async function generateOrderPDF(orderId) {
    try {
        const response = await fetch(`${APP.apiBase}/orders/${orderId}/pdf`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('PDF generated successfully');
    } catch (error) {
        showToast('Error generating PDF: ' + error.message, 'error');
    }
}