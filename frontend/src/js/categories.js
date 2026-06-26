/**
 * Categories Module
 * Handles category CRUD operations
 * @version 1.0.0
 */

// Load categories
async function loadCategories() {
    showLoader();
    var content = document.getElementById('pageContent');

    try {
        var response = await api.get('/categories');
        var categories = response.data || [];

        var html = '';
        html += '<div class="page-content">';
        html += '<div class="d-flex justify-content-between align-items-center mb-4">';
        html += '<h2><i class="fas fa-tags me-2"></i>Categories</h2>';
        html += '<button class="btn btn-primary" onclick="openCategoryModal()">';
        html += '<i class="fas fa-plus me-1"></i>Add Category';
        html += '</button>';
        html += '</div>';
        html += '<div class="row">';

        if (categories.length === 0) {
            html += '<div class="col-12">';
            html += '<div class="text-center py-5">';
            html += '<i class="fas fa-tags fa-3x d-block mb-2 text-muted"></i>';
            html += '<p class="text-muted">No categories found</p>';
            html += '</div>';
            html += '</div>';
        } else {
            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                var parentName = (category.parentCategory && category.parentCategory.name) ? category.parentCategory.name : '';
                var subCount = (category.subcategories && category.subcategories.length) ? category.subcategories.length : 0;
                
                html += '<div class="col-md-4 col-lg-3 mb-4">';
                html += '<div class="card h-100">';
                html += '<img src="' + (category.image || '/uploads/default-category.png') + '" class="card-img-top" alt="' + category.name + '" style="height: 150px; object-fit: cover;">';
                html += '<div class="card-body">';
                html += '<h5 class="card-title">' + category.name + '</h5>';
                html += '<p class="card-text text-muted small">' + (category.description || '') + '</p>';
                html += '<p class="card-text">';
                html += '<span class="badge-status ' + (category.isActive ? 'active' : 'inactive') + '">';
                html += category.isActive ? 'Active' : 'Inactive';
                html += '</span>';
                html += '</p>';
                if (parentName) {
                    html += '<small class="text-muted">Parent: ' + parentName + '</small>';
                }
                if (subCount > 0) {
                    html += '<small class="text-muted d-block">Subcategories: ' + subCount + '</small>';
                }
                html += '</div>';
                html += '<div class="card-footer bg-white d-flex gap-2">';
                html += '<button class="btn btn-sm btn-primary flex-grow-1" onclick="editCategory(\'' + category._id + '\')">';
                html += '<i class="fas fa-edit"></i> Edit';
                html += '</button>';
                html += '<button class="btn btn-sm btn-danger" onclick="deleteCategory(\'' + category._id + '\')">';
                html += '<i class="fas fa-trash"></i>';
                html += '</button>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
        }

        html += '</div>';
        html += '</div>';

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error loading categories: ' + error.message + '</div>';
    }
}

// Open category modal
async function openCategoryModal(categoryId) {
    categoryId = categoryId || null;
    
    var modal = document.getElementById('categoryModal');
    // Create modal if it doesn't exist
    if (!modal) {
        createCategoryModal();
        modal = document.getElementById('categoryModal');
    }

    var form = document.getElementById('categoryForm');
    if (form) form.reset();
    
    var categoryIdInput = document.getElementById('categoryId');
    if (categoryIdInput) categoryIdInput.value = '';

    var title = document.getElementById('categoryModalTitle');
    if (title) {
        title.textContent = categoryId ? 'Edit Category' : 'Add Category';
    }

    if (categoryId) {
        try {
            var response = await api.get('/categories/' + categoryId);
            var category = response.data;
            
            document.getElementById('categoryId').value = category._id;
            document.getElementById('categoryName').value = category.name || '';
            document.getElementById('categoryDescription').value = category.description || '';
            document.getElementById('categoryParent').value = (category.parentCategory && category.parentCategory._id) ? category.parentCategory._id : '';
            document.getElementById('categoryIsActive').checked = category.isActive !== false;
        } catch (error) {
            showToast('Error loading category: ' + error.message, 'error');
            return;
        }
    } else {
        var isActiveCheck = document.getElementById('categoryIsActive');
        if (isActiveCheck) isActiveCheck.checked = true;
    }

    // Load parent categories
    await loadParentCategories();

    showModal('categoryModal');
}

// Create category modal
function createCategoryModal() {
    var modalHTML = '';
    modalHTML += '<div class="modal fade" id="categoryModal" tabindex="-1">';
    modalHTML += '<div class="modal-dialog">';
    modalHTML += '<div class="modal-content">';
    modalHTML += '<div class="modal-header">';
    modalHTML += '<h5 class="modal-title" id="categoryModalTitle">Add Category</h5>';
    modalHTML += '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-body">';
    modalHTML += '<form id="categoryForm">';
    modalHTML += '<input type="hidden" id="categoryId">';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="categoryName" class="form-label">Category Name *</label>';
    modalHTML += '<input type="text" class="form-control" id="categoryName" required>';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="categoryDescription" class="form-label">Description</label>';
    modalHTML += '<textarea class="form-control" id="categoryDescription" rows="3"></textarea>';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3">';
    modalHTML += '<label for="categoryParent" class="form-label">Parent Category</label>';
    modalHTML += '<select class="form-control" id="categoryParent">';
    modalHTML += '<option value="">None (Top Level)</option>';
    modalHTML += '</select>';
    modalHTML += '</div>';
    modalHTML += '<div class="mb-3 form-check">';
    modalHTML += '<input type="checkbox" class="form-check-input" id="categoryIsActive">';
    modalHTML += '<label class="form-check-label" for="categoryIsActive">Active</label>';
    modalHTML += '</div>';
    modalHTML += '</form>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-footer">';
    modalHTML += '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
    modalHTML += '<button type="button" class="btn btn-primary" onclick="saveCategory()">Save Category</button>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    modalHTML += '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Load parent categories
async function loadParentCategories() {
    try {
        var response = await api.get('/categories');
        var select = document.getElementById('categoryParent');
        var currentId = document.getElementById('categoryId').value;

        if (select) {
            select.innerHTML = '<option value="">None (Top Level)</option>';
            var categories = response.data || [];
            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                if (category._id !== currentId) {
                    var option = document.createElement('option');
                    option.value = category._id;
                    option.textContent = category.name;
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Error loading parent categories:', error);
    }
}

// Save category
async function saveCategory() {
    var categoryId = document.getElementById('categoryId').value;
    var data = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        parentCategory: document.getElementById('categoryParent').value || null,
        isActive: document.getElementById('categoryIsActive').checked,
    };

    if (!data.name || data.name.trim() === '') {
        showToast('Category name is required', 'error');
        return;
    }

    try {
        if (categoryId) {
            await api.put('/categories/' + categoryId, data);
            showToast('Category updated successfully');
        } else {
            await api.post('/categories', data);
            showToast('Category created successfully');
        }

        hideModal('categoryModal');
        loadCategories();
    } catch (error) {
        showToast('Error saving category: ' + error.message, 'error');
    }
}

// Edit category
function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }

    try {
        await api.delete('/categories/' + categoryId);
        showToast('Category deleted successfully');
        loadCategories();
    } catch (error) {
        showToast('Error deleting category: ' + error.message, 'error');
    }
}

// Make functions globally available
window.loadCategories = loadCategories;
window.openCategoryModal = openCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;