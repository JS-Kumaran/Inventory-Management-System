const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    static async generateProductReport(products, filename = 'product-report.pdf') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(path.join('temp', filename));
                doc.pipe(stream);

                // Header
                doc.fontSize(20).text('Product Inventory Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
                doc.moveDown();

                // Table headers
                const tableTop = doc.y;
                doc.fontSize(10);
                
                // Draw table headers
                const headers = ['SKU', 'Name', 'Category', 'Stock', 'Cost', 'Selling', 'Value'];
                const columnWidths = [80, 150, 100, 60, 70, 70, 80];
                let x = 50;
                
                doc.font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    doc.text(header, x, tableTop, { width: columnWidths[i], align: 'left' });
                    x += columnWidths[i];
                });

                // Draw line
                doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

                // Table rows
                doc.font('Helvetica');
                let y = tableTop + 30;
                
                products.forEach((product, index) => {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }

                    x = 50;
                    const rowData = [
                        product.sku,
                        product.name.substring(0, 30),
                        product.category?.name || 'N/A',
                        product.stock.quantity,
                        `$${product.price.cost.toFixed(2)}`,
                        `$${product.price.selling.toFixed(2)}`,
                        `$${product.stockValue.toFixed(2)}`,
                    ];

                    rowData.forEach((data, i) => {
                        doc.text(String(data), x, y, { width: columnWidths[i], align: 'left' });
                        x += columnWidths[i];
                    });

                    y += 20;
                });

                doc.end();

                stream.on('finish', () => {
                    resolve(path.join('temp', filename));
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static async generateOrderReport(order, filename = 'order-report.pdf') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(path.join('temp', filename));
                doc.pipe(stream);

                // Header
                doc.fontSize(20).text('Order Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Order #: ${order.orderNumber}`, { align: 'center' });
                doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'center' });
                doc.moveDown();

                // Customer/Supplier info
                doc.fontSize(12);
                doc.text(`Order Type: ${order.orderType.toUpperCase()}`);
                if (order.supplier) {
                    doc.text(`Supplier: ${order.supplier.name}`);
                }
                if (order.customer) {
                    doc.text(`Customer: ${order.customer.name}`);
                }
                doc.text(`Status: ${order.status}`);
                doc.text(`Payment Status: ${order.paymentStatus}`);
                doc.moveDown();

                // Items
                doc.fontSize(14).text('Order Items', { underline: true });
                doc.moveDown();

                const tableTop = doc.y;
                const headers = ['#', 'Product', 'Qty', 'Unit Price', 'Discount', 'Total'];
                const columnWidths = [30, 200, 50, 70, 60, 80];
                let x = 50;

                doc.font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    doc.text(header, x, tableTop, { width: columnWidths[i], align: 'left' });
                    x += columnWidths[i];
                });

                doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

                doc.font('Helvetica');
                let y = tableTop + 30;

                order.items.forEach((item, index) => {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }

                    x = 50;
                    const rowData = [
                        index + 1,
                        item.product?.name || 'Unknown Product',
                        item.quantity,
                        `$${item.unitPrice.toFixed(2)}`,
                        `$${item.discount.toFixed(2)}`,
                        `$${item.total.toFixed(2)}`,
                    ];

                    rowData.forEach((data, i) => {
                        doc.text(String(data), x, y, { width: columnWidths[i], align: 'left' });
                        x += columnWidths[i];
                    });

                    y += 20;
                });

                // Summary
                y += 20;
                doc.moveTo(50, y).lineTo(550, y).stroke();
                y += 10;
                
                const summaryX = 400;
                const summaryItems = [
                    ['Subtotal:', `$${order.subtotal.toFixed(2)}`],
                    ['Tax:', `$${order.tax.toFixed(2)}`],
                    ['Discount:', `-$${order.discount.toFixed(2)}`],
                    ['Shipping:', `$${order.shippingCost.toFixed(2)}`],
                    ['Total:', `$${order.total.toFixed(2)}`],
                ];

                summaryItems.forEach(([label, value]) => {
                    doc.font('Helvetica-Bold').text(label, summaryX, y);
                    doc.font('Helvetica').text(value, summaryX + 100, y);
                    y += 20;
                });

                doc.end();

                stream.on('finish', () => {
                    resolve(path.join('temp', filename));
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;