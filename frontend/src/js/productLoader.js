/**
 * Products Module - Simplified Version
 * @version 1.0.0
 */

// Load products without API calls
function loadProducts() {
    var content = document.getElementById('pageContent');
    if (content) {
        content.innerHTML = 
            '<div class="page-content">' +
                '<div class="d-flex justify-content-between align-items-center mb-4">' +
                    '<h2><i class="fas fa-box me-2"></i>Products</h2>' +
                    '<button class="btn btn-primary" onclick="showToast(\'Product module loaded!\', \'success\')">' +
                        '<i class="fas fa-plus me-1"></i>Add Product' +
                    '</button>' +
                '</div>' +
                '<div class="table-container">' +
                    '<div class="table-responsive">' +
                        '<table class="table table-hover">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>SKU</th>' +
                                    '<th>Product</th>' +
                                    '<th>Category</th>' +
                                    '<th>Stock</th>' +
                                    '<th>Price</th>' +
                                    '<th>Status</th>' +
                                    '<th>Actions</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                '<tr>' +
                                    '<td colspan="7" class="text-center py-4">' +
                                        '<i class="fas fa-box-open fa-3x d-block mb-2 text-muted"></i>' +
                                        '<p class="text-muted">No products found. Connect to backend API to see real data.</p>' +
                                        '<button class="btn btn-primary btn-sm" onclick="showToast(\'Add product form would open here\', \'info\')">' +
                                            '<i class="fas fa-plus me-1"></i>Add Product' +
                                        '</button>' +
                                    '</td>' +
                                '</tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div class="alert alert-info mt-3">' +
                    '<i class="fas fa-info-circle me-2"></i>' +
                    'Products module loaded successfully! Connect to backend API to see real product data.' +
                '</div>' +
            '</div>';
    }
}

// Make functions globally available
window.loadProducts = loadProducts;