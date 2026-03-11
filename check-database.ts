/**
 * Quick Database Connection Test
 * Run: npx tsx check-database.ts
 */

import { getDb } from './server/db';

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');
  
  console.log('📋 Environment Variables:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL || '❌ NOT SET'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}\n`);
  
  console.log('🔌 Attempting to connect...');
  const db = await getDb();
  
  if (!db) {
    console.log('❌ Database connection FAILED\n');
    console.log('💡 Troubleshooting:');
    console.log('   1. Is MySQL running?');
    console.log('      macOS: brew services start mysql');
    console.log('      Linux: sudo systemctl start mysql');
    console.log('      Docker: docker run --name nexis-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=nexis_erp -e MYSQL_USER=user -e MYSQL_PASSWORD=user_password -p 3306:3306 -d mysql:8.0\n');
    console.log('   2. Check DATABASE_URL in .env file');
    console.log('   3. Test manually: mysql -u user -puser_password\n');
    process.exit(1);
  }
  
  console.log('✅ Database connection SUCCESSFUL!\n');
  
  try {
    // Try a simple query
    console.log('🧪 Testing query execution...');
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Query execution successful!\n');
    
    console.log('🎉 Database is ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx tsx server/seedInventoryData.ts');
    console.log('   2. Open your ERP application');
    console.log('   3. Go to Inventory → ML Intelligence tab');
    console.log('   4. See the predictions! 🚀\n');
    
  } catch (error: any) {
    console.log('❌ Query execution failed:', error.message);
    console.log('\n💡 The database might exist but tables are missing.');
    console.log('   Run migrations first if needed.\n');
  }
  
  process.exit(0);
}

checkDatabase().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
