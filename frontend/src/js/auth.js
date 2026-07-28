/**
 * Authentication Module
 * Handles login, registration, and password management
 * @version 1.0.0
 */

// Check if user is authenticated
function isAuthenticated() {
    var token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check token expiry (optional)
    try {
        var payload = JSON.parse(atob(token.split('.')[1]));
        var exp = payload.exp * 1000;
        return Date.now() < exp;
    } catch (e) {
        return false;
    }
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Redirect to dashboard if already authenticated
function requireGuest() {
    if (isAuthenticated()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Login function
async function login(email, password) {
    try {
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: password }),
        });

        var data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Register function
async function register(userData) {
    try {
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        var data = await response.json();

        if (response.ok && data.success) {
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message || 'Registration failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Logout function
async function logout() {
    try {
        var token = localStorage.getItem('token');
        if (token) {
            var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
            await fetch(apiBase + '/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Get current user
function getCurrentUser() {
    try {
        var user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// Update user profile
async function updateProfile(profileData) {
    try {
        var token = localStorage.getItem('token');
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/updateprofile', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
        });

        var data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('user', JSON.stringify(data.data));
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message || 'Update failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        var token = localStorage.getItem('token');
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/changepassword', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            }),
        });

        var data = await response.json();
        if (response.ok && data.success) {
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message || 'Password change failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Forgot password
async function forgotPassword(email) {
    try {
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/forgotpassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
        });

        var data = await response.json();
        if (response.ok && data.success) {
            return { success: true, message: data.message };
        } else {
            return { success: false, message: data.message || 'Request failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Reset password
async function resetPassword(token, password) {
    try {
        var apiBase = (typeof APP !== 'undefined' && APP.apiBase) ? APP.apiBase : 'http://localhost:5000/api';
        var response = await fetch(apiBase + '/auth/resetpassword/' + token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password }),
        });

        var data = await response.json();
        if (response.ok && data.success) {
            return { success: true, data: data.data };
        } else {
            return { success: false, message: data.message || 'Reset failed' };
        }
    } catch (error) {
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// Export for use in other files
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.requireGuest = requireGuest;
window.login = login;
window.register = register;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.updateProfile = updateProfile;
window.changePassword = changePassword;
window.forgotPassword = forgotPassword;
window.resetPassword = resetPassword;