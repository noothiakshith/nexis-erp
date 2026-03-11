# Database Setup Guide - Quick Fix

## Problem
"Database not available" error when running seeders.

## Solution

### Option 1: Start MySQL (Recommended)

#### On macOS:
```bash
# If installed via Homebrew
brew services start mysql

# Or manually
mysql.server start

# Check if running
mysql -u user -p
# Enter password: user_password
```

#### On Linux:
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

#### On Windows:
```bash
# Open Services and start MySQL service
# Or use MySQL Workbench
```

### Option 2: Use Docker (Quick Alternative)

```bash
# Start MySQL in Docker
docker run --name nexis-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=nexis_erp \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=user_password \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 10 seconds for MySQL to start
sleep 10

# Test connection
docker exec -it nexis-mysql mysql -u user -p
# Enter password: user_password
```

### Option 3: Update DATABASE_URL

If your MySQL is running on different credentials:

1. Open `.env` file
2. Update `DATABASE_URL`:
```
DATABASE_URL=mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/YOUR_DATABASE
```

## Verify Database Connection

```bash
# Test MySQL connection
mysql -u user -puser_password -e "SHOW DATABASES;"

# Should show nexis_erp database
```

## Run Seeder Again

Once MySQL is running:

```bash
npx tsx server/seedInventoryData.ts
```

You should see:
```
🌱 Starting inventory data seeding...
📡 Checking database connection...
✅ Database connection successful!
```

## Common Issues

### Issue 1: "Access denied for user"
**Solution**: Check username/password in DATABASE_URL

### Issue 2: "Unknown database 'nexis_erp'"
**Solution**: Create the database:
```bash
mysql -u user -puser_password -e "CREATE DATABASE nexis_erp;"
```

### Issue 3: "Can't connect to MySQL server"
**Solution**: MySQL is not running. Start it using Option 1 or 2 above.

### Issue 4: Port 3306 already in use
**Solution**: Another MySQL instance is running. Stop it or use different port.

## Quick Test Script

Save this as `test-db.js`:
```javascript
import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    const connection = await mysql.createConnection(
      'mysql://user:user_password@localhost:3306/nexis_erp'
    );
    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run: `node test-db.js`

## Alternative: Use Existing Data

If you can't get MySQL running right now, you can:

1. Use the UI to manually add products
2. Add stock movements via the Inventory page
3. The ML will work once you have 7+ days of data

But the seeder is much faster! 🚀
