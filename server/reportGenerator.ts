import { getDb } from "./db";
import { invoices, expenses, products, employees, leads } from "../drizzle/schema";
import { gte, lte, and, sum, count, eq } from "drizzle-orm";

/**
 * Report Generation System
 * Creates PDF and Excel reports with comprehensive data exports
 */

export interface ReportConfig {
  type: "financial" | "inventory" | "hr" | "sales" | "comprehensive";
  format: "pdf" | "excel";
  timeframe: "month" | "quarter" | "year";
  includeCharts: boolean;
  includeForecast: boolean;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  timeframe: string;
  sections: ReportSection[];
  summary: string;
}

export interface ReportSection {
  title: string;
  description: string;
  data: Record<string, unknown>[];
  metrics?: Record<string, number | string>;
}

/**
 * Generate financial report
 */
export async function generateFinancialReport(timeframe: "month" | "quarter" | "year") {
  const db = await getDb();
  if (!db) return null;

  try {
    const now = new Date();
    let startDate: Date;

    if (timeframe === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Get revenue data
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

    // Get expense data
    const expenseResult = await db
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

    // Get invoice breakdown by status
    const invoiceBreakdown = await db
      .select({
        status: invoices.status,
        count: count(),
        total: sum(invoices.totalAmount),
      })
      .from(invoices)
      .where(and(gte(invoices.issueDate, startDate), lte(invoices.issueDate, now)))
      .groupBy(invoices.status);

    const totalRevenue = parseFloat(revenueResult[0]?.total || "0");
    const totalExpenses = parseFloat(expenseResult[0]?.total || "0");
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      title: `Financial Report - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`,
      generatedAt: now,
      timeframe: `${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}`,
      sections: [
        {
          title: "Revenue Summary",
          description: "Total revenue and invoice metrics",
          data: [
            {
              metric: "Total Revenue",
              value: `$${totalRevenue.toLocaleString()}`,
              invoices: revenueResult[0]?.count || 0,
            },
          ],
          metrics: {
            "Total Revenue": `$${totalRevenue.toLocaleString()}`,
            "Invoice Count": revenueResult[0]?.count || 0,
            "Average Invoice": `$${totalRevenue / Math.max(1, revenueResult[0]?.count || 1)}`,
          },
        },
        {
          title: "Expense Summary",
          description: "Total expenses and cost breakdown",
          data: [
            {
              metric: "Total Expenses",
              value: `$${totalExpenses.toLocaleString()}`,
              count: expenseResult[0]?.count || 0,
            },
          ],
          metrics: {
            "Total Expenses": `$${totalExpenses.toLocaleString()}`,
            "Expense Count": expenseResult[0]?.count || 0,
            "Average Expense": `$${totalExpenses / Math.max(1, expenseResult[0]?.count || 1)}`,
          },
        },
        {
          title: "Profitability",
          description: "Profit and margin analysis",
          data: [
            {
              metric: "Gross Profit",
              value: `$${profit.toLocaleString()}`,
              margin: `${margin.toFixed(2)}%`,
            },
          ],
          metrics: {
            "Gross Profit": `$${profit.toLocaleString()}`,
            "Profit Margin": `${margin.toFixed(2)}%`,
            "Expense Ratio": `${((totalExpenses / totalRevenue) * 100).toFixed(2)}%`,
          },
        },
        {
          title: "Invoice Status Breakdown",
          description: "Invoices by status",
          data: invoiceBreakdown.map((item) => ({
            status: item.status,
            count: item.count,
            total: `$${parseFloat(item.total || "0").toLocaleString()}`,
          })),
        },
      ],
      summary: `This period shows total revenue of $${totalRevenue.toLocaleString()} with expenses of $${totalExpenses.toLocaleString()}, resulting in a profit of $${profit.toLocaleString()} (${margin.toFixed(2)}% margin).`,
    };
  } catch (error) {
    console.error("Error generating financial report:", error);
    return null;
  }
}

/**
 * Generate inventory report
 */
