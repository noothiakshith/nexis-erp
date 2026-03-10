import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  employees,
  invoices,
  expenses,
  products,
  customers,
  leads,
  projects,
  tasks,
  purchaseOrders,
  alerts,
  analyticsData,
  anomalies,
  documents,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "department"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== EMPLOYEE QUERIES ====================
export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(employees)
    .where(eq(employees.status, "active"));
}

// ==================== FINANCE QUERIES ====================
export async function getInvoicesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.createdBy, userId));
}

export async function getExpensesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(expenses)
    .where(eq(expenses.submittedBy, userId));
}

// ==================== INVENTORY QUERIES ====================
export async function getProductsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(eq(products.status, status as any));
}

export async function getLowStockProducts(reorderThreshold: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(sql`quantity <= reorderPoint`);
}

// ==================== CRM QUERIES ====================
export async function getCustomersByType(customerType: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(customers)
    .where(eq(customers.customerType, customerType as any));
}

export async function getLeadsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leads).where(eq(leads.status, status as any));
}

// ==================== PROJECT QUERIES ====================
export async function getProjectsByManager(managerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(projects)
    .where(eq(projects.manager, managerId));
}

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

// ==================== PROCUREMENT QUERIES ====================
export async function getPurchaseOrdersBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId));
}

// ==================== ALERTS QUERIES ====================
export async function getAlertsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(sql`createdAt DESC`);
}

export async function getUnreadAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.status, "unread")));
}

// ==================== ANALYTICS QUERIES ====================
export async function getAnalyticsDataByModule(module: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(analyticsData)
    .where(eq(analyticsData.module, module));
}

export async function getAnomaliesByModule(module: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(anomalies)
    .where(eq(anomalies.module, module));
}

// ==================== DOCUMENT QUERIES ====================
export async function getDocumentsByModule(
  module: string,
  relatedId?: number
) {
  const db = await getDb();
  if (!db) return [];
  if (relatedId) {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.relatedModule, module),
          eq(documents.relatedId, relatedId)
        )
      );
  }
  return await db
    .select()
    .from(documents)
    .where(eq(documents.relatedModule, module));
}
