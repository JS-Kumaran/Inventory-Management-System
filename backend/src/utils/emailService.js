const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendEmail(to, subject, html, attachments = []) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to,
                subject,
                html,
                attachments,
            };

            const info = await this.transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }

    async sendWelcomeEmail(user) {
        const html = `
            <h1>Welcome to Inventory Management System</h1>
            <p>Hello ${user.firstName} ${user.lastName},</p>
            <p>Your account has been created successfully.</p>
            <p>Email: ${user.email}</p>
            <p>Role: ${user.role}</p>
            <p>Thank you for joining us!</p>
        `;
        return this.sendEmail(user.email, 'Welcome to Inventory Management System', html);
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
        const html = `
            <h1>Password Reset</h1>
            <p>You requested to reset your password.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `;
        return this.sendEmail(email, 'Password Reset Request', html);
    }

    async sendLowStockAlert(product) {
        const html = `
            <h1>Low Stock Alert</h1>
            <p>Product: ${product.name}</p>
            <p>SKU: ${product.sku}</p>
            <p>Current Stock: ${product.stock.quantity}</p>
            <p>Minimum Threshold: ${product.stock.minThreshold}</p>
            <p>Please restock this product.</p>
        `;
        return this.sendEmail(process.env.ALERT_EMAIL, 'Low Stock Alert', html);
    }
}

module.exports = new EmailService();