import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import "dotenv/config";

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not defined");

    const connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection, { schema, mode: 'default' });

    // Get the user we just created
    const userList = await db.select().from(schema.users).limit(1);
    const user = userList[0];
    if (!user) {
        console.error("No user found. Please run seed.ts first.");
        return;
    }

    console.log(`Seeding data for user: ${user.name} (${user.id})`);

    // Seed Invoices (Revenue)
    const invoiceData = [
        {
            invoiceNumber: "INV-001",
            amount: "5000.00",
            tax: "500.00",
            totalAmount: "5500.00",
            status: "paid" as const,
            issueDate: new Date(),
            dueDate: new Date(),
            createdBy: user.id,
        },
        {
            invoiceNumber: "INV-002",
            amount: "3000.00",
            tax: "300.00",
            totalAmount: "3300.00",
            status: "paid" as const,
            issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last month
            dueDate: new Date(),
            createdBy: user.id,
        }
    ];

    for (const inv of invoiceData) {
        await db.insert(schema.invoices).values(inv).onDuplicateKeyUpdate({ set: { status: "paid" } });
    }

    // Seed Expenses
    const expenseData = [
        {
            description: "Cloud Hosting",
            category: "IT",
            amount: "1200.00",
            expenseDate: new Date(),
            status: "approved" as const,
            submittedBy: user.id,
        },
        {
            description: "Office Supplies",
            category: "Operations",
            amount: "450.00",
            expenseDate: new Date(),
            status: "approved" as const,
            submittedBy: user.id,
        }
    ];

    for (const exp of expenseData) {
        await db.insert(schema.expenses).values(exp);
    }

    // Seed Products/Inventory
    const productData = [
        {
            sku: "PROD-A",
            name: "Laptop Pro",
            category: "Electronics",
            unitPrice: "1500.00",
            currentStock: 10,
            reorderPoint: 5,
            reorderQuantity: 20,
        }
    ];

    for (const prod of productData) {
        await db.insert(schema.products).values(prod).onDuplicateKeyUpdate({ set: { currentStock: 10 } });
    }

    console.log("ERP Data Seed finished!");
    await connection.end();
}

main().catch(console.error);
