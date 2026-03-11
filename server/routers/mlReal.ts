/**
 * Real ML API Routes
 * Exposes trained ML models for inference
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { mlPipeline } from '../ml/real/mlPipeline';
import { stockClassificationML } from '../ml/real/stockClassificationML';
import { leadScoringML } from '../ml/real/leadScoringML';
import { demandForecastingML } from '../ml/real/demandForecastingML';
import { fraudDetectionML } from '../ml/real/fraudDetectionML';
import { reorderOptimizationML } from '../ml/real/reorderOptimizationML';
import { cashFlowForecastingML } from '../ml/real/cashFlowForecastingML';

export const mlRealRouter = router({
  /**
   * Train all ML models
   */
  trainAllModels: publicProcedure
    .mutation(async () => {
      return await mlPipeline.trainAllModels();
    }),

  /**
   * Get training status
   */
  getTrainingStatus: publicProcedure
    .query(() => {
      return mlPipeline.getTrainingStatus();
    }),

  /**
   * Stock Classification - Predict
   */
  classifyProducts: publicProcedure
    .input(z.object({
      products: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        totalRevenue: z.number(),
        turnoverRate: z.number(),
        movementFrequency: z.number(),
        avgOrderSize: z.number(),
        daysInStock: z.number()
      }))
    }))
    .mutation(async ({ input }) => {
      return await stockClassificationML.predict(input.products);
    }),

  /**
   * Lead Scoring - Predict
   */
  scoreLead: publicProcedure
    .input(z.object({
      engagementScore: z.number(),
      companySize: z.number(),
      industryScore: z.number(),
      interactionCount: z.number(),
      emailOpenRate: z.number(),
      websiteVisits: z.number(),
      demoRequested: z.number(),
      budgetRange: z.number(),
      decisionMaker: z.number(),
      responseTime: z.number()
    }))
    .mutation(async ({ input }) => {
      return await leadScoringML.predict(input);
    }),

  /**
   * Demand Forecasting - Predict
   */
  forecastDemand: publicProcedure
    .input(z.object({
      recentSales: z.array(z.object({
        date: z.date(),
        quantity: z.number()
      })),
      daysAhead: z.number().default(30)
    }))
    .mutation(async ({ input }) => {
      return await demandForecastingML.forecast(input.recentSales, input.daysAhead);
    }),

  /**
   * Fraud Detection - Predict
   */
  detectFraud: publicProcedure
    .input(z.object({
      amount: z.number(),
      hour: z.number(),
      dayOfWeek: z.number(),
      transactionFrequency24h: z.number(),
      avgAmount: z.number(),
      stdDevAmount: z.number(),
      timeSinceLastTransaction: z.number(),
      isWeekend: z.number(),
      isRoundAmount: z.number()
    }))
    .mutation(async ({ input }) => {
      return await fraudDetectionML.predict(input);
    }),

  /**
   * Reorder Optimization - Predict
   */
  optimizeReorder: publicProcedure
    .input(z.object({
      currentStock: z.number(),
      avgDailyDemand: z.number(),
      demandTrend: z.number(),
      leadTimeDays: z.number(),
      daysUntilStockout: z.number(),
      seasonalFactor: z.number()
    }))
    .mutation(async ({ input }) => {
      return await reorderOptimizationML.predict(input);
    }),

  /**
   * Cash Flow Forecasting - Predict
   */
  forecastCashFlow: publicProcedure
    .input(z.object({
      historicalData: z.array(z.object({
        date: z.date(),
        amount: z.number()
      })),
      daysAhead: z.number().default(90)
    }))
    .mutation(async ({ input }) => {
      return await cashFlowForecastingML.forecast(input.historicalData, input.daysAhead);
    }),

  /**
   * Cash Flow - Detect Changepoints
   */
  detectChangepoints: publicProcedure
    .input(z.object({
      data: z.array(z.object({
        date: z.date(),
        amount: z.number()
      }))
    }))
    .mutation(async ({ input }) => {
      return await cashFlowForecastingML.detectChangepoints(input.data);
    })
});
