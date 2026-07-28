/**
 * Main Application File
 * @version 1.0.0
 */

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
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    loadUserData();

    // Show default page
    showPage('dashboard');
});

/**
 * Load user data from API
 */
/**
 * Load user data from API
 */
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
            // Don't redirect on error - just show the page
            console.warn('Could not load user data, but continuing...');
            var userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = 'User';
            }
        }
    } catch (error) {
        console.warn('Error loading user data:', error);
        // Don't redirect - just show the page
        var userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = 'User';
        }
    }
}/**
 * Show a specific page
 * @param {string} page - Page name to show
 */
function showPage(page) {
    APP.currentPage = page;
    var content = document.getElementById('pageContent');

    // Update active nav link
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove('active');
        var dataPage = navLinks[i].getAttribute('data-page');
        if (dataPage === page) {
            navLinks[i].classList.add('active');
        }
    }

    // Load page content based on page name
    switch(page) {
        case 'dashboard':
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            } else {
                fallbackPage('Dashboard', 'chart-pie');
            }
            break;
        case 'products':
            if (typeof loadProducts === 'function') {
                loadProducts();
            } else {
                fallbackPage('Products', 'box');
            }
            break;
        case 'categories':
            if (typeof loadCategories === 'function') {
                loadCategories();
            } else {
                fallbackPage('Categories', 'tags');
            }
            break;
        case 'suppliers':
            if (typeof loadSuppliers === 'function') {
                loadSuppliers();
            } else {
                fallbackPage('Suppliers', 'truck');
            }
            break;
        case 'orders':
            if (typeof loadOrders === 'function') {
                loadOrders();
            } else {
                fallbackPage('Orders', 'shopping-cart');
            }
            break;
        case 'inventory':
            if (typeof loadInventory === 'function') {
                loadInventory();
            } else {
                fallbackPage('Inventory', 'warehouse');
            }
            break;
        case 'reports':
            if (typeof loadReports === 'function') {
                loadReports();
            } else {
                fallbackPage('Reports', 'file-alt');
            }
            break;
        default:
            if (content) {
                content.innerHTML = '<div class="text-center py-5"><i class="fas fa-file fa-3x text-muted mb-3"></i><h4>Page not found</h4></div>';
            }
    }
}

/**
 * Fallback page loader when module is not loaded
 */
function fallbackPage(title, icon) {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<h2><i class="fas fa-' + icon + ' me-2"></i>' + title + '</h2>' +
                '<div class="alert alert-success mt-3">' +
                    '<i class="fas fa-check-circle me-2"></i>' +
                    title + ' page loaded successfully!' +
                '</div>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Connect to backend API to see real data. Make sure backend is running on port 5000.' +
                '</div>' +
                '<div class="row mt-4">' +
                    '<div class="col-md-4"><div class="card"><div class="card-body"><h5>Ready</h5><p class="text-muted">Module is ready for backend integration.</p></div></div></div>' +
                    '<div class="col-md-4"><div class="card"><div class="card-body"><h5>API Ready</h5><p class="text-muted">Check /api/' + icon + ' endpoint</p></div></div></div>' +
                    '<div class="col-md-4"><div class="card"><div class="card-body"><h5>Documentation</h5><p class="text-muted">Refer to API documentation</p></div></div></div>' +
                '</div>' +
            '</div>';
    }
}

/**
 * Handle authentication error
 */
function handleAuthError() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Logout user
 */
async function logout() {
    try {
        if (APP.token) {
            await fetch(APP.apiBase + '/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + APP.token,
                },
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Show user profile
 */
function showProfile() {
    var user = APP.user;
    if (!user) {
        showToast('Please login again', 'error');
        return;
    }

    alert('Profile Information\n\n' +
          'Name: ' + user.firstName + ' ' + user.lastName + '\n' +
          'Email: ' + user.email + '\n' +
          'Role: ' + user.role + '\n' +
          'Phone: ' + (user.phone || 'Not provided') + '\n' +
          'Status: ' + (user.isActive ? 'Active' : 'Inactive'));
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 */
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

    setTimeout(function() {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

/**
 * Show loader in page content
 */
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

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) amount = 0;
    return '$' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
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

/**
 * Format date only (no time)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDateOnly(date) {
    if (!date) return 'N/A';
    var d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
function showModal(modalId) {
    var modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

/**
 * Hide modal
 * @param {string} modalId - Modal element ID
 */
function hideModal(modalId) {
    var modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    } else {
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

/**
 * Get status badge HTML
 * @param {string} status - Status value
 * @returns {string} Badge HTML
 */
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

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
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
window.getStatusBadge = getStatusBadge;
window.debounce = debounce;
window.logout = logout;
window.showProfile = showProfile;