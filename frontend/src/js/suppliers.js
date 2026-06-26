/**
 * Suppliers Module
 * Handles supplier CRUD operations
 */

let currentSupplierPage = 1;
let supplierSearchTerm = '';
let supplierFilters = {};

/**
 * Load suppliers page
 */
async function loadSuppliers() {
    showLoader();
    const content = document.getElementById('pageContent');

    try {
        const response = await api.get('/suppliers', {
            page: currentSupplierPage,
            limit: 10,
            search: supplierSearchTerm,
            ...supplierFilters,
        });

        const suppliers = response.data;
        const pagination = response.pagination;

        content.innerHTML = `
            <div class="page-content">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h2><i class="fas fa-truck me-2"></i>Suppliers</h2>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary" onclick="openSupplierModal()">
                            <i class="fas fa-plus me-1"></i>Add Supplier
                        </button>
                        <button class="btn btn-success" onclick="exportSuppliers()">
                            <i class="fas fa-file-csv me-1"></i>Export
                        </button>
                    </div>
                </div>

                <!-- Search Bar -->
                <div class="search-bar mb-4">
                    <div class="row">
                        <div class="col-md-8">
                            <i class="fas fa-search"></i>
                            <input type="text" id="supplierSearch" placeholder="Search suppliers by name, company, or email..." 
                                   value="${supplierSearchTerm}" onkeyup="handleSupplierSearch(event)">
                        </div>
                        <div class="col-md-4">
                            <select class="form-control" id="statusFilter" onchange="applySupplierFilters()">
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Suppliers Table -->
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Payment Terms</th>
                                    <th>Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${suppliers.length === 0 ? `
                                    <tr>
                                        <td colspan="7" class="text-center py-4">
                                            <i class="fas fa-truck fa-3x d-block mb-2 text-muted"></i>
                                            <p class="text-muted">No suppliers found</p>
                                            <button class="btn btn-primary btn-sm" onclick="openSupplierModal()">
                                                <i class="fas fa-plus me-1"></i>Add Supplier
                                            </button>
                                        </td>
                                    </tr>
                                ` : suppliers.map(supplier => `
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div>
                                                    <div class="fw-bold">${supplier.name}</div>
                                                    <small class="text-muted">${supplier.taxId || 'No Tax ID'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="fw-bold">${supplier.company}</span>
                                        </td>
                                        <td>
                                            <a href="mailto:${supplier.email}" class="text-decoration-none">
                                                ${supplier.email}
                                            </a>
                                        </td>
                                        <td>
                                            <a href="tel:${supplier.phone}" class="text-decoration-none">
                                                ${supplier.phone}
                                            </a>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">${supplier.paymentTerms || 'N/A'}</span>
                                            ${supplier.leadTime ? `<small class="text-muted d-block">${supplier.leadTime} days</small>` : ''}
                                        </td>
                                        <td>${getStatusBadge(supplier.isActive ? 'active' : 'inactive')}</td>
                                        <td class="text-center">
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-info" onclick="viewSupplier('${supplier._id}')" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-primary" onclick="editSupplier('${supplier._id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-danger" onclick="deleteSupplier('${supplier._id}')" title="Delete">
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
                                <a class="page-link" href="#" onclick="changeSupplierPage(${pagination.page - 1})">Previous</a>
                            </li>
                            ${Array.from({length: pagination.pages}, (_, i) => i + 1).map(p => `
                                <li class="page-item ${p === pagination.page ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="changeSupplierPage(${p})">${p}</a>
                                </li>
                            `).join('')}
                            <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
                                <a class="page-link" href="#" onclick="changeSupplierPage(${pagination.page + 1})">Next</a>
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
                Error loading suppliers: ${error.message}
            </div>
        `;
    }
}

/**
 * Change supplier page
 */
function changeSupplierPage(page) {
    currentSupplierPage = page;
    loadSuppliers();
}

/**
 * Handle supplier search with debounce
 */
const handleSupplierSearch = debounce(function(event) {
    supplierSearchTerm = document.getElementById('supplierSearch').value;
    currentSupplierPage = 1;
    loadSuppliers();
}, 400);

/**
 * Apply supplier filters
 */
function applySupplierFilters() {
    supplierFilters = {
        isActive: document.getElementById('statusFilter').value || undefined,
    };
    currentSupplierPage = 1;
    loadSuppliers();
}

/**
 * Clear supplier filters
 */
function clearSupplierFilters() {
    document.getElementById('supplierSearch').value = '';
    document.getElementById('statusFilter').value = '';
    supplierSearchTerm = '';
    supplierFilters = {};
    currentSupplierPage = 1;
    loadSuppliers();
}

/**
 * Open supplier modal for create or edit
 */
async function openSupplierModal(supplierId = null) {
    let modal = document.getElementById('supplierModal');
    if (!modal) {
        // Modal is in HTML, just get reference
        modal = document.getElementById('supplierModal');
    }

    const form = document.getElementById('supplierForm');
    form.reset();
    document.getElementById('supplierId').value = '';
    document.getElementById('supplierIsActive').checked = true;

    if (supplierId) {
        document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
        try {
            const response = await api.get(`/suppliers/${supplierId}`);
            const supplier = response.data;
            
            document.getElementById('supplierId').value = supplier._id;
            document.getElementById('supplierName').value = supplier.name;
            document.getElementById('supplierCompany').value = supplier.company;
            document.getElementById('supplierEmail').value = supplier.email;
            document.getElementById('supplierPhone').value = supplier.phone;
            document.getElementById('supplierTaxId').value = supplier.taxId || '';
            document.getElementById('supplierStreet').value = supplier.address?.street || '';
            document.getElementById('supplierCity').value = supplier.address?.city || '';
            document.getElementById('supplierState').value = supplier.address?.state || '';
            document.getElementById('supplierZip').value = supplier.address?.zipCode || '';
            document.getElementById('supplierCountry').value = supplier.address?.country || '';
            document.getElementById('supplierPaymentTerms').value = supplier.paymentTerms || 'net30';
            document.getElementById('supplierLeadTime').value = supplier.leadTime || 7;
            document.getElementById('supplierIsActive').checked = supplier.isActive;
        } catch (error) {
            showToast('Error loading supplier: ' + error.message, 'error');
            return;
        }
    } else {
        document.getElementById('supplierModalTitle').textContent = 'Add Supplier';
    }

    showModal('supplierModal');
}

/**
 * Save supplier (create or update)
 */
async function saveSupplier() {
    const supplierId = document.getElementById('supplierId').value;
    const data = {
        name: document.getElementById('supplierName').value.trim(),
        company: document.getElementById('supplierCompany').value.trim(),
        email: document.getElementById('supplierEmail').value.trim(),
        phone: document.getElementById('supplierPhone').value.trim(),
        taxId: document.getElementById('supplierTaxId').value.trim(),
        address: {
            street: document.getElementById('supplierStreet').value.trim(),
            city: document.getElementById('supplierCity').value.trim(),
            state: document.getElementById('supplierState').value.trim(),
            zipCode: document.getElementById('supplierZip').value.trim(),
            country: document.getElementById('supplierCountry').value.trim(),
        },
        paymentTerms: document.getElementById('supplierPaymentTerms').value,
        leadTime: parseInt(document.getElementById('supplierLeadTime').value) || 7,
        isActive: document.getElementById('supplierIsActive').checked,
    };

    // Validate
    if (!data.name) { showToast('Supplier name is required', 'error'); return; }
    if (!data.company) { showToast('Company name is required', 'error'); return; }
    if (!data.email) { showToast('Email is required', 'error'); return; }
    if (!isValidEmail(data.email)) { showToast('Please enter a valid email', 'error'); return; }
    if (!data.phone) { showToast('Phone number is required', 'error'); return; }

    try {
        let response;
        if (supplierId) {
            response = await api.put(`/suppliers/${supplierId}`, data);
            showToast('Supplier updated successfully');
        } else {
            response = await api.post('/suppliers', data);
            showToast('Supplier created successfully');
        }

        hideModal('supplierModal');
        loadSuppliers();
    } catch (error) {
        showToast('Error saving supplier: ' + error.message, 'error');
    }
}

/**
 * Edit supplier
 */
function editSupplier(supplierId) {
    openSupplierModal(supplierId);
}

/**
 * View supplier details
 */
async function viewSupplier(supplierId) {
    try {
        const response = await api.get(`/suppliers/${supplierId}`);
        const supplier = response.data;

        const content = document.getElementById('viewSupplierContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-muted">Personal Information</h6>
                    <div class="mb-2">
                        <strong>Name:</strong> ${supplier.name}
                    </div>
                    <div class="mb-2">
                        <strong>Company:</strong> ${supplier.company}
                    </div>
                    <div class="mb-2">
                        <strong>Email:</strong> <a href="mailto:${supplier.email}">${supplier.email}</a>
                    </div>
                    <div class="mb-2">
                        <strong>Phone:</strong> <a href="tel:${supplier.phone}">${supplier.phone}</a>
                    </div>
                    <div class="mb-2">
                        <strong>Tax ID:</strong> ${supplier.taxId || 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted">Business Information</h6>
                    <div class="mb-2">
                        <strong>Payment Terms:</strong> ${supplier.paymentTerms || 'N/A'}
                    </div>
                    <div class="mb-2">
                        <strong>Lead Time:</strong> ${supplier.leadTime || 'N/A'} days
                    </div>
                    <div class="mb-2">
                        <strong>Status:</strong> ${getStatusBadge(supplier.isActive ? 'active' : 'inactive')}
                    </div>
                    <div class="mb-2">
                        <strong>Created:</strong> ${formatDate(supplier.createdAt)}
                    </div>
                    <div class="mb-2">
                        <strong>Last Updated:</strong> ${formatDate(supplier.updatedAt)}
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h6 class="text-muted">Address</h6>
                ${supplier.address ? `
                    <p>
                        ${supplier.address.street || ''}<br>
                        ${supplier.address.city || ''} ${supplier.address.state || ''} ${supplier.address.zipCode || ''}<br>
                        ${supplier.address.country || ''}
                    </p>
                ` : '<p class="text-muted">No address provided</p>'}
            </div>
        `;

        // Store supplier ID for edit button
        document.getElementById('viewSupplierEditBtn').dataset.supplierId = supplierId;

        showModal('viewSupplierModal');
    } catch (error) {
        showToast('Error loading supplier: ' + error.message, 'error');
    }
}

/**
 * Edit supplier from view modal
 */
function editSupplierFromView() {
    const supplierId = document.getElementById('viewSupplierEditBtn').dataset.supplierId;
    hideModal('viewSupplierModal');
    setTimeout(() => {
        editSupplier(supplierId);
    }, 300);
}

/**
 * Delete supplier
 */
async function deleteSupplier(supplierId) {
    if (!confirm('Are you sure you want to delete this supplier?')) {
        return;
    }

    try {
        await api.delete(`/suppliers/${supplierId}`);
        showToast('Supplier deleted successfully');
        loadSuppliers();
    } catch (error) {
        showToast('Error deleting supplier: ' + error.message, 'error');
    }
}

/**
 * Export suppliers to CSV
 */
async function exportSuppliers() {
    try {
        const response = await fetch(`${APP.apiBase}/suppliers/export/csv`, {
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Suppliers exported successfully');
    } catch (error) {
        showToast('Error exporting suppliers: ' + error.message, 'error');
    }
}

// Make functions globally available
window.loadSuppliers = loadSuppliers;
window.openSupplierModal = openSupplierModal;
window.saveSupplier = saveSupplier;
window.editSupplier = editSupplier;
window.viewSupplier = viewSupplier;
window.deleteSupplier = deleteSupplier;
window.changeSupplierPage = changeSupplierPage;
window.exportSuppliers = exportSuppliers;
window.applySupplierFilters = applySupplierFilters;
window.clearSupplierFilters = clearSupplierFilters;
window.handleSupplierSearch = handleSupplierSearch;
window.editSupplierFromView = editSupplierFromView;