export async function generateInventoryReport() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get inventory metrics
    const inventoryData = await db
      .select({
        id: products.id,
        name: products.name,
        stockLevel: products.stockLevel,
        reorderPoint: products.reorderPoint,
        unitPrice: products.unitPrice,
      })
      .from(products)
      .limit(100);

    const totalValue = inventoryData.reduce(
      (sum, p) => sum + parseFloat(p.unitPrice || "0") * p.stockLevel,
      0
    );
    const lowStockCount = inventoryData.filter((p) => p.stockLevel < p.reorderPoint).length;

    return {
      title: "Inventory Report",
      generatedAt: new Date(),
      timeframe: new Date().toLocaleDateString(),
      sections: [
        {
          title: "Inventory Overview",
          description: "Current inventory status and metrics",
          data: [
            {
              metric: "Total Products",
              value: inventoryData.length,
            },
            {
              metric: "Total Inventory Value",
              value: `$${totalValue.toLocaleString()}`,
            },
            {
              metric: "Low Stock Items",
              value: lowStockCount,
            },
          ],
          metrics: {
            "Total Products": inventoryData.length,
            "Inventory Value": `$${totalValue.toLocaleString()}`,
            "Low Stock Count": lowStockCount,
            "Average Stock Level": `${(inventoryData.reduce((sum, p) => sum + p.stockLevel, 0) / inventoryData.length).toFixed(0)} units`,
          },
        },
        {
          title: "Low Stock Products",
          description: "Products below reorder point",
          data: inventoryData
            .filter((p) => p.stockLevel < p.reorderPoint)
            .map((p) => ({
              product: p.name,
              current: p.stockLevel,
              reorder: p.reorderPoint,
              shortage: p.reorderPoint - p.stockLevel,
            })),
        },
        {
          title: "Top Products by Value",
          description: "Products with highest inventory value",
          data: inventoryData
            .sort(
              (a, b) =>
                parseFloat(b.unitPrice || "0") * b.stockLevel -
                parseFloat(a.unitPrice || "0") * a.stockLevel
            )
            .slice(0, 10)
            .map((p) => ({
              product: p.name,
              quantity: p.stockLevel,
              unitPrice: `$${parseFloat(p.unitPrice || "0").toFixed(2)}`,
              totalValue: `$${(parseFloat(p.unitPrice || "0") * p.stockLevel).toLocaleString()}`,
            })),
        },
      ],
      summary: `Current inventory consists of ${inventoryData.length} products with a total value of $${totalValue.toLocaleString()}. ${lowStockCount} products are below reorder point and require immediate attention.`,
    };
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return null;
  }
}

/**
 * Generate HR report
 */
export async function generateHRReport() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get employee metrics
    const employeeData = await db
      .select({
        id: employees.id,
        name: employees.name,
        department: employees.department,
        salary: employees.salary,
        status: employees.status,
      })
      .from(employees);

    const totalEmployees = employeeData.length;
    const totalPayroll = employeeData.reduce((sum, e) => sum + parseFloat(e.salary || "0"), 0);
    const departmentBreakdown = employeeData.reduce(
      (acc, e) => {
        const dept = e.department || "Unassigned";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      title: "HR Report",
      generatedAt: new Date(),
      timeframe: new Date().toLocaleDateString(),
      sections: [
        {
          title: "Employee Overview",
          description: "Current workforce metrics",
          data: [
            {
              metric: "Total Employees",
              value: totalEmployees,
            },
            {
              metric: "Total Monthly Payroll",
              value: `$${totalPayroll.toLocaleString()}`,
            },
            {
              metric: "Average Salary",
              value: `$${(totalPayroll / totalEmployees).toLocaleString()}`,
            },
          ],
          metrics: {
            "Total Employees": totalEmployees,
            "Monthly Payroll": `$${totalPayroll.toLocaleString()}`,
            "Average Salary": `$${(totalPayroll / totalEmployees).toFixed(0)}`,
          },
        },
        {
          title: "Department Breakdown",
          description: "Employees by department",
          data: Object.entries(departmentBreakdown).map(([dept, count]) => ({
            department: dept,
            employees: count,
            percentage: `${((count / totalEmployees) * 100).toFixed(1)}%`,
          })),
        },
        {
          title: "Top Earners",
          description: "Highest paid employees",
          data: employeeData
            .sort((a, b) => parseFloat(b.salary || "0") - parseFloat(a.salary || "0"))
            .slice(0, 10)
            .map((e) => ({
              name: e.name,
              department: e.department,
              salary: `$${parseFloat(e.salary || "0").toLocaleString()}`,
            })),
        },
      ],
      summary: `Organization has ${totalEmployees} employees with a total monthly payroll of $${totalPayroll.toLocaleString()}. Average salary is $${(totalPayroll / totalEmployees).toFixed(0)}.`,
    };
  } catch (error) {
    console.error("Error generating HR report:", error);
    return null;
  }
}

/**
 * Generate sales report
 */
