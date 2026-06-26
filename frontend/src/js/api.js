/**
 * API Service - Handles all API calls
 * @version 1.0.0
 */

class ApiService {
    constructor() {
        // Use window.APP.apiBase if available, otherwise use default
        this.baseUrl = (typeof window !== 'undefined' && window.APP && window.APP.apiBase) ? window.APP.apiBase : 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    /**
     * Get headers for API requests
     */
    getHeaders() {
        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }

        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        var data = await response.json();

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                this.clearToken();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login.html';
                }
                throw new Error('Session expired. Please login again.');
            }

            // Handle validation errors
            if (response.status === 400 && data.errors) {
                var errorMessages = data.errors.map(function(e) {
                    return Object.values(e)[0];
                }).join(', ');
                throw new Error(errorMessages || data.message || 'Validation error');
            }

            throw new Error(data.message || 'HTTP error ' + response.status);
        }

        return data;
    }

    /**
     * GET request
     */
    async get(endpoint, params) {
        params = params || {};
        var url = new URL(this.baseUrl + endpoint);
        
        // Add query parameters
        Object.keys(params).forEach(function(key) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        var response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        var response = await fetch(this.baseUrl + endpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(response);
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        var response = await fetch(this.baseUrl + endpoint, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(response);
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data) {
        var response = await fetch(this.baseUrl + endpoint, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(response);
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        var response = await fetch(this.baseUrl + endpoint, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * File upload
     */
    async upload(endpoint, file, fieldName) {
        fieldName = fieldName || 'image';
        var formData = new FormData();
        formData.append(fieldName, file);

        var response = await fetch(this.baseUrl + endpoint, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token,
            },
            body: formData,
        });

        return this.handleResponse(response);
    }

    /**
     * Download file
     */
    async download(endpoint, filename) {
        var response = await fetch(this.baseUrl + endpoint, {
            headers: {
                'Authorization': 'Bearer ' + this.token,
            },
        });

        if (!response.ok) {
            var data = await response.json();
            throw new Error(data.message || 'Download failed');
        }

        var blob = await response.blob();
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Create global API instance
if (typeof window !== 'undefined') {
    window.api = new ApiService();
}