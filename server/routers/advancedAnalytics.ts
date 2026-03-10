import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getProjectGanttData,
  getProjectTaskTimeline,
  getProjectMilestones,
  getSalesFunnelData,
  getLeadSourceAnalysis,
  getCustomerAcquisitionTrend,
  getFinancialTrendAnalysis,
  getRevenueVsExpenseComparison,
  getCashFlowProjection,
  getProfitMarginAnalysis,
  getAnalyticsOverview,
} from "../analyticsHelpers";

/**
 * Advanced Analytics Router
 * Provides data for Gantt charts, sales funnels, and financial trends
 */
export const advancedAnalyticsRouter = router({
  // ==================== PROJECT ANALYTICS ====================

  /**
   * Get Gantt chart data for all active projects
   */
  getProjectGanttChart: protectedProcedure.query(async () => {
    return await getProjectGanttData();
  }),

  /**
   * Get task timeline for a specific project
   */
  getProjectTaskTimeline: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getProjectTaskTimeline(input.projectId);
    }),

  /**
   * Get milestones for a project
   */
  getProjectMilestones: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getProjectMilestones(input.projectId);
    }),

  // ==================== SALES ANALYTICS ====================

  /**
   * Get sales funnel data
   */
  getSalesFunnel: protectedProcedure.query(async () => {
    return await getSalesFunnelData();
  }),

  /**
   * Get lead source analysis
   */
  getLeadSourceAnalysis: protectedProcedure.query(async () => {
    return await getLeadSourceAnalysis();
  }),

  /**
   * Get customer acquisition trend
   */
  getCustomerAcquisitionTrend: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      return await getCustomerAcquisitionTrend(input.months);
    }),

  // ==================== FINANCIAL ANALYTICS ====================

  /**
   * Get financial trend analysis
   */
  getFinancialTrends: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      return await getFinancialTrendAnalysis(input.months);
    }),

  /**
   * Get revenue vs expense comparison
   */
  getRevenueVsExpense: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      return await getRevenueVsExpenseComparison(input.months);
    }),

  /**
   * Get cash flow projection
   */
  getCashFlowProjection: protectedProcedure
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ input }) => {
      return await getCashFlowProjection(input.months);
    }),

  /**
   * Get profit margin analysis
   */
  getProfitMarginAnalysis: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      return await getProfitMarginAnalysis(input.months);
    }),

  // ==================== COMPOSITE QUERIES ====================

  /**
   * Get complete analytics overview
   */
  getAnalyticsOverview: protectedProcedure.query(async () => {
    return await getAnalyticsOverview();
  }),
});
