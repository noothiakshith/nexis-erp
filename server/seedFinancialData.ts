/**
 * Seed Financial Data for ML Algorithms
 * Adds realistic invoices and expenses for the past 30 days
 */

import { getDb } from './db';
import { invoices, expenses } from '../drizzle/schema';

async function seedFinancialData() {
  console.log('🌱 Seeding financial data for ML algorithms...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  const today = new Date();
  const invoicesData = [];
  const expensesData = [];

  // Generate 30 days of realistic financial data
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate 1-3 invoices per day
    const invoiceCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < invoiceCount; j++) {
      const baseAmount = 1000 + Math.random() * 9000; // $1k - $10k
      const amount = Math.round(baseAmount * 100) / 100;

      invoicesData.push({
        invoiceNumber: `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${j + 1}`,
        customerId: Math.floor(Math.random() * 5) + 1,
        issueDate: date,
        dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days later
        amount: amount.toString(),
        totalAmount: amount.toString(),
        status: Math.random() > 0.3 ? 'paid' : 'pending',
        description: 'Professional Services',
        notes: 'Generated for ML training',
        createdAt: date,
        updatedAt: date
      } as any);
    }

    // Generate 2-5 expenses per day
    const expenseCount = Math.floor(Math.random() * 4) + 2;
    for (let j = 0; j < expenseCount; j++) {
      const categories = ['office-supplies', 'travel', 'meals', 'software', 'utilities', 'marketing'];
      const category = categories[Math.floor(Math.random() * categories.length)];

      let baseAmount;
      switch (category) {
        case 'office-supplies':
          baseAmount = 50 + Math.random() * 200;
          break;
        case 'travel':
          baseAmount = 200 + Math.random() * 800;
          break;
        case 'meals':
          baseAmount = 20 + Math.random() * 100;
          break;
        case 'software':
          baseAmount = 50 + Math.random() * 500;
          break;
        case 'utilities':
          baseAmount = 100 + Math.random() * 400;
          break;
        case 'marketing':
          baseAmount = 200 + Math.random() * 1000;
          break;
        default:
          baseAmount = 50 + Math.random() * 300;
      }

      const amount = Math.round(baseAmount * 100) / 100;

      expensesData.push({
        description: `${category.replace('-', ' ')} expense`,
        amount: amount.toString(),
        category: category,
        expenseDate: date,
        status: Math.random() > 0.2 ? 'approved' : 'pending',
        createdAt: date,
        updatedAt: date
      } as any);
    }
  }

  try {
    // Insert invoices
    console.log(`📄 Inserting ${invoicesData.length} invoices...`);
    for (const invoice of invoicesData) {
      await db.insert(invoices).values(invoice);
    }
    console.log(`✅ Invoices inserted successfully\n`);

    // Insert expenses
    console.log(`💰 Inserting ${expensesData.length} expenses...`);
    for (const expense of expensesData) {
      await db.insert(expenses).values(expense);
    }
    console.log(`✅ Expenses inserted successfully\n`);

    // Calculate totals
    const totalRevenue = invoicesData.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const netCashFlow = totalRevenue - totalExpenses;

    console.log('📊 Summary:');
    console.log(`   Total Invoices: ${invoicesData.length}`);
    console.log(`   Total Expenses: ${expensesData.length}`);
    console.log(`   Total Revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`   Total Expenses: $${totalExpenses.toLocaleString()}`);
    console.log(`   Net Cash Flow: $${netCashFlow.toLocaleString()}\n`);

    console.log('🎉 Financial data seeded successfully!');
    console.log('   ML algorithms now have sufficient data to generate predictions.\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeder
seedFinancialData();
