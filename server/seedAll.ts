/**
 * Combined Data Seeder
 * Seeds both inventory and financial data for ML training
 */

import { getDb } from './db';
import { products, stockMovements, suppliers, invoices, expenses, payments } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function seedAll() {
    console.log('🚀 Starting full system data seeding...\n');

    const db = await getDb();
    if (!db) {
        console.error('❌ Database not available!');
        process.exit(1);
    }

    try {
        // Clear existing data (Delete in correct order)
        console.log('🧹 Clearing existing data...');
        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
        await db.delete(stockMovements);
        await db.delete(products);
        await db.delete(suppliers);
        await db.delete(invoices);
        await db.delete(expenses);
        await db.delete(payments);
        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
        console.log('✅ Tables cleared\n');

        // 1. SEED INVENTORY DATA
        console.log('📦 Seeding inventory data...');

        // Create suppliers
        const supplierData = [
            { name: 'TechSupply Co', email: 'contact@techsupply.com', phone: '555-0101', city: 'San Francisco', country: 'USA', paymentTerms: 'Net 30', rating: '4.5' },
            { name: 'Global Electronics', email: 'sales@globalelec.com', phone: '555-0102', city: 'New York', country: 'USA', paymentTerms: 'Net 45', rating: '4.2' },
            { name: 'Office Essentials', email: 'info@officeess.com', phone: '555-0103', city: 'Chicago', country: 'USA', paymentTerms: 'Net 30', rating: '4.7' },
        ];

        await db.insert(suppliers).values(supplierData);
        const dbSuppliers = await db.select().from(suppliers);
        console.log(`✅ Created ${dbSuppliers.length} suppliers`);

        // Create products
        const productData = [
            { sku: 'LAPTOP-001', name: 'Business Laptop Pro', category: 'Electronics', description: 'High-performance laptop', unitPrice: '1299.99', currentStock: 45, reorderPoint: 20, reorderQuantity: 30, supplierId: dbSuppliers[0].id },
            { sku: 'MOUSE-001', name: 'Wireless Mouse', category: 'Electronics', description: 'Ergonomic wireless mouse', unitPrice: '29.99', currentStock: 150, reorderPoint: 50, reorderQuantity: 100, supplierId: dbSuppliers[0].id },
            { sku: 'KEYBOARD-001', name: 'Mechanical Keyboard', category: 'Electronics', description: 'RGB mechanical keyboard', unitPrice: '89.99', currentStock: 80, reorderPoint: 30, reorderQuantity: 50, supplierId: dbSuppliers[0].id },
            { sku: 'MONITOR-001', name: '27" 4K Monitor', category: 'Electronics', description: '4K UHD monitor', unitPrice: '399.99', currentStock: 25, reorderPoint: 10, reorderQuantity: 20, supplierId: dbSuppliers[1].id },
            { sku: 'DESK-001', name: 'Standing Desk', category: 'Furniture', description: 'Adjustable standing desk', unitPrice: '599.99', currentStock: 15, reorderPoint: 5, reorderQuantity: 10, supplierId: dbSuppliers[2].id },
            { sku: 'CHAIR-001', name: 'Ergonomic Office Chair', category: 'Furniture', description: 'Premium office chair', unitPrice: '449.99', currentStock: 20, reorderPoint: 8, reorderQuantity: 15, supplierId: dbSuppliers[2].id },
            { sku: 'CABLE-001', name: 'USB-C Cable 6ft', category: 'Accessories', description: 'USB-C charging cable', unitPrice: '12.99', currentStock: 200, reorderPoint: 50, reorderQuantity: 100, supplierId: dbSuppliers[0].id },
            { sku: 'ADAPTER-001', name: 'HDMI Adapter', category: 'Accessories', description: 'HDMI to USB-C adapter', unitPrice: '19.99', currentStock: 100, reorderPoint: 30, reorderQuantity: 50, supplierId: dbSuppliers[1].id },
            { sku: 'NOTEPAD-001', name: 'Premium Notepad', category: 'Stationery', description: 'Leather-bound notepad', unitPrice: '24.99', currentStock: 50, reorderPoint: 15, reorderQuantity: 30, supplierId: dbSuppliers[2].id },
            { sku: 'PEN-001', name: 'Executive Pen Set', category: 'Stationery', description: 'Premium pen set', unitPrice: '34.99', currentStock: 40, reorderPoint: 10, reorderQuantity: 20, supplierId: dbSuppliers[2].id },
        ];

        await db.insert(products).values(productData);
        const dbProducts = await db.select().from(products);
        console.log(`✅ Created ${dbProducts.length} products`);

        // Generate stock movements
        const movements = [];
        const today = new Date();

        for (const product of dbProducts) {
            // Fast/Medium/Slow logic based on SKU groups
            let movementsPerDay = 0;
            if (['LAPTOP-001', 'MOUSE-001', 'KEYBOARD-001'].includes(product.sku)) movementsPerDay = 4;
            else if (['MONITOR-001', 'DESK-001', 'CHAIR-001'].includes(product.sku)) movementsPerDay = 1.5;
            else movementsPerDay = 0.5;

            for (let day = 30; day >= 0; day--) {
                const date = new Date(today);
                date.setDate(date.getDate() - day);
                const numMovements = Math.floor(movementsPerDay + Math.random());

                for (let m = 0; m < numMovements; m++) {
                    const isOutbound = Math.random() < 0.7;
                    let quantity = isOutbound ? Math.floor(1 + Math.random() * 5) : Math.floor(5 + Math.random() * 15);

                    movements.push({
                        productId: product.id,
                        movementType: (isOutbound ? 'out' : 'in') as 'out' | 'in',
                        quantity,
                        reference: `${isOutbound ? 'SALE' : 'PO'}-${day}-${m}`,
                        notes: isOutbound ? 'Customer order' : 'Restock',
                        createdAt: date
                    });
                }
            }
        }

        console.log(`📊 Inserting ${movements.length} stock movements...`);
        const batchSize = 100;
        for (let i = 0; i < movements.length; i += batchSize) {
            await db.insert(stockMovements).values(movements.slice(i, i + batchSize));
        }
        console.log('✅ Stock movements created\n');

        // 2. SEED FINANCIAL DATA
        console.log('💰 Seeding financial data...');
        const invoicesData = [];
        const expensesData = [];

        for (let i = 30; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Invoices
            const invCount = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < invCount; j++) {
                const amount = Math.round((1000 + Math.random() * 9000) * 100) / 100;
                invoicesData.push({
                    invoiceNumber: `INV-${date.getTime()}-${j}`,
                    customerId: Math.floor(Math.random() * 5) + 1,
                    issueDate: date,
                    dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                    amount: amount.toString(),
                    totalAmount: amount.toString(),
                    status: Math.random() > 0.3 ? ('paid' as const) : ('sent' as const),
                    description: 'Software Services',
                    createdAt: date,
                    updatedAt: date
                });
            }

            // Expenses
            const expCount = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < expCount; j++) {
                const cats = ['office-supplies', 'travel', 'meals', 'software', 'utilities', 'marketing'];
                const cat = cats[Math.floor(Math.random() * cats.length)];
                const amount = Math.round((50 + Math.random() * 500) * 100) / 100;
                expensesData.push({
                    description: `${cat} expense`,
                    amount: amount.toString(),
                    category: cat,
                    expenseDate: date,
                    status: Math.random() > 0.2 ? ('approved' as const) : ('draft' as const),
                    createdAt: date,
                    updatedAt: date
                });
            }
        }

        await db.insert(invoices).values(invoicesData);
        await db.insert(expenses).values(expensesData);
        console.log(`✅ ${invoicesData.length} invoices and ${expensesData.length} expenses created\n`);

        // 3. SEED PAYMENTS (for Fraud ML)
        console.log('💳 Seeding payments...');
        const paymentsData = [];
        for (let i = 0; i < 150; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - Math.floor(Math.random() * 31));
            const amount = Math.round((100 + Math.random() * 1000) * 100) / 100;
            paymentsData.push({
                reference: `PAY-${date.getTime()}-${i}`,
                type: Math.random() > 0.5 ? ('incoming' as const) : ('outgoing' as const),
                amount: amount.toString(),
                method: ['bank_transfer', 'credit_card', 'cash'][Math.floor(Math.random() * 3)] as any,
                status: 'completed' as const,
                paymentDate: date,
                description: 'Regular payment',
                createdAt: date,
                updatedAt: date
            });
        }
        await db.insert(payments).values(paymentsData);
        console.log(`✅ ${paymentsData.length} payments created\n`);

        console.log('🎉 Full system seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAll();
