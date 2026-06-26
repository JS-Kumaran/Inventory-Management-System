/**
 * Products Module
 * Handles product CRUD operations
 */

let currentProductPage = 1;
let productSearchTerm = '';
let productFilters = {};

/**
 * Load products page
 */
async function loadProducts() {
    showLoader();
    const content = document.getElementById('pageContent');

    try {
        const response = await api.get('/products', {
            page: currentProductPage,
            limit: 10,
            search: productSearchTerm,
            ...productFilters,
        });

        const products = response.data;
        const pagination = response.pagination;

        content.innerHTML = `
            <div class="page-content">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h2><i class="fas fa-box me-2"></i>Products</h2>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary" onclick="openProductModal()">
                            <i class="fas fa-plus me-1"></i>Add Product
                        </button>
                        <button class="btn btn-success" onclick="exportProducts('csv')">
                            <i class="fas fa-file-csv me-1"></i>CSV
                        </button>
                        <button class="btn btn-danger" onclick="exportProducts('pdf')">
                            <i class="fas fa-file-pdf me-1"></i>PDF
                        </button>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div class="filter-section">
                    <div class="filter-group">
                        <div class="filter-item">
                            <label>Search</label>
                            <div class="search-bar">
                                <i class="fas fa-search"></i>
                                <input type="text" id="productSearch" placeholder="Search products..." 
                                       value="${productSearchTerm}" onkeyup="handleProductSearch(event)">
                            </div>
                        </div>
                        <div class="filter-item">
                            <label>Category</label>
                            <select class="form-control" id="categoryFilter" onchange="applyProductFilters()">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label>Status</label>
                            <select class="form-control" id="statusFilter" onchange="applyProductFilters()">
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label>&nbsp;</label>
                            <button class="btn btn-secondary" onclick="clearProductFilters()">
                                <i class="fas fa-undo me-1"></i>Clear
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Supplier</th>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.length === 0 ? `
                                    <tr>
                                        <td colspan="8" class="text-center py-4">
                                            <i class="fas fa-box-open fa-3x d-block mb-2 text-muted"></i>
                                            <p class="text-muted">No products found</p>
                                            <button class="btn btn-primary btn-sm" onclick="openProductModal()">
                                                <i class="fas fa-plus me-1"></i>Add Product
                                            </button>
                                        </td>
                                    </tr>
                                ` : products.map(product => `
                                    <tr>
                                        <td><strong>${product.sku}</strong></td>
                                        <td>
                                            <div class="product-cell">
                                                <img src="${product.images?.[0] || '/uploads/default-product.png'}" 
                                                     alt="${product.name}" onerror="this.src='/uploads/default-product.png'">
                                                <div>
                                                    <div class="fw-bold">${product.name}</div>
                                                    <small class="text-muted">${product.description?.substring(0, 50) || ''}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${product.category?.name || 'N/A'}</td>
                                        <td>${product.supplier?.name || 'N/A'}</td>
                                        <td>
                                            <span class="badge ${product.stock.quantity <= product.stock.minThreshold ? 'bg-danger' : 'bg-success'}">
                                                ${product.stock.quantity}
                                            </span>
                                            ${product.stock.quantity <= product.stock.minThreshold ? ' <span class="badge bg-warning text-dark">Low Stock</span>' : ''}
                                            ${product.stock.quantity === 0 ? ' <span class="badge bg-danger">Out of Stock</span>' : ''}
                                        </td>
                                        <td>
                                            <div>${formatCurrency(product.price.selling)}</div>
                                            <small class="text-muted">Cost: ${formatCurrency(product.price.cost)}</small>
                                        </td>
                                        <td>${getStatusBadge(product.isActive ? 'active' : 'inactive')}</td>
                                        <td class="text-center">
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-info" onclick="viewProduct('${product._id}')" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-primary" onclick="editProduct('${product._id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger" onclick="deleteProduct('${product._id}')" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
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
                                <a class="page-link" href="#" onclick="changeProductPage(${pagination.page - 1})">Previous</a>
                            </li>
                            ${Array.from({length: pagination.pages}, (_, i) => i + 1).map(p => `
                                <li class="page-item ${p === pagination.page ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="changeProductPage(${p})">${p}</a>
                                </li>
                            `).join('')}
                            <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeProductPage(${pagination.page + 1})">Next</a>
                            </li>
                        </ul>
                    </nav>
                ` : ''}
            </div>
        `;

        // Load filter options
        loadCategoryFilterOptions();
        loadSupplierFilterOptions();

    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading products: ${error.message}
            </div>
        `;
    }
}

/**
 * Change product page
 */
function changeProductPage(page) {
    currentProductPage = page;
    loadProducts();
}

/**
 * Handle product search with debounce
 */
const handleProductSearch = debounce(function(event) {
    productSearchTerm = document.getElementById('productSearch').value;
    currentProductPage = 1;
    loadProducts();
}, 400);

/**
 * Apply product filters
 */
function applyProductFilters() {
    productFilters = {
        category: document.getElementById('categoryFilter').value || undefined,
        isActive: document.getElementById('statusFilter').value || undefined,
    };
    currentProductPage = 1;
    loadProducts();
}

/**
 * Clear product filters
 */
function clearProductFilters() {
    document.getElementById('productSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    productSearchTerm = '';
    productFilters = {};
    currentProductPage = 1;
    loadProducts();
}

/**
 * Load category filter options
 */
async function loadCategoryFilterOptions() {
    try {
        const response = await api.get('/categories');
        const select = document.getElementById('categoryFilter');
        response.data.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Load supplier filter options
 */
async function loadSupplierFilterOptions() {
    try {
        const response = await api.get('/suppliers');
        const select = document.getElementById('supplierFilter');
        // This is a placeholder - add supplier filter if needed
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

/**
 * Open product modal for create or edit
 */
async function openProductModal(productId = null) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('productModal');
    if (!modal) {
        createProductModal();
        modal = document.getElementById('productModal');
    }

    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('productId').value = '';

    if (productId) {
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        try {
            const response = await api.get(`/products/${productId}`);
            const product = response.data;
            
            document.getElementById('productId').value = product._id;
            document.getElementById('sku').value = product.sku;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('category').value = product.category?._id || '';
            document.getElementById('supplier').value = product.supplier?._id || '';
            document.getElementById('unit').value = product.unit || 'pcs';
            document.getElementById('costPrice').value = product.price.cost;
            document.getElementById('sellingPrice').value = product.price.selling;
            document.getElementById('wholesalePrice').value = product.price.wholesale || '';
            document.getElementById('stockQuantity').value = product.stock.quantity;
            document.getElementById('minThreshold').value = product.stock.minThreshold;
            document.getElementById('maxThreshold').value = product.stock.maxThreshold || '';
            document.getElementById('taxRate').value = product.taxRate || 0;
            document.getElementById('productIsActive').checked = product.isActive;
            document.getElementById('productIsFeatured').checked = product.isFeatured || false;
            
            if (product.images && product.images.length > 0) {
                document.getElementById('currentImagePreview').src = product.images[0];
                document.getElementById('currentImagePreview').style.display = 'block';
            }
        } catch (error) {
            showToast('Error loading product: ' + error.message, 'error');
            return;
        }
    } else {
        document.getElementById('productModalTitle').textContent = 'Add Product';
        document.getElementById('currentImagePreview').style.display = 'none';
    }

    // Load dropdowns
    await loadCategoryDropdown();
    await loadSupplierDropdown();

    showModal('productModal');
}

/**
 * Create product modal HTML
 */
function createProductModal() {
    const modalHTML = `
        <div class="modal fade" id="productModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="productModalTitle">Add Product</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="productForm">
                            <input type="hidden" id="productId">
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="sku" class="form-label">SKU *</label>
                                    <input type="text" class="form-control" id="sku" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="productName" class="form-label">Product Name *</label>
                                    <input type="text" class="form-control" id="productName" required>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="productDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="productDescription" rows="2"></textarea>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="category" class="form-label">Category *</label>
                                    <select class="form-control" id="category" required></select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="supplier" class="form-label">Supplier</label>
                                    <select class="form-control" id="supplier"></select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="unit" class="form-label">Unit *</label>
                                    <select class="form-control" id="unit" required>
                                        <option value="pcs">Pieces</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="g">Gram</option>
                                        <option value="l">Liter</option>
                                        <option value="ml">Milliliter</option>
                                        <option value="m">Meter</option>
                                        <option value="cm">Centimeter</option>
                                        <option value="box">Box</option>
                                        <option value="pack">Pack</option>
                                        <option value="set">Set</option>
                                    </select>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="costPrice" class="form-label">Cost Price *</label>
                                    <input type="number" class="form-control" id="costPrice" step="0.01" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="sellingPrice" class="form-label">Selling Price *</label>
                                    <input type="number" class="form-control" id="sellingPrice" step="0.01" required>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="wholesalePrice" class="form-label">Wholesale Price</label>
                                    <input type="number" class="form-control" id="wholesalePrice" step="0.01">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="taxRate" class="form-label">Tax Rate (%)</label>
                                    <input type="number" class="form-control" id="taxRate" step="0.01" value="0">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="weight" class="form-label">Weight (kg)</label>
                                    <input type="number" class="form-control" id="weight" step="0.01">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="stockQuantity" class="form-label">Stock Quantity</label>
                                    <input type="number" class="form-control" id="stockQuantity" value="0">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="minThreshold" class="form-label">Min Threshold</label>
                                    <input type="number" class="form-control" id="minThreshold" value="10">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="maxThreshold" class="form-label">Max Threshold</label>
                                    <input type="number" class="form-control" id="maxThreshold">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="form-check">
                                        <input type="checkbox" class="form-check-input" id="productIsActive" checked>
                                        <label class="form-check-label" for="productIsActive">Active</label>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="form-check">
                                        <input type="checkbox" class="form-check-input" id="productIsFeatured">
                                        <label class="form-check-label" for="productIsFeatured">Featured</label>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="productImage" class="form-label">Product Image</label>
                                <input type="file" class="form-control" id="productImage" accept="image/*">
                                <img id="currentImagePreview" style="display:none; margin-top:10px; max-width:100px; max-height:100px; border-radius:8px;">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveProduct()">Save Product</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Load category dropdown
 */
async function loadCategoryDropdown() {
    try {
        const response = await api.get('/categories');
        const select = document.getElementById('category');
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Category</option>';
        response.data.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Load supplier dropdown
 */
async function loadSupplierDropdown() {
    try {
        const response = await api.get('/suppliers');
        const select = document.getElementById('supplier');
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Supplier</option>';
        response.data.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier._id;
            option.textContent = supplier.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

/**
 * Save product (create or update)
 */
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const data = {
        sku: document.getElementById('sku').value.trim().toUpperCase(),
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category: document.getElementById('category').value,
        supplier: document.getElementById('supplier').value || null,
        unit: document.getElementById('unit').value,
        price: {
            cost: parseFloat(document.getElementById('costPrice').value) || 0,
            selling: parseFloat(document.getElementById('sellingPrice').value) || 0,
            wholesale: parseFloat(document.getElementById('wholesalePrice').value) || null,
        },
        stock: {
            quantity: parseInt(document.getElementById('stockQuantity').value) || 0,
            minThreshold: parseInt(document.getElementById('minThreshold').value) || 10,
            maxThreshold: parseInt(document.getElementById('maxThreshold').value) || null,
        },
        taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
        weight: parseFloat(document.getElementById('weight').value) || null,
        isActive: document.getElementById('productIsActive').checked,
        isFeatured: document.getElementById('productIsFeatured').checked,
    };

    // Validate
    if (!data.sku) { showToast('SKU is required', 'error'); return; }
    if (!data.name) { showToast('Product name is required', 'error'); return; }
    if (!data.category) { showToast('Category is required', 'error'); return; }
    if (!data.price.cost) { showToast('Cost price is required', 'error'); return; }
    if (!data.price.selling) { showToast('Selling price is required', 'error'); return; }

    try {
        let response;
        if (productId) {
            response = await api.put(`/products/${productId}`, data);
            showToast('Product updated successfully');
        } else {
            response = await api.post('/products', data);
            showToast('Product created successfully');
        }

        // Handle image upload if file selected
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile && response.data?._id) {
            const formData = new FormData();
            formData.append('image', imageFile);
            await fetch(`${APP.apiBase}/products/${response.data._id}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${APP.token}`,
                },
                body: formData,
            });
        }

        hideModal('productModal');
        loadProducts();
    } catch (error) {
        showToast('Error saving product: ' + error.message, 'error');
    }
}

/**
 * Edit product
 */
function editProduct(productId) {
    openProductModal(productId);
}

/**
 * View product details
 */
async function viewProduct(productId) {
    try {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;

        const details = `
            Product Details
            ===============
            SKU: ${product.sku}
            Name: ${product.name}
            Description: ${product.description || 'N/A'}
            Category: ${product.category?.name || 'N/A'}
            Supplier: ${product.supplier?.name || 'N/A'}
            Unit: ${product.unit}
            
            Pricing:
            - Cost: ${formatCurrency(product.price.cost)}
            - Selling: ${formatCurrency(product.price.selling)}
            - Wholesale: ${product.price.wholesale ? formatCurrency(product.price.wholesale) : 'N/A'}
            
            Stock:
            - Quantity: ${product.stock.quantity}
            - Min Threshold: ${product.stock.minThreshold}
            - Max Threshold: ${product.stock.maxThreshold || 'N/A'}
            
            Tax Rate: ${product.taxRate || 0}%
            Weight: ${product.weight ? product.weight + ' kg' : 'N/A'}
            Status: ${product.isActive ? 'Active' : 'Inactive'}
            Featured: ${product.isFeatured ? 'Yes' : 'No'}
            Stock Value: ${formatCurrency(product.stock.quantity * product.price.cost)}
            Profit Margin: ${((product.price.selling - product.price.cost) / product.price.cost * 100).toFixed(2)}%
        `;

        alert(details);
    } catch (error) {
        showToast('Error loading product: ' + error.message, 'error');
    }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        await api.delete(`/products/${productId}`);
        showToast('Product deleted successfully');
        loadProducts();
    } catch (error) {
        showToast('Error deleting product: ' + error.message, 'error');
    }
}

/**
 * Export products (CSV or PDF)
 */
async function exportProducts(format) {
    try {
        const endpoint = format === 'csv' ? '/products/export/csv' : '/products/export/pdf';
        const response = await fetch(`${APP.apiBase}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export.${format === 'csv' ? 'csv' : 'pdf'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(`Products exported as ${format.toUpperCase()}`);
    } catch (error) {
        showToast(`Error exporting products: ${error.message}`, 'error');
    }
}

// Image preview handler
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'productImage') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('currentImagePreview');
                preview.src = event.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
});

// Make functions globally available
window.loadProducts = loadProducts;
window.openProductModal = openProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.viewProduct = viewProduct;
window.deleteProduct = deleteProduct;
window.changeProductPage = changeProductPage;
window.exportProducts = exportProducts;
window.applyProductFilters = applyProductFilters;
window.clearProductFilters = clearProductFilters;
window.handleProductSearch = handleProductSearch;