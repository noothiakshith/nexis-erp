import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import "dotenv/config";

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not defined");

    const connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection, { schema, mode: 'default' });

    // Add a sample user
    await db.insert(schema.users).values({
        openId: "1014767258314-d5b0gv01p88o9s7d4t7rfhmpo4b1bt1n.apps.googleusercontent.com",
        name: "Akshith Noothi",
        email: "akshith@example.com",
        role: "admin",
    }).onDuplicateKeyUpdate({ set: { name: "Akshith Noothi" } });

    console.log("Seed finished!");
    await connection.end();
}

main().catch(console.error);
