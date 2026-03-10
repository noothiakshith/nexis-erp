import { getDb } from "./db";
import { projects, tasks, leads, invoices, expenses, customers } from "../drizzle/schema";
import { eq, gte, lte, and, count, sum, desc } from "drizzle-orm";

/**
 * Advanced analytics helpers for visualizations
 * Provides data for Gantt charts, sales funnels, and financial trends
 */

// ==================== PROJECT TIMELINE & GANTT CHART ====================

export interface GanttTask {
  id: number;
  name: string;
  projectId: number;
  projectName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
  assignedTo?: string;
  dependencies?: number[];
}

export async function getProjectGanttData(): Promise<GanttTask[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const projectsData = await db
      .select({
        id: projects.id,
        name: projects.name,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        budget: projects.budget,
      })
      .from(projects)
      .where(eq(projects.status, "active"));

    const ganttData: GanttTask[] = projectsData.map((project) => ({
      id: project.id,
      name: project.name,
      projectId: project.id,
      projectName: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: calculateProgress(project.status),
      status: project.status,
    }));

    return ganttData;
  } catch (error) {
    console.error("Error fetching Gantt data:", error);
    return [];
  }
}

export async function getProjectTaskTimeline(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const tasksData = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        startDate: tasks.dueDate,
        endDate: tasks.dueDate,
        status: tasks.status,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    return tasksData.map((task) => ({
      id: task.id,
      name: task.name,
      startDate: task.startDate,
      endDate: task.endDate,
      progress: calculateProgress(task.status),
      status: task.status,
      priority: task.priority,
    }));
  } catch (error) {
    console.error("Error fetching task timeline:", error);
    return [];
  }
}

export async function getProjectMilestones(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const milestoneTasks = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        dueDate: tasks.dueDate,
        status: tasks.status,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.priority, "high")));

    return milestoneTasks.map((task) => ({
      id: task.id,
      name: task.name,
      date: task.dueDate,
      status: task.status,
      isCompleted: task.status === "completed",
    }));
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }
}

// ==================== SALES FUNNEL ====================

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDealSize: number;
}

export async function getSalesFunnelData(): Promise<FunnelStage[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const stages = ["lead", "qualified", "proposal", "negotiation", "won"];
    const funnelData: FunnelStage[] = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageLeads = await db
        .select({
          count: count(),
          totalValue: sum(leads.value),
        })
        .from(leads)
        .where(eq(leads.status, stage));

      const count = stageLeads[0]?.count || 0;
      const totalValue = parseFloat(stageLeads[0]?.totalValue || "0");

      // Calculate conversion rate from previous stage
      let conversionRate = 0;
      if (i > 0 && funnelData[i - 1]) {
        conversionRate = funnelData[i - 1].count > 0 ? (count / funnelData[i - 1].count) * 100 : 0;
      }

      funnelData.push({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count,
        value: totalValue,
        conversionRate,
        avgDealSize: count > 0 ? totalValue / count : 0,
      });
    }

    return funnelData;
  } catch (error) {
    console.error("Error fetching sales funnel data:", error);
    return [];
  }
}

export async function getLeadSourceAnalysis() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        source: leads.source,
        count: count(),
        totalValue: sum(leads.value),
        wonCount: count(),
      })
      .from(leads)
      .groupBy(leads.source);

    return result.map((item) => ({
      source: item.source,
      leads: item.count || 0,
      value: parseFloat(item.totalValue || "0"),
      conversionRate: 0, // Would calculate based on won leads
    }));
  } catch (error) {
    console.error("Error fetching lead source analysis:", error);
    return [];
  }
}

export async function getCustomerAcquisitionTrend(months: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const result = await db
      .select({
        month: customers.createdAt,
        count: count(),
      })
      .from(customers)
      .where(
        and(
          gte(customers.createdAt, startDate),
          lte(customers.createdAt, now),
          eq(customers.status, "active")
        )
      )
      .groupBy(customers.createdAt);

    return result.map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      customers: item.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching customer acquisition trend:", error);
    return [];
  }
}

// ==================== FINANCIAL TRENDS ====================

export interface FinancialTrend {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export async function getFinancialTrendAnalysis(months: number = 12): Promise<FinancialTrend[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const trends: FinancialTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const revenueResult = await db
        .select({
          total: sum(invoices.totalAmount),
        })
        .from(invoices)
        .where(
          and(
            gte(invoices.issueDate, monthStart),
            lte(invoices.issueDate, monthEnd),
            eq(invoices.status, "paid")
          )
        );

      const expensesResult = await db
        .select({
          total: sum(expenses.amount),
        })
        .from(expenses)
        .where(
          and(
            gte(expenses.createdAt, monthStart),
            lte(expenses.createdAt, monthEnd),
            eq(expenses.status, "approved")
          )
        );

      const revenue = parseFloat(revenueResult[0]?.total || "0");
      const expensesAmount = parseFloat(expensesResult[0]?.total || "0");
      const profit = revenue - expensesAmount;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      trends.push({
        period: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue,
        expenses: expensesAmount,
        profit,
        margin,
      });
    }

    return trends;
  } catch (error) {
    console.error("Error fetching financial trends:", error);
    return [];
  }
}

export async function getRevenueVsExpenseComparison(months: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const result = await db
      .select({
        month: invoices.issueDate,
        revenue: sum(invoices.totalAmount),
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, now),
          eq(invoices.status, "paid")
        )
      )
      .groupBy(invoices.issueDate);

    return result.map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue: parseFloat(item.revenue || "0"),
    }));
  } catch (error) {
    console.error("Error fetching revenue vs expense comparison:", error);
    return [];
  }
}

export async function getCashFlowProjection(months: number = 6) {
  const db = await getDb();
  if (!db) return [];

  try {
    const projections = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);

      const revenue = Math.random() * 100000 + 50000; // Mock projection
      const expenses = Math.random() * 60000 + 30000;
      const cashFlow = revenue - expenses;

      projections.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        projected: cashFlow,
        revenue,
        expenses,
      });
    }

    return projections;
  } catch (error) {
    console.error("Error fetching cash flow projection:", error);
    return [];
  }
}

export async function getProfitMarginAnalysis(months: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    const trends = await getFinancialTrendAnalysis(months);
    return trends.map((trend) => ({
      period: trend.period,
      margin: trend.margin,
      revenue: trend.revenue,
    }));
  } catch (error) {
    console.error("Error fetching profit margin analysis:", error);
    return [];
  }
}

// ==================== HELPER FUNCTIONS ====================

function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    pending: 0,
    in_progress: 50,
    completed: 100,
    on_hold: 25,
    cancelled: 0,
  };
  return progressMap[status] || 0;
}

export async function getAnalyticsOverview() {
  const [ganttData, funnelData, financialTrends, cashFlow] = await Promise.all([
    getProjectGanttData(),
    getSalesFunnelData(),
    getFinancialTrendAnalysis(12),
    getCashFlowProjection(6),
  ]);

  return {
    projects: ganttData,
    salesFunnel: funnelData,
    financialTrends,
    cashFlowProjection: cashFlow,
    lastUpdated: new Date(),
  };
}
