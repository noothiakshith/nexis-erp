/**
 * Inventory Data Seeder
 * Generates sample inventory data for ML testing
 */

import { getDb } from './db';
import { products, stockMovements, suppliers } from '../drizzle/schema';

async function seedInventoryData() {
  console.log('🌱 Starting inventory data seeding...');
  
  // Check database connection
  console.log('📡 Checking database connection...');
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available!');
    console.error('\n💡 Troubleshooting steps:');
    console.error('1. Make sure your MySQL server is running');
    console.error('2. Check DATABASE_URL in .env file');
    console.error('3. Verify database credentials');
    console.error('4. Run: mysql -u user -p (to test connection)');
    console.error('\nCurrent DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful!');

  try {
    console.log('🌱 Seeding inventory data...');

    // Create suppliers first
    const supplierData = [
      { name: 'TechSupply Co', email: 'contact@techsupply.com', phone: '555-0101', city: 'San Francisco', country: 'USA', paymentTerms: 'Net 30', rating: '4.5' },
      { name: 'Global Electronics', email: 'sales@globalelec.com', phone: '555-0102', city: 'New York', country: 'USA', paymentTerms: 'Net 45', rating: '4.2' },
      { name: 'Office Essentials', email: 'info@officeess.com', phone: '555-0103', city: 'Chicago', country: 'USA', paymentTerms: 'Net 30', rating: '4.7' },
    ];

    const insertedSuppliers = await db.insert(suppliers).values(supplierData).$returningId();
    console.log(`✅ Created ${insertedSuppliers.length} suppliers`);

    // Create products
    const productData = [
      // Fast movers (high revenue, high turnover)
      { sku: 'LAPTOP-001', name: 'Business Laptop Pro', category: 'Electronics', description: 'High-performance laptop', unitPrice: '1299.99', currentStock: 45, reorderPoint: 20, reorderQuantity: 30, supplierId: insertedSuppliers[0].id },
      { sku: 'MOUSE-001', name: 'Wireless Mouse', category: 'Electronics', description: 'Ergonomic wireless mouse', unitPrice: '29.99', currentStock: 150, reorderPoint: 50, reorderQuantity: 100, supplierId: insertedSuppliers[0].id },
      { sku: 'KEYBOARD-001', name: 'Mechanical Keyboard', category: 'Electronics', description: 'RGB mechanical keyboard', unitPrice: '89.99', currentStock: 80, reorderPoint: 30, reorderQuantity: 50, supplierId: insertedSuppliers[0].id },
      
      // Medium movers
      { sku: 'MONITOR-001', name: '27" 4K Monitor', category: 'Electronics', description: '4K UHD monitor', unitPrice: '399.99', currentStock: 25, reorderPoint: 10, reorderQuantity: 20, supplierId: insertedSuppliers[1].id },
      { sku: 'DESK-001', name: 'Standing Desk', category: 'Furniture', description: 'Adjustable standing desk', unitPrice: '599.99', currentStock: 15, reorderPoint: 5, reorderQuantity: 10, supplierId: insertedSuppliers[2].id },
      { sku: 'CHAIR-001', name: 'Ergonomic Office Chair', category: 'Furniture', description: 'Premium office chair', unitPrice: '449.99', currentStock: 20, reorderPoint: 8, reorderQuantity: 15, supplierId: insertedSuppliers[2].id },
      
      // Slow movers (low revenue, low turnover)
      { sku: 'CABLE-001', name: 'USB-C Cable 6ft', category: 'Accessories', description: 'USB-C charging cable', unitPrice: '12.99', currentStock: 200, reorderPoint: 50, reorderQuantity: 100, supplierId: insertedSuppliers[0].id },
      { sku: 'ADAPTER-001', name: 'HDMI Adapter', category: 'Accessories', description: 'HDMI to USB-C adapter', unitPrice: '19.99', currentStock: 100, reorderPoint: 30, reorderQuantity: 50, supplierId: insertedSuppliers[1].id },
      { sku: 'NOTEPAD-001', name: 'Premium Notepad', category: 'Stationery', description: 'Leather-bound notepad', unitPrice: '24.99', currentStock: 50, reorderPoint: 15, reorderQuantity: 30, supplierId: insertedSuppliers[2].id },
      { sku: 'PEN-001', name: 'Executive Pen Set', category: 'Stationery', description: 'Premium pen set', unitPrice: '34.99', currentStock: 40, reorderPoint: 10, reorderQuantity: 20, supplierId: insertedSuppliers[2].id },
    ];

    const insertedProducts = await db.insert(products).values(productData).$returningId();
    console.log(`✅ Created ${insertedProducts.length} products`);

    // Generate stock movements for the last 30 days
    console.log('📦 Generating stock movements...');
    const movements = [];
    const today = new Date();
    
    for (let i = 0; i < insertedProducts.length; i++) {
      const productId = insertedProducts[i].id;
      const product = productData[i];
      
      // Determine movement frequency based on product type
      let movementsPerDay = 0;
      if (i < 3) {
        // Fast movers: 3-5 movements per day
        movementsPerDay = 3 + Math.random() * 2;
      } else if (i < 6) {
        // Medium movers: 1-2 movements per day
        movementsPerDay = 1 + Math.random();
      } else {
        // Slow movers: 0.3-0.7 movements per day
        movementsPerDay = 0.3 + Math.random() * 0.4;
      }

      // Generate movements for last 30 days
      for (let day = 30; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        
        // Random number of movements for this day
        const numMovements = Math.floor(movementsPerDay + Math.random());
        
        for (let m = 0; m < numMovements; m++) {
          // 70% outbound (sales), 30% inbound (restocking)
          const isOutbound = Math.random() < 0.7;
          
          // Quantity varies by product type
          let quantity = 0;
          if (i < 3) {
            // Fast movers: larger quantities
            quantity = isOutbound ? Math.floor(2 + Math.random() * 5) : Math.floor(10 + Math.random() * 20);
          } else if (i < 6) {
            // Medium movers: medium quantities
            quantity = isOutbound ? Math.floor(1 + Math.random() * 3) : Math.floor(5 + Math.random() * 10);
          } else {
            // Slow movers: small quantities
            quantity = isOutbound ? Math.floor(1 + Math.random() * 2) : Math.floor(3 + Math.random() * 7);
          }

          movements.push({
            productId,
            movementType: (isOutbound ? 'out' : 'in') as 'out' | 'in',
            quantity,
            reference: `${isOutbound ? 'SALE' : 'PO'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notes: isOutbound ? 'Customer order' : 'Supplier delivery',
            createdAt: date
          });
        }
      }
    }

    // Insert movements in batches
    console.log(`📊 Inserting ${movements.length} stock movements...`);
    const batchSize = 100;
    for (let i = 0; i < movements.length; i += batchSize) {
      const batch = movements.slice(i, i + batchSize);
      await db.insert(stockMovements).values(batch);
      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, movements.length)}/${movements.length}`);
    }
    console.log('\n✅ Stock movements created');
    
    console.log('\n🎉 Inventory data seeding complete!');
    console.log('\n📊 Data Summary:');
    console.log(`   - Suppliers: ${insertedSuppliers.length}`);
    console.log(`   - Products: ${insertedProducts.length}`);
    console.log(`     • Fast Movers: 3 (Laptop, Mouse, Keyboard)`);
    console.log(`     • Medium Movers: 3 (Monitor, Desk, Chair)`);
    console.log(`     • Slow Movers: 4 (Cables, Adapters, Stationery)`);
    console.log(`   - Stock Movements: ${movements.length} (30 days history)`);
    console.log('\n✅ Ready for ML testing!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Open your ERP application');
    console.log('   2. Go to Inventory page');
    console.log('   3. Click "ML Intelligence" tab');
    console.log('   4. See the predictions! 🎊');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    console.error('\n💡 This might be a database issue. Check:');
    console.error('   1. Is MySQL running?');
    console.error('   2. Does the database exist?');
    console.error('   3. Are the credentials correct?');
    process.exit(1);
  }
}

// Run seeder
seedInventoryData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
