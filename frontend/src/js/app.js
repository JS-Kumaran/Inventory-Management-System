/**
 * Main Application File
 * @version 1.0.0
 */

/* global bootstrap */

// Global state
var APP = {
    currentPage: 'dashboard',
    token: localStorage.getItem('token'),
    user: null,
    apiBase: 'http://localhost:5000/api',
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!APP.token) {
        window.location.href = '/login.html';
        return;
    }

    // Load user data
    loadUserData();

    // Show default page
    showPage('dashboard');
});

// Load user data
async function loadUserData() {
    try {
        var response = await fetch(APP.apiBase + '/auth/me', {
            headers: {
                'Authorization': 'Bearer ' + APP.token,
            },
        });

        var data = await response.json();
        if (data.success) {
            APP.user = data.data;
            var userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = data.data.firstName + ' ' + data.data.lastName;
            }
        } else {
            handleAuthError();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        handleAuthError();
    }
}

// Show page
function showPage(page) {
    APP.currentPage = page;
    var content = document.getElementById('pageContent');

    // Update active nav link
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove('active');
    }
    
    var activeLink = document.querySelector('[href="#' + page + '"]');
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load page content
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'reports':
            loadReports();
            break;
        default:
            if (content) {
                content.innerHTML = '<div class="text-center py-5"><i class="fas fa-file fa-3x text-muted mb-3"></i><h4>Page not found</h4><p class="text-muted">The page you\'re looking for doesn\'t exist.</p></div>';
            }
    }
}

// Handle auth error
function handleAuthError() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Logout
async function logout() {
    try {
        await fetch(APP.apiBase + '/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + APP.token,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Show toast notification
function showToast(message, type) {
    type = type || 'success';
    
    var container = document.querySelector('.toast-container');
    if (!container) {
        var newContainer = document.createElement('div');
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
        container = newContainer;
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    
    var iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    var iconClass = iconMap[type] || iconMap.info;

    toast.innerHTML = 
        '<div class="d-flex align-items-center">' +
            '<i class="fas ' + iconClass + ' me-2"></i>' +
            '<span>' + message + '</span>' +
            '<button class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>' +
        '</div>';

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(function() {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Show loader
function showLoader() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="text-center py-5">' +
                '<div class="loader"></div>' +
                '<p class="mt-3 text-muted">Loading...</p>' +
            '</div>';
    }
}

// Format currency
function formatCurrency(amount) {
    if (amount === undefined || amount === null) amount = 0;
    return '$' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(date) {
    if (!date) return 'N/A';
    var d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Format date only (no time)
function formatDateOnly(date) {
    if (!date) return 'N/A';
    var d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Show modal
function showModal(modalId) {
    var modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    var modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Hide modal
function hideModal(modalId) {
    var modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
}

// Get form data as object
function getFormData(formId) {
    var form = document.getElementById(formId);
    if (!form) return {};
    
    var data = new FormData(form);
    var obj = {};
    data.forEach(function(value, key) {
        obj[key] = value;
    });
    return obj;
}

// Get status badge HTML
function getStatusBadge(status) {
    if (!status) status = 'unknown';
    status = status.toLowerCase();
    
    var statusMap = {
        'active': 'active',
        'inactive': 'inactive',
        'pending': 'pending',
        'processing': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'returned': 'returned',
        'paid': 'paid',
        'failed': 'failed',
        'refunded': 'refunded',
        'completed': 'completed'
    };
    
    var className = 'badge-status';
    var label = status;
    
    if (statusMap[status]) {
        className = 'badge-status ' + statusMap[status];
        label = status;
    }
    
    return '<span class="' + className + '">' + label.charAt(0).toUpperCase() + label.slice(1) + '</span>';
}

// Debounce function
function debounce(func, wait) {
    wait = wait || 300;
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// ============================================
// PAGE LOADERS (To be implemented in separate files)
// ============================================

// Dashboard
function loadDashboard() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-chart-pie me-2"></i>Dashboard</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Dashboard module loaded successfully. Please implement your dashboard logic in dashboard.js' +
                '</div>' +
            '</div>';
    }
}

// Products
function loadProducts() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-box me-2"></i>Products</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Products module loaded successfully. Please implement your products logic in products.js' +
                '</div>' +
            '</div>';
    }
}

// Categories
function loadCategories() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-tags me-2"></i>Categories</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Categories module loaded successfully. Please implement your categories logic in categories.js' +
                '</div>' +
            '</div>';
    }
}

// Suppliers
function loadSuppliers() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-truck me-2"></i>Suppliers</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Suppliers module loaded successfully. Please implement your suppliers logic in suppliers.js' +
                '</div>' +
            '</div>';
    }
}

// Orders
function loadOrders() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-shopping-cart me-2"></i>Orders</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Orders module loaded successfully. Please implement your orders logic in orders.js' +
                '</div>' +
            '</div>';
    }
}

// Inventory
function loadInventory() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-warehouse me-2"></i>Inventory</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Inventory module loaded successfully. Please implement your inventory logic in inventory.js' +
                '</div>' +
            '</div>';
    }
}

// Reports
function loadReports() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-file-alt me-2"></i>Reports</h2>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Reports module loaded successfully. Please implement your reports logic in reports.js' +
                '</div>' +
            '</div>';
    }
}

// ============================================
// EXPOSE GLOBALLY
// ============================================

window.APP = APP;
window.showPage = showPage;
window.showToast = showToast;
window.showLoader = showLoader;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateOnly = formatDateOnly;
window.showModal = showModal;
window.hideModal = hideModal;
window.getFormData = getFormData;
window.getStatusBadge = getStatusBadge;
window.debounce = debounce;
window.logout = logout;
window.loadDashboard = loadDashboard;
window.loadProducts = loadProducts;
window.loadCategories = loadCategories;
window.loadSuppliers = loadSuppliers;
window.loadOrders = loadOrders;
window.loadInventory = loadInventory;
window.loadReports = loadReports;