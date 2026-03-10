import { getDb } from "./db";
import {
  invoices,
  expenses,
  budgets,
  employees,
  payroll,
  attendance,
  products,
  inventory,
  customers,
  leads,
  projects,
  tasks,
  purchaseOrders,
} from "../drizzle/schema";
import { eq, gte, lte, and, sum, count, desc } from "drizzle-orm";

/**
 * Dashboard data aggregation helpers
 * Provides real-time metrics for all ERP modules
 */

// ==================== FINANCIAL METRICS ====================

export async function getFinancialMetrics(timeframe: "month" | "quarter" | "year" = "month") {
  const db = await getDb();
  if (!db) return null;

  try {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === "quarter") {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Total revenue from invoices
    const revenueResult = await db
      .select({
        total: sum(invoices.totalAmount),
        count: count(),
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, now),
          eq(invoices.status, "paid")
        )
      );

    // Total expenses
    const expensesResult = await db
      .select({
        total: sum(expenses.amount),
        count: count(),
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.createdAt, startDate),
          lte(expenses.createdAt, now),
          eq(expenses.status, "approved")
        )
      );

    // Budget utilization
    const budgetResult = await db
      .select({
        total: sum(budgets.budgetAmount),
        spent: sum(budgets.spentAmount),
      })
      .from(budgets)
      .where(eq(budgets.status, "active"));

    const revenue = parseFloat(revenueResult[0]?.total || "0");
    const totalExpenses = parseFloat(expensesResult[0]?.total || "0");
    const totalBudget = parseFloat(budgetResult[0]?.total || "0");
    const budgetSpent = parseFloat(budgetResult[0]?.spent || "0");

    return {
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      profitMargin: revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0,
      budgetUtilization: totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0,
      invoiceCount: revenueResult[0]?.count || 0,
      expenseCount: expensesResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching financial metrics:", error);
    return null;
  }
}

export async function getRevenueByMonth(months: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        month: invoices.issueDate,
        revenue: sum(invoices.totalAmount),
      })
      .from(invoices)
      .where(eq(invoices.status, "paid"))
      .groupBy(invoices.issueDate)
      .orderBy(desc(invoices.issueDate))
      .limit(months);

    return result.map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue: parseFloat(item.revenue || "0"),
    }));
  } catch (error) {
    console.error("Error fetching revenue by month:", error);
    return [];
  }
}

export async function getExpenseBreakdown() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
        count: count(),
      })
      .from(expenses)
      .where(eq(expenses.status, "approved"))
      .groupBy(expenses.category);

    return result.map((item) => ({
      category: item.category,
      amount: parseFloat(item.total || "0"),
      count: item.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching expense breakdown:", error);
    return [];
  }
}

// ==================== INVENTORY METRICS ====================

export async function getInventoryMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total inventory value
    const inventoryValue = await db
      .select({
        total: sum(inventory.quantity),
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id));

    // Low stock products
    const lowStockResult = await db
      .select({
        id: products.id,
        name: products.name,
        currentStock: products.currentStock,
        reorderPoint: products.reorderPoint,
      })
      .from(products)
      .where(lte(products.currentStock, products.reorderPoint));

    // Total products
    const productCount = await db.select({ count: count() }).from(products);

    return {
      totalInventoryValue: parseFloat(inventoryValue[0]?.total || "0"),
      lowStockCount: lowStockResult.length,
      lowStockProducts: lowStockResult,
      totalProducts: productCount[0]?.count || 0,
      reorderAlerts: lowStockResult.length,
    };
  } catch (error) {
    console.error("Error fetching inventory metrics:", error);
    return null;
  }
}

export async function getStockLevelsByCategory() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        category: products.category,
        totalStock: sum(inventory.quantity),
        productCount: count(products.id),
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .groupBy(products.category);

    return result.map((item) => ({
      category: item.category,
      stock: parseFloat(item.totalStock || "0"),
      products: item.productCount || 0,
    }));
  } catch (error) {
    console.error("Error fetching stock levels by category:", error);
    return [];
  }
}

// ==================== HR METRICS ====================

