/**
 * Utility Functions
 * Common helper functions used across the application
 */

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
function truncate(str, length = 50, suffix = '...') {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
}

/**
 * Generate a random string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Slugify a string (for URLs)
 * @param {string} str - String to slugify
 * @returns {string} Slugified string
 */
function slugify(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ============================================
// NUMBER UTILITIES
// ============================================

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse number from string
 * @param {string} str - String to parse
 * @returns {number} Parsed number
 */
function parseNumber(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Round to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
function roundTo(num, decimals = 2) {
    if (num === undefined || num === null) return 0;
    return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
}

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage
 */
function calculatePercentage(part, total, decimals = 2) {
    if (!total || total === 0) return 0;
    return roundTo((part / total) * 100, decimals);
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time
 */
function timeAgo(date) {
    if (!date) return 'N/A';
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
}

/**
 * Get start and end of day
 * @param {string|Date} date - Date
 * @returns {Object} { start, end }
 */
function getDayRange(date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    return { start, end };
}

/**
 * Get start and end of week
 * @param {string|Date} date - Date
 * @returns {Object} { start, end }
 */
function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

/**
 * Get start and end of month
 * @param {string|Date} date - Date
 * @returns {Object} { start, end }
 */
function getMonthRange(date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if today
 */
function isToday(date) {
    if (!date) return false;
    const today = new Date();
    const d = new Date(date);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
}

/**
 * Check if date is in past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if past
 */
function isPast(date) {
    if (!date) return false;
    return new Date(date) < new Date();
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
    if (!array || !Array.isArray(array)) return {};
    return array.reduce((result, item) => {
        const groupKey = item[key] || 'undefined';
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
function sortBy(array, key, order = 'asc') {
    if (!array || !Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
        const valA = a[key] || '';
        const valB = b[key] || '';
        if (typeof valA === 'string') {
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return order === 'asc' ? valA - valB : valB - valA;
    });
}

/**
 * Unique array values
 * @param {Array} array - Array to process
 * @returns {Array} Unique array
 */
function unique(array) {
    if (!array || !Array.isArray(array)) return [];
    return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Chunked array
 */
function chunk(array, size = 10) {
    if (!array || !Array.isArray(array)) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Pick specific keys from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to pick
 * @returns {Object} New object with picked keys
 */
function pick(obj, keys) {
    if (!obj || !keys || !Array.isArray(keys)) return {};
    return keys.reduce((result, key) => {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Omit specific keys from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to omit
 * @returns {Object} New object without omitted keys
 */
function omit(obj, keys) {
    if (!obj || !keys || !Array.isArray(keys)) return obj;
    return Object.keys(obj).reduce((result, key) => {
        if (!keys.includes(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 */
function isEmpty(obj) {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
    if (!phone) return false;
    return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate SKU format
 * @param {string} sku - SKU to validate
 * @returns {boolean} True if valid
 */
function isValidSku(sku) {
    if (!sku) return false;
    return /^[A-Za-z0-9\-_]+$/.test(sku);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid, score, message }
 */
function validatePassword(password) {
    if (!password) return { valid: false, score: 0, message: 'Password is required' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong', 'Excellent'];
    const valid = score >= 3;

    return {
        valid,
        score,
        message: levels[Math.min(score, levels.length - 1)],
    };
}

// ============================================
// FILE UTILITIES
// ============================================

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable size
 */
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Check if file is an image
 * @param {string} filename - Filename
 * @returns {boolean} True if image
 */
function isImageFile(filename) {
    if (!filename) return false;
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    return extensions.includes(getFileExtension(filename));
}

// ============================================
// DOM UTILITIES
// ============================================

/**
 * Get element or throw error
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element
 * @returns {Element} DOM element
 */
function getElement(selector, parent = document) {
    const el = parent.querySelector(selector);
    if (!el) {
        throw new Error(`Element not found: ${selector}`);
    }
    return el;
}

/**
 * Toggle element visibility
 * @param {string|Element} selector - Element or selector
 * @param {boolean} show - Show or hide
 */
function toggleElement(selector, show) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) {
        el.style.display = show ? '' : 'none';
    }
}

/**
 * Scroll to element
 * @param {string|Element} selector - Element or selector
 * @param {Object} options - Scroll options
 */
function scrollToElement(selector, options = {}) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) {
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            ...options,
        });
    }
}

// ============================================
// EXPORT
// ============================================

// Make all functions available globally
window.capitalize = capitalize;
window.truncate = truncate;
window.generateRandomString = generateRandomString;
window.randomBetween = randomBetween;
window.slugify = slugify;
window.formatNumber = formatNumber;
window.parseNumber = parseNumber;
window.roundTo = roundTo;
window.calculatePercentage = calculatePercentage;
window.timeAgo = timeAgo;
window.getDayRange = getDayRange;
window.getWeekRange = getWeekRange;
window.getMonthRange = getMonthRange;
window.isToday = isToday;
window.isPast = isPast;
window.groupBy = groupBy;
window.sortBy = sortBy;
window.unique = unique;
window.chunk = chunk;
window.deepClone = deepClone;
window.pick = pick;
window.omit = omit;
window.isEmpty = isEmpty;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.isValidUrl = isValidUrl;
window.isValidSku = isValidSku;
window.validatePassword = validatePassword;
window.getFileExtension = getFileExtension;
window.formatFileSize = formatFileSize;
window.isImageFile = isImageFile;
window.getElement = getElement;
window.toggleElement = toggleElement;
window.scrollToElement = scrollToElement;