export async function generateSalesReport() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get sales metrics
    const leadData = await db
      .select({
        id: leads.id,
        status: leads.status,
        value: leads.value,
        source: leads.source,
      })
      .from(leads);

    const totalLeads = leadData.length;
    const wonLeads = leadData.filter((l) => l.status === "won").length;
    const totalPipeline = leadData.reduce((sum, l) => sum + parseFloat(l.value || "0"), 0);
    const wonValue = leadData
      .filter((l) => l.status === "won")
      .reduce((sum, l) => sum + parseFloat(l.value || "0"), 0);

    const stageBreakdown = leadData.reduce(
      (acc, l) => {
        const stage = l.status || "Unknown";
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count += 1;
        acc[stage].value += parseFloat(l.value || "0");
        return acc;
      },
      {} as Record<string, { count: number; value: number }>
    );

    return {
      title: "Sales Report",
      generatedAt: new Date(),
      timeframe: new Date().toLocaleDateString(),
      sections: [
        {
          title: "Sales Overview",
          description: "Current sales pipeline metrics",
          data: [
            {
              metric: "Total Leads",
              value: totalLeads,
            },
            {
              metric: "Won Deals",
              value: wonLeads,
            },
            {
              metric: "Total Pipeline Value",
              value: `$${totalPipeline.toLocaleString()}`,
            },
            {
              metric: "Won Value",
              value: `$${wonValue.toLocaleString()}`,
            },
          ],
          metrics: {
            "Total Leads": totalLeads,
            "Won Deals": wonLeads,
            "Conversion Rate": `${((wonLeads / totalLeads) * 100).toFixed(1)}%`,
            "Pipeline Value": `$${totalPipeline.toLocaleString()}`,
            "Average Deal Size": `$${(totalPipeline / totalLeads).toFixed(0)}`,
          },
        },
        {
          title: "Pipeline by Stage",
          description: "Leads by sales stage",
          data: Object.entries(stageBreakdown).map(([stage, data]) => ({
            stage,
            count: data.count,
            value: `$${data.value.toLocaleString()}`,
            avgDeal: `$${(data.value / data.count).toFixed(0)}`,
          })),
        },
      ],
      summary: `Sales pipeline contains ${totalLeads} leads with a total value of $${totalPipeline.toLocaleString()}. ${wonLeads} deals have been won for a total of $${wonValue.toLocaleString()}, representing a ${((wonLeads / totalLeads) * 100).toFixed(1)}% conversion rate.`,
    };
  } catch (error) {
    console.error("Error generating sales report:", error);
    return null;
  }
}

/**
 * Generate comprehensive report combining all modules
 */
export async function generateComprehensiveReport(timeframe: "month" | "quarter" | "year") {
  const [financial, inventory, hr, sales] = await Promise.all([
    generateFinancialReport(timeframe),
    generateInventoryReport(),
    generateHRReport(),
    generateSalesReport(),
  ]);

  return {
    title: `Comprehensive Business Report - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`,
    generatedAt: new Date(),
    timeframe,
    reports: {
      financial,
      inventory,
      hr,
      sales,
    },
    summary: "Complete overview of business performance across all departments",
  };
}

/**
 * Format report data for PDF export
 */
export function formatReportForPDF(report: ReportData): string {
  let content = `${report.title}\n`;
  content += `Generated: ${report.generatedAt.toLocaleDateString()}\n`;
  content += `Period: ${report.timeframe}\n\n`;

  report.sections.forEach((section) => {
    content += `\n${section.title}\n`;
    content += `${section.description}\n`;

    if (section.metrics) {
      content += "\nKey Metrics:\n";
      Object.entries(section.metrics).forEach(([key, value]) => {
        content += `  ${key}: ${value}\n`;
      });
    }

    if (section.data.length > 0) {
      content += "\nData:\n";
      section.data.forEach((row) => {
        content += `  ${JSON.stringify(row)}\n`;
      });
    }
  });

  content += `\n\nSummary:\n${report.summary}`;
  return content;
}

/**
 * Format report data for Excel export
 */
export function formatReportForExcel(report: ReportData): Record<string, unknown[][]> {
  const sheets: Record<string, unknown[][]> = {};

  sheets["Summary"] = [
    ["Nexis ERP Report"],
    [report.title],
    [`Generated: ${report.generatedAt.toLocaleDateString()}`],
    [`Period: ${report.timeframe}`],
    [],
    [report.summary],
  ];

  report.sections.forEach((section) => {
    const sheetName = section.title.substring(0, 31); // Excel sheet name limit
    const sheetData: unknown[][] = [];

    sheetData.push([section.title]);
    sheetData.push([section.description]);
    sheetData.push([]);

    if (section.metrics) {
      sheetData.push(["Metrics"]);
      Object.entries(section.metrics).forEach(([key, value]) => {
        sheetData.push([key, value]);
      });
      sheetData.push([]);
    }

    if (section.data.length > 0) {
      const headers = Object.keys(section.data[0]);
      sheetData.push(headers);
      section.data.forEach((row) => {
        sheetData.push(headers.map((h) => row[h]));
      });
    }

    sheets[sheetName] = sheetData;
  });

  return sheets;
}
