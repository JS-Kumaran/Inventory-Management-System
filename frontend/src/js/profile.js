/**
 * Profile Module
 * Handles user profile management
 */

// ============================================
// LOAD PROFILE PAGE
// ============================================

/**
 * Load profile page
 */
function loadProfile() {
    showLoader();
    const content = document.getElementById('pageContent');

    const user = APP.user;
    if (!user) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                User data not found. Please login again.
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="page-content">
            <h2 class="mb-4"><i class="fas fa-user-cog me-2"></i>My Profile</h2>

            <div class="row">
                <!-- Profile Info Card -->
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <div class="position-relative d-inline-block mb-3">
                                <img src="${user.profileImage || '/uploads/default-profile.png'}" 
                                     alt="Profile" 
                                     class="rounded-circle" 
                                     style="width: 150px; height: 150px; object-fit: cover; border: 3px solid #4e73df;">
                                <button class="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle" 
                                        onclick="document.getElementById('profileImageInput').click()"
                                        style="width: 36px; height: 36px;">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <input type="file" id="profileImageInput" accept="image/*" style="display:none;" 
                                       onchange="uploadProfileImage(this)">
                            </div>
                            <h4>${user.firstName} ${user.lastName}</h4>
                            <p class="text-muted">${user.email}</p>
                            <span class="badge-status ${user.isActive ? 'active' : 'inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span class="badge bg-primary ms-2">${user.role}</span>
                            <p class="mt-3 text-muted small">
                                <i class="fas fa-clock me-1"></i>
                                Member since ${formatDateOnly(user.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div class="card mt-3">
                        <div class="card-body">
                            <h6 class="card-title"><i class="fas fa-chart-bar me-2"></i>Statistics</h6>
                            <hr>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Products Created</span>
                                <span class="fw-bold" id="userProductCount">-</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Orders Processed</span>
                                <span class="fw-bold" id="userOrderCount">-</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Last Login</span>
                                <span class="fw-bold">${user.lastLogin ? formatDate(user.lastLogin) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Edit Form -->
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-edit me-1"></i>
                            Edit Profile
                        </div>
                        <div class="card-body">
                            <form id="profileForm" onsubmit="updateProfileInfo(event)">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="profileFirstName" class="form-label">First Name *</label>
                                        <input type="text" class="form-control" id="profileFirstName" 
                                               value="${user.firstName || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="profileLastName" class="form-label">Last Name *</label>
                                        <input type="text" class="form-control" id="profileLastName" 
                                               value="${user.lastName || ''}" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="profileEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="profileEmail" 
                                           value="${user.email || ''}" disabled>
                                    <small class="text-muted">Email cannot be changed</small>
                                </div>
                                <div class="mb-3">
                                    <label for="profilePhone" class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" id="profilePhone" 
                                           value="${user.phone || ''}" placeholder="Enter phone number">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Address</label>
                                    <div class="row">
                                        <div class="col-md-6 mb-2">
                                            <input type="text" class="form-control" id="profileStreet" 
                                                   placeholder="Street" value="${user.address?.street || ''}">
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <input type="text" class="form-control" id="profileCity" 
                                                   placeholder="City" value="${user.address?.city || ''}">
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <input type="text" class="form-control" id="profileState" 
                                                   placeholder="State" value="${user.address?.state || ''}">
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <input type="text" class="form-control" id="profileZip" 
                                                   placeholder="Zip Code" value="${user.address?.zipCode || ''}">
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <input type="text" class="form-control" id="profileCountry" 
                                                   placeholder="Country" value="${user.address?.country || ''}">
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Update Profile
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Change Password Card -->
                    <div class="card mt-3">
                        <div class="card-header">
                            <i class="fas fa-key me-1"></i>
                            Change Password
                        </div>
                        <div class="card-body">
                            <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Current Password *</label>
                                    <input type="password" class="form-control" id="currentPassword" required>
                                </div>
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">New Password *</label>
                                    <input type="password" class="form-control" id="newPassword" required minlength="6">
                                </div>
                                <div class="mb-3">
                                    <label for="confirmNewPassword" class="form-label">Confirm New Password *</label>
                                    <input type="password" class="form-control" id="confirmNewPassword" required>
                                </div>
                                <button type="submit" class="btn btn-warning">
                                    <i class="fas fa-key me-1"></i>Change Password
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Activity Log -->
                    <div class="card mt-3">
                        <div class="card-header">
                            <i class="fas fa-history me-1"></i>
                            Recent Activity
                        </div>
                        <div class="card-body">
                            <div id="activityLog">
                                <p class="text-muted text-center">Loading activity...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load user statistics
    loadUserStatistics(user._id);
    loadActivityLog(user._id);
}

// ============================================
// UPDATE PROFILE
// ============================================

/**
 * Update profile information
 */
async function updateProfileInfo(event) {
    event.preventDefault();

    const data = {
        firstName: document.getElementById('profileFirstName').value.trim(),
        lastName: document.getElementById('profileLastName').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: {
            street: document.getElementById('profileStreet').value.trim(),
            city: document.getElementById('profileCity').value.trim(),
            state: document.getElementById('profileState').value.trim(),
            zipCode: document.getElementById('profileZip').value.trim(),
            country: document.getElementById('profileCountry').value.trim(),
        },
    };

    if (!data.firstName || !data.lastName) {
        showToast('First name and last name are required', 'error');
        return;
    }

    try {
        const response = await api.put('/auth/updateprofile', data);
        if (response.success) {
            // Update local user data
            APP.user = response.data;
            localStorage.setItem('user', JSON.stringify(response.data));
            document.getElementById('userName').textContent = `${response.data.firstName} ${response.data.lastName}`;
            showToast('Profile updated successfully');
        }
    } catch (error) {
        showToast('Error updating profile: ' + error.message, 'error');
    }
}

// ============================================
// CHANGE PASSWORD
// ============================================

/**
 * Handle change password
 */
async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('All fields are required', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await api.put('/auth/changepassword', {
            currentPassword,
            newPassword,
        });

        if (response.success) {
            showToast('Password changed successfully');
            document.getElementById('changePasswordForm').reset();
        }
    } catch (error) {
        showToast('Error changing password: ' + error.message, 'error');
    }
}

// ============================================
// UPLOAD PROFILE IMAGE
// ============================================

/**
 * Upload profile image
 */
async function uploadProfileImage(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${APP.apiBase}/auth/uploadprofileimage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${APP.token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            APP.user.profileImage = data.data.imageUrl;
            localStorage.setItem('user', JSON.stringify(APP.user));
            showToast('Profile image updated successfully');
            loadProfile();
        } else {
            showToast(data.message || 'Failed to upload image', 'error');
        }
    } catch (error) {
        showToast('Error uploading image: ' + error.message, 'error');
    }
}

// ============================================
// LOAD USER STATISTICS
// ============================================

/**
 * Load user statistics
 */
async function loadUserStatistics(userId) {
    try {
        // Count products created by user
        const productsResponse = await api.get('/products', { createdBy: userId, limit: 1 });
        document.getElementById('userProductCount').textContent = productsResponse.pagination?.total || 0;

        // Count orders processed by user
        const ordersResponse = await api.get('/orders', { createdBy: userId, limit: 1 });
        document.getElementById('userOrderCount').textContent = ordersResponse.pagination?.total || 0;
    } catch (error) {
        console.error('Error loading user statistics:', error);
    }
}

// ============================================
// LOAD ACTIVITY LOG
// ============================================

/**
 * Load activity log
 */
async function loadActivityLog(userId) {
    const container = document.getElementById('activityLog');

    try {
        // This would call a dedicated activity endpoint
        // For now, show placeholder data
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon bg-primary text-white">
                    <i class="fas fa-sign-in-alt"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Last Login</div>
                    <div class="activity-time">${APP.user.lastLogin ? formatDate(APP.user.lastLogin) : 'N/A'}</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-icon bg-success text-white">
                    <i class="fas fa-user-edit"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Profile Updated</div>
                    <div class="activity-time">${formatDate(APP.user.updatedAt)}</div>
                </div>
            </div>
            <p class="text-muted text-center mt-3">Activity logging coming soon...</p>
        `;
    } catch (error) {
        container.innerHTML = `
            <p class="text-muted text-center">Error loading activity</p>
        `;
    }
}

// ============================================
// EXPORT
// ============================================

window.loadProfile = loadProfile;
window.updateProfileInfo = updateProfileInfo;
window.handleChangePassword = handleChangePassword;
window.uploadProfileImage = uploadProfileImage;