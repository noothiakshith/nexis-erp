import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getFinancialMetrics,
  getRevenueByMonth,
  getExpenseBreakdown,
  getInventoryMetrics,
  getStockLevelsByCategory,
  getHRMetrics,
  getEmployeeByDepartment,
  getSalesMetrics,
  getLeadsByStage,
  getProjectMetrics,
  getProcurementMetrics,
} from "../dashboardHelpers";

/**
 * Metrics router for dashboard data
 * Provides real-time KPIs and analytics across all modules
 */
export const metricsRouter = router({
  // ==================== FINANCIAL METRICS ====================

  /**
   * Get overall financial metrics
   */
  getFinancialMetrics: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      return await getFinancialMetrics(input.timeframe);
    }),

  /**
   * Get revenue trend by month
   */
  getRevenueByMonth: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      return await getRevenueByMonth(input.months);
    }),

  /**
   * Get expense breakdown by category
   */
  getExpenseBreakdown: protectedProcedure.query(async () => {
    return await getExpenseBreakdown();
  }),

  // ==================== INVENTORY METRICS ====================

  /**
   * Get overall inventory metrics
   */
  getInventoryMetrics: protectedProcedure.query(async () => {
    return await getInventoryMetrics();
  }),

  /**
   * Get stock levels by product category
   */
  getStockLevelsByCategory: protectedProcedure.query(async () => {
    return await getStockLevelsByCategory();
  }),

  // ==================== HR METRICS ====================

  /**
   * Get overall HR metrics
   */
  getHRMetrics: protectedProcedure.query(async () => {
    return await getHRMetrics();
  }),

  /**
   * Get employee count by department
   */
  getEmployeeByDepartment: protectedProcedure.query(async () => {
    return await getEmployeeByDepartment();
  }),

  // ==================== SALES METRICS ====================

  /**
   * Get overall sales metrics
   */
  getSalesMetrics: protectedProcedure.query(async () => {
    return await getSalesMetrics();
  }),

  /**
   * Get leads by pipeline stage
   */
  getLeadsByStage: protectedProcedure.query(async () => {
    return await getLeadsByStage();
  }),

  // ==================== PROJECT METRICS ====================

  /**
   * Get overall project metrics
   */
  getProjectMetrics: protectedProcedure.query(async () => {
    return await getProjectMetrics();
  }),

  // ==================== PROCUREMENT METRICS ====================

  /**
   * Get overall procurement metrics
   */
  getProcurementMetrics: protectedProcedure.query(async () => {
    return await getProcurementMetrics();
  }),

  // ==================== COMPOSITE DASHBOARD ====================

  /**
   * Get all dashboard metrics at once
   */
  getAllDashboardMetrics: protectedProcedure.query(async () => {
    const [financial, inventory, hr, sales, projects, procurement] = await Promise.all([
      getFinancialMetrics("month"),
      getInventoryMetrics(),
      getHRMetrics(),
      getSalesMetrics(),
      getProjectMetrics(),
      getProcurementMetrics(),
    ]);

    return {
      financial,
      inventory,
      hr,
      sales,
      projects,
      procurement,
      lastUpdated: new Date(),
    };
  }),

  /**
   * Get comprehensive analytics dashboard
   */
  getAnalyticsDashboard: protectedProcedure.query(async () => {
    const [
      financial,
      revenueByMonth,
      expenseBreakdown,
      inventory,
      stockByCategory,
      hr,
      employeeByDept,
      sales,
      leadsByStage,
      projects,
      procurement,
    ] = await Promise.all([
      getFinancialMetrics("month"),
      getRevenueByMonth(12),
      getExpenseBreakdown(),
      getInventoryMetrics(),
      getStockLevelsByCategory(),
      getHRMetrics(),
      getEmployeeByDepartment(),
      getSalesMetrics(),
      getLeadsByStage(),
      getProjectMetrics(),
      getProcurementMetrics(),
    ]);

    return {
      financial: {
        metrics: financial,
        revenueByMonth,
        expenseBreakdown,
      },
      inventory: {
        metrics: inventory,
        stockByCategory,
      },
      hr: {
        metrics: hr,
        employeeByDepartment: employeeByDept,
      },
      sales: {
        metrics: sales,
        leadsByStage,
      },
      projects,
      procurement,
      lastUpdated: new Date(),
    };
  }),
});
