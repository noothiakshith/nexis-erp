import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  forecastRevenue,
  predictInventoryDemand,
  detectAnomalies,
  generatePredictiveInsights,
} from "../predictiveAnalytics";
import {
  generateFinancialReport,
  generateInventoryReport,
  generateHRReport,
  generateSalesReport,
  generateComprehensiveReport,
  formatReportForPDF,
  formatReportForExcel,
} from "../reportGenerator";

/**
 * Predictive Analytics Router
 * Handles revenue forecasting, inventory prediction, and anomaly detection
 */
export const predictiveAnalyticsRouter = router({
  // ==================== FORECASTING ====================

  /**
   * Forecast revenue for next months
   */
  forecastRevenue: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ input }) => {
      return await forecastRevenue(input.months);
    }),

  /**
   * Predict inventory demand
   */
  predictInventoryDemand: protectedProcedure.query(async () => {
    return await predictInventoryDemand();
  }),

  /**
   * Detect anomalies in financial and operational metrics
   */
  detectAnomalies: protectedProcedure.query(async () => {
    return await detectAnomalies();
  }),

  /**
   * Generate comprehensive predictive insights
   */
  generateInsights: protectedProcedure.query(async () => {
    return await generatePredictiveInsights();
  }),

  // ==================== REPORTING ====================

  /**
   * Generate financial report
   */
  generateFinancialReport: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      return await generateFinancialReport(input.timeframe);
    }),

  /**
   * Generate inventory report
   */
  generateInventoryReport: protectedProcedure.query(async () => {
    return await generateInventoryReport();
  }),

  /**
   * Generate HR report
   */
  generateHRReport: protectedProcedure.query(async () => {
    return await generateHRReport();
  }),

  /**
   * Generate sales report
   */
  generateSalesReport: protectedProcedure.query(async () => {
    return await generateSalesReport();
  }),

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport: protectedProcedure
    .input(
      z.object({
        timeframe: z.enum(["month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      return await generateComprehensiveReport(input.timeframe);
    }),

  /**
   * Export report as PDF (returns formatted string)
   */
  exportReportAsPDF: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["financial", "inventory", "hr", "sales", "comprehensive"]),
        timeframe: z.enum(["month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      let report;

      switch (input.reportType) {
        case "financial":
          report = await generateFinancialReport(input.timeframe);
          break;
        case "inventory":
          report = await generateInventoryReport();
          break;
        case "hr":
          report = await generateHRReport();
          break;
        case "sales":
          report = await generateSalesReport();
          break;
        case "comprehensive":
          report = await generateComprehensiveReport(input.timeframe);
          break;
      }

      if (!report) {
        throw new Error("Failed to generate report");
      }

      return {
        success: true,
        content: formatReportForPDF(report),
        filename: `${input.reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`,
      };
    }),

  /**
   * Export report as Excel (returns formatted data)
   */
  exportReportAsExcel: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["financial", "inventory", "hr", "sales", "comprehensive"]),
        timeframe: z.enum(["month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input }) => {
      let report;

      switch (input.reportType) {
        case "financial":
          report = await generateFinancialReport(input.timeframe);
          break;
        case "inventory":
          report = await generateInventoryReport();
          break;
        case "hr":
          report = await generateHRReport();
          break;
        case "sales":
          report = await generateSalesReport();
          break;
        case "comprehensive":
          report = await generateComprehensiveReport(input.timeframe);
          break;
      }

      if (!report) {
        throw new Error("Failed to generate report");
      }

      return {
        success: true,
        sheets: formatReportForExcel(report),
        filename: `${input.reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`,
      };
    }),
});