export async function getHRMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total active employees
    const employeeCount = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, "active"));

    // Total payroll for current month
    const payrollResult = await db
      .select({
        total: sum(payroll.netSalary),
      })
      .from(payroll)
      .where(eq(payroll.status, "paid"));

    // Attendance rate
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendanceResult = await db
      .select({
        present: count(),
      })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, monthStart),
          lte(attendance.date, now),
          eq(attendance.status, "present")
        )
      );

    // Department breakdown
    const departmentResult = await db
      .select({
        department: employees.department,
        count: count(),
      })
      .from(employees)
      .where(eq(employees.status, "active"))
      .groupBy(employees.department);

    return {
      totalEmployees: employeeCount[0]?.count || 0,
      monthlyPayroll: parseFloat(payrollResult[0]?.total || "0"),
      attendancePresent: attendanceResult[0]?.present || 0,
      departments: departmentResult.map((item) => ({
        name: item.department,
        count: item.count || 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching HR metrics:", error);
    return null;
  }
}

export async function getEmployeeByDepartment() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        department: employees.department,
        count: count(),
        avgSalary: sum(employees.salary),
      })
      .from(employees)
      .where(eq(employees.status, "active"))
      .groupBy(employees.department);

    return result.map((item) => ({
      department: item.department,
      employees: item.count || 0,
      avgSalary: item.avgSalary ? parseFloat(item.avgSalary) / (item.count || 1) : 0,
    }));
  } catch (error) {
    console.error("Error fetching employees by department:", error);
    return [];
  }
}

// ==================== SALES METRICS ====================

export async function getSalesMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total customers
    const customerCount = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "active"));

    // Sales pipeline value
    const pipelineValue = await db
      .select({
        total: sum(leads.value),
      })
      .from(leads)
      .where(eq(leads.status, "proposal"));

    // Lead conversion rate
    const totalLeads = await db.select({ count: count() }).from(leads);
    const wonLeads = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.status, "won"));

    // Average deal size
    const avgDealSize = await db
      .select({
        avg: sum(invoices.totalAmount),
        count: count(),
      })
      .from(invoices)
      .where(eq(invoices.status, "paid"));

    return {
      totalCustomers: customerCount[0]?.count || 0,
      pipelineValue: parseFloat(pipelineValue[0]?.total || "0"),
      totalLeads: totalLeads[0]?.count || 0,
      wonLeads: wonLeads[0]?.count || 0,
      conversionRate:
        (totalLeads[0]?.count || 0) > 0
          ? ((wonLeads[0]?.count || 0) / (totalLeads[0]?.count || 1)) * 100
          : 0,
      avgDealSize:
        (avgDealSize[0]?.count || 0) > 0
          ? parseFloat(avgDealSize[0]?.avg || "0") / (avgDealSize[0]?.count || 1)
          : 0,
    };
  } catch (error) {
    console.error("Error fetching sales metrics:", error);
    return null;
  }
}

export async function getLeadsByStage() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        status: leads.status,
        count: count(),
        totalValue: sum(leads.value),
      })
      .from(leads)
      .groupBy(leads.status);

    return result.map((item) => ({
      stage: item.status,
      count: item.count || 0,
      value: parseFloat(item.totalValue || "0"),
    }));
  } catch (error) {
    console.error("Error fetching leads by stage:", error);
    return [];
  }
}

// ==================== PROJECT METRICS ====================

export async function getProjectMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total projects
    const projectCount = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, "active"));

    // Total project budget
    const budgetResult = await db
      .select({
        total: sum(projects.budget),
      })
      .from(projects)
      .where(eq(projects.status, "active"));

    // Tasks by status
    const tasksByStatus = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.status);

    return {
      activeProjects: projectCount[0]?.count || 0,
      totalBudget: parseFloat(budgetResult[0]?.total || "0"),
      tasksByStatus: tasksByStatus.map((item) => ({
        status: item.status,
        count: item.count || 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching project metrics:", error);
    return null;
  }
}

// ==================== PROCUREMENT METRICS ====================

export async function getProcurementMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total purchase orders
    const poCount = await db
      .select({ count: count() })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "approved"));

    // Total PO value
    const poValue = await db
      .select({
        total: sum(purchaseOrders.totalAmount),
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "approved"));

    // Pending approvals
    const pendingPOs = await db
      .select({ count: count() })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "pending_approval"));

    return {
      approvedOrders: poCount[0]?.count || 0,
      totalValue: parseFloat(poValue[0]?.total || "0"),
      pendingApprovals: pendingPOs[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching procurement metrics:", error);
    return null;
  }
}
