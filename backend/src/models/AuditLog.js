const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            enum: ['create', 'update', 'delete', 'view', 'login', 'logout', 'export', 'import'],
            required: true,
        },
        module: {
            type: String,
            enum: ['auth', 'product', 'category', 'supplier', 'inventory', 'order', 'user', 'report'],
            required: true,
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',
        },
        errorMessage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;