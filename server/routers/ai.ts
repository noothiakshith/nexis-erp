/**
 * AI Router - Combines ML and LLM services
 * Provides endpoints for all AI-powered features
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { fraudDetectionService } from '../ml/fraudDetection';
import { cashFlowForecastingService } from '../ml/cashFlowForecasting';
import { leadScoringService } from '../ml/leadScoring';
import { demandForecastingService } from '../ml/demandForecasting';
import { reorderOptimizationService } from '../ml/reorderOptimization';
import { stockClassificationService } from '../ml/stockClassification';
import { openaiService } from '../llm/openaiService';
import { mlPipeline } from '../ml/real/mlPipeline';
import { demandForecastingML } from '../ml/real/demandForecastingML';
import { stockClassificationML } from '../ml/real/stockClassificationML';
import { reorderOptimizationML } from '../ml/real/reorderOptimizationML';
import { getDb } from '../db';
import { expenses, invoices, leads, products, stockMovements } from '../../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const aiRouter = router({
  /**
   * Fraud Detection - ML Model
   */
  detectFraud: publicProcedure
    .input(z.object({
      transactionId: z.number().optional(),
      amount: z.number(),
      userId: z.number(),
      vendorId: z.number().optional(),
      category: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Get user's transaction history
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userExpenses = await db
        .select()
        .from(expenses)
        .orderBy(desc(expenses.createdAt))
        .limit(100);

      const history = userExpenses.map((e) => ({
        amount: parseFloat(e.amount),
        timestamp: e.expenseDate,
        userId: input.userId,
        category: e.category
      }));

      const transaction = {
        amount: input.amount,
        timestamp: new Date(),
        userId: input.userId,
        vendorId: input.vendorId,
        category: input.category
      };

      const fraudScore = await fraudDetectionService.detectFraud(transaction, history);

      return {
        ...fraudScore,
        message: fraudScore.risk === 'critical'
          ? 'Transaction flagged for review'
          : fraudScore.risk === 'high'
            ? 'Transaction requires approval'
            : 'Transaction appears normal'
      };
    }),

  /**
   * Cash Flow Forecasting - ML Model
   */
  forecastCashFlow: publicProcedure
    .input(z.object({
      daysAhead: z.number().default(90)
    }))
    .query(async ({ input }) => {
      // Get historical cash flow data
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allInvoices = await db.select().from(invoices).orderBy(invoices.issueDate);
      const allExpenses = await db.select().from(expenses).orderBy(expenses.expenseDate);

      // Aggregate by day
      const cashFlowMap = new Map<string, number>();

      allInvoices.forEach((inv) => {
        const dateKey = inv.issueDate.toISOString().split('T')[0];
        const amount = parseFloat(inv.totalAmount);
        cashFlowMap.set(dateKey, (cashFlowMap.get(dateKey) || 0) + amount);
      });

      allExpenses.forEach((exp) => {
        const dateKey = exp.expenseDate.toISOString().split('T')[0];
        const amount = parseFloat(exp.amount);
        cashFlowMap.set(dateKey, (cashFlowMap.get(dateKey) || 0) - amount);
      });

      const historicalData = Array.from(cashFlowMap.entries())
        .map(([date, amount]) => ({
          date: new Date(date),
          amount
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // If insufficient data, provide helpful message
      if (historicalData.length < 7) {
        // Return a structured response instead of throwing error
        return {
          forecasts: [],
          stats: {
            avgPredicted: 0,
            totalPredicted: 0,
            trend: 'stable' as const,
            volatility: 0
          },
          historicalDataPoints: historicalData.length,
          error: `Insufficient historical data. Need at least 7 days, have ${historicalData.length}. Please add more invoices and expenses.`,
          message: 'Add financial transactions to enable ML forecasting'
        };
      }

      const forecasts = await cashFlowForecastingService.forecastCashFlow(
        historicalData,
        input.daysAhead
      );

      const stats = await cashFlowForecastingService.getSummaryStats(forecasts);

      return {
        forecasts: forecasts.map(f => ({
          date: f.date.toISOString().split('T')[0],
          predicted: Math.round(f.predicted),
          lower: Math.round(f.lower),
          upper: Math.round(f.upper),
          trend: Math.round(f.trend)
        })),
        stats,
        historicalDataPoints: historicalData.length
      };
    }),

  /**
   * Lead Scoring - ML Model
   */
  scoreLead: publicProcedure
    .input(z.object({
      leadId: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const leadResults = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);

      if (!leadResults || leadResults.length === 0) {
        throw new Error('Lead not found');
      }

      const leadData = leadResults[0];

      // Extract features from lead data (using available fields)
      const features = {
        engagementScore: 60, // Default value
        companySize: 100, // Default value
        industry: 'general',
        interactionCount: 5,
        emailOpenRate: 60,
        websiteVisits: 3,
        demoRequested: leadData.status === 'qualified',
        budgetRange: leadData.value ? parseFloat(leadData.value) : undefined,
        decisionMakerContact: true,
        responseTime: 24
      };

      const score = await leadScoringService.scoreLead(features);

      return {
        leadId: input.leadId,
        leadName: leadData.name,
        company: leadData.company || 'Unknown',
        ...score
      };
    }),

  /**
   * Batch Lead Scoring
   */
  batchScoreLeads: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allLeads = await db.select().from(leads).limit(50);

      const scores = await Promise.all(
        allLeads.map(async (leadItem) => {
          const features = {
            engagementScore: 60,
            companySize: 100,
            industry: 'general',
            interactionCount: 5,
            emailOpenRate: 60,
            websiteVisits: 3,
            demoRequested: leadItem.status === 'qualified',
            budgetRange: leadItem.value ? parseFloat(leadItem.value) : undefined,
            decisionMakerContact: true,
            responseTime: 24
          };

          const score = await leadScoringService.scoreLead(features);

          return {
            leadId: leadItem.id,
            leadName: leadItem.name,
            company: leadItem.company || 'Unknown',
            ...score
          };
        })
      );

      const distribution = await leadScoringService.getScoreDistribution(scores);

      return {
        scores,
        distribution
      };
    }),

  /**
   * Expense Categorization - LLM
   */
  categorizeExpense: publicProcedure
    .input(z.object({
      description: z.string(),
      amount: z.number()
    }))
    .mutation(async ({ input }) => {
      const result = await openaiService.categorizeExpense(
        input.description,
        input.amount
      );

      return result;
    }),

  /**
   * Generate Financial Report Summary - LLM
   */
  generateFinancialSummary: publicProcedure
    .input(z.object({
      period: z.string(),
      revenue: z.number(),
      expenses: z.number(),
      profit: z.number(),
      profitMargin: z.number(),
      growth: z.number()
    }))
    .mutation(async ({ input }) => {
      const summary = await openaiService.generateExecutiveSummary(input);
      return { summary };
    }),

  /**
   * Explain Invoice Anomaly - LLM
   */
  explainInvoiceAnomaly: publicProcedure
    .input(z.object({
      invoiceNumber: z.string(),
      amount: z.number(),
      customer: z.string(),
      dueDate: z.date(),
      anomalyScore: z.number(),
      anomalyFactors: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      const explanation = await openaiService.explainInvoiceAnomaly(
        {
          invoiceNumber: input.invoiceNumber,
          amount: input.amount,
          customer: input.customer,
          dueDate: input.dueDate
        },
        input.anomalyScore,
        input.anomalyFactors
      );

      return { explanation };
    }),

  /**
   * Generate Scenario Narrative - LLM
   */
  generateScenarioNarrative: publicProcedure
    .input(z.object({
      scenarioName: z.string(),
      parameters: z.record(z.string(), z.any()),
      results: z.object({
        revenue: z.number(),
        expenses: z.number(),
        profit: z.number(),
        cashFlow: z.number()
      })
    }))
    .mutation(async ({ input }) => {
      const narrative = await openaiService.generateScenarioNarrative(
        input.scenarioName,
        input.parameters,
        input.results
      );

      return { narrative };
    }),

  /**
   * Generate Email Draft - LLM
   */
  generateEmailDraft: publicProcedure
    .input(z.object({
      recipientName: z.string(),
      companyName: z.string(),
      purpose: z.enum(['follow-up', 'introduction', 'proposal', 'thank-you']),
      details: z.string(),
      tone: z.enum(['formal', 'casual', 'friendly'])
    }))
    .mutation(async ({ input }) => {
      const emailDraft = await openaiService.generateEmailDraft(input);
      return { emailDraft };
    }),

  /**
   * Summarize Meeting Notes - LLM
   */
  summarizeMeetingNotes: publicProcedure
    .input(z.object({
      rawNotes: z.string()
    }))
    .mutation(async ({ input }) => {
      const summary = await openaiService.summarizeMeetingNotes(input.rawNotes);
      return summary;
    }),

  /**
   * Analyze Sentiment - LLM
   */
  analyzeSentiment: publicProcedure
    .input(z.object({
      text: z.string()
    }))
    .mutation(async ({ input }) => {
      const sentiment = await openaiService.analyzeSentiment(input.text);
      return sentiment;
    }),

  /**
   * Chat Assistant - LLM
   */
  chatAssistant: publicProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string()
      })).optional()
    }))
    .mutation(async ({ input }) => {
      const response = await openaiService.chatAssistant(
        input.message,
        input.conversationHistory
      );

      return { response };
    }),

  /**
   * ==================== INVENTORY ML MODELS ====================
   */

  /**
   * Demand Forecasting - ML Model
   * Predicts future demand for products using time-series analysis
   */
  demandForecast: publicProcedure
    .input(z.object({
      productId: z.number(),
      daysAhead: z.number().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get product info
      const productResults = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!productResults || productResults.length === 0) {
        throw new Error('Product not found');
      }
      const product = productResults[0];

      // Get historical stock movements (outbound = demand)
      const movements = await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.productId, input.productId))
        .orderBy(stockMovements.createdAt);

      // Filter outbound movements and format for ML service
      const demandHistory = movements
        .filter(m => m.movementType === 'out')
        .map(m => ({
          date: m.createdAt,
          quantity: m.quantity,
          productId: input.productId
        }));

      if (demandHistory.length < 7) {
        return {
          productId: input.productId,
          productName: product.name,
          sku: product.sku,
          forecasts: [],
          summary: {
            avgDailyDemand: 0,
            totalForecast: 0,
            trend: 'stable' as const,
            seasonalityDetected: false,
            peakDay: 'Unknown'
          },
          historicalDataPoints: demandHistory.length,
          error: `Insufficient historical data. Need at least 7 days, have ${demandHistory.length}. Add more stock movements.`,
          message: 'Add stock movements to enable demand forecasting'
        };
      }

      const result = await demandForecastingService.forecastDemand(
        demandHistory,
        input.daysAhead
      );

      try {
        if (!demandForecastingML.getModelInfo().trained && demandHistory.length >= 30) {
          await demandForecastingML.train(demandHistory);
        }
        if (demandForecastingML.getModelInfo().trained) {
          const mlForecasts = await demandForecastingML.forecast(demandHistory, input.daysAhead);

          const forecastsMap = new Map();
          mlForecasts.forEach(f => forecastsMap.set(f.date.toISOString().split('T')[0], f));

          result.forecasts.forEach(f => {
            const dateStr = f.date.toISOString().split('T')[0];
            if (forecastsMap.has(dateStr)) {
              const newF = forecastsMap.get(dateStr);
              f.predicted = newF.predicted;
              f.lower = newF.lower;
              f.upper = newF.upper;
              f.confidence = newF.confidence;
            }
          });
        }
      } catch (err) {
        console.error("Real ML demandForecast failed:", err);
      }

      return {
        productId: input.productId,
        productName: product.name,
        sku: product.sku,
        forecasts: result.forecasts.map(f => ({
          date: f.date.toISOString().split('T')[0],
          predicted: f.predicted,
          lower: f.lower,
          upper: f.upper,
          confidence: f.confidence
        })),
        summary: result.summary,
        historicalDataPoints: demandHistory.length
      };
    }),

  /**
   * Batch Demand Forecasting - All Products
   */
  batchDemandForecast: publicProcedure
    .input(z.object({
      daysAhead: z.number().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allProducts = await db.select().from(products).limit(50);

      const forecasts = await Promise.all(
        allProducts.map(async (product) => {
          const movements = await db
            .select()
            .from(stockMovements)
            .where(eq(stockMovements.productId, product.id))
            .orderBy(stockMovements.createdAt);

          const demandHistory = movements
            .filter(m => m.movementType === 'out')
            .map(m => ({
              date: m.createdAt,
              quantity: m.quantity,
              productId: product.id
            }));

          if (demandHistory.length < 7) {
            return null;
          }

          const result = await demandForecastingService.forecastDemand(
            demandHistory,
            input.daysAhead
          );

          try {
            if (!demandForecastingML.getModelInfo().trained && demandHistory.length >= 30) {
              await demandForecastingML.train(demandHistory);
            }
            if (demandForecastingML.getModelInfo().trained) {
              const mlForecasts = await demandForecastingML.forecast(demandHistory, input.daysAhead);
              const mlTotal = mlForecasts.reduce((sum, f) => sum + f.predicted, 0);
              const mlAvg = Math.round(mlTotal / mlForecasts.length);
              result.summary.totalForecast = Math.round(mlTotal);
              result.summary.avgDailyDemand = mlAvg;
            }
          } catch (err) { }

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            ...result.summary
          };
        })
      );

      const validForecasts = forecasts.filter(f => f !== null);

      return {
        forecasts: validForecasts,
        totalProducts: allProducts.length,
        forecastedProducts: validForecasts.length
      };
    }),

  /**
   * Reorder Optimization - ML Model
   * Calculates optimal reorder points and quantities using EOQ
   */
  optimizeReorder: publicProcedure
    .input(z.object({
      productId: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get product info
      const productResults = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
      if (!productResults || productResults.length === 0) {
        throw new Error('Product not found');
      }
      const product = productResults[0];

      // Get historical demand
      const movements = await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.productId, input.productId))
        .orderBy(stockMovements.createdAt);

      const demandHistory = movements.filter(m => m.movementType === 'out');

      if (demandHistory.length < 7) {
        return {
          productId: input.productId,
          productName: product.name,
          sku: product.sku,
          currentReorderPoint: product.reorderPoint,
          currentReorderQuantity: product.reorderQuantity,
          error: `Insufficient historical data. Need at least 7 days, have ${demandHistory.length}.`,
          message: 'Add stock movements to enable reorder optimization'
        };
      }

      // Calculate demand statistics
      const quantities = demandHistory.map(m => m.quantity);
      const avgDailyDemand = quantities.reduce((a, b) => a + b, 0) / quantities.length;
      const variance = quantities.reduce((sq, n) => sq + Math.pow(n - avgDailyDemand, 2), 0) / quantities.length;
      const demandStdDev = Math.sqrt(variance);

      const productData = {
        productId: product.id,
        currentStock: product.currentStock,
        avgDailyDemand,
        demandStdDev,
        leadTimeDays: 7, // Default lead time
        leadTimeStdDev: 1, // Default lead time variance
        unitCost: parseFloat(product.unitPrice),
        holdingCostPercent: 25, // 25% annual holding cost
        orderCost: 50, // Fixed ordering cost
        stockoutCost: parseFloat(product.unitPrice) * 2, // 2x unit cost
        serviceLevel: 0.95 // 95% service level
      };

      const optimization = await reorderOptimizationService.optimizeReorder(productData);

      try {
        if (reorderOptimizationML.getModelInfo().trained) {
          const mlState = {
            currentStock: productData.currentStock,
            avgDailyDemand: productData.avgDailyDemand,
            demandTrend: 0.1,
            leadTimeDays: productData.leadTimeDays,
            daysUntilStockout: productData.avgDailyDemand > 0 ? productData.currentStock / productData.avgDailyDemand : 999,
            seasonalFactor: 1.0
          };

          const mlOpt = await reorderOptimizationML.predict(mlState);
          optimization.reorderQuantity = mlOpt.orderQuantity;
          optimization.expectedAnnualCost = mlOpt.expectedCost;
          optimization.reasoning = mlOpt.reasoning;
          if (mlOpt.shouldReorder) {
            optimization.urgency = 'critical';
          }
        }
      } catch (err) {
        console.error("Real ML optimizeReorder failed:", err);
      }

      return {
        productId: input.productId,
        productName: product.name,
        sku: product.sku,
        currentReorderPoint: product.reorderPoint,
        currentReorderQuantity: product.reorderQuantity,
        optimizedReorderPoint: optimization.reorderPoint,
        optimizedReorderQuantity: optimization.reorderQuantity,
        safetyStock: optimization.safetyStock,
        expectedAnnualCost: optimization.expectedAnnualCost,
        orderFrequency: optimization.orderFrequency,
        reasoning: optimization.reasoning,
        urgency: optimization.urgency
      };
    }),

  /**
   * Batch Reorder Optimization
   */
  batchOptimizeReorder: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allProducts = await db.select().from(products).limit(50);

      const optimizations = await Promise.all(
        allProducts.map(async (product) => {
          const movements = await db
            .select()
            .from(stockMovements)
            .where(eq(stockMovements.productId, product.id))
            .orderBy(stockMovements.createdAt);

          const demandHistory = movements.filter(m => m.movementType === 'out');

          if (demandHistory.length < 7) {
            return null;
          }

          // Calculate demand statistics
          const quantities = demandHistory.map(m => m.quantity);
          const avgDailyDemand = quantities.reduce((a, b) => a + b, 0) / quantities.length;
          const variance = quantities.reduce((sq, n) => sq + Math.pow(n - avgDailyDemand, 2), 0) / quantities.length;
          const demandStdDev = Math.sqrt(variance);

          const productData = {
            productId: product.id,
            currentStock: product.currentStock,
            avgDailyDemand,
            demandStdDev,
            leadTimeDays: 7,
            leadTimeStdDev: 1,
            unitCost: parseFloat(product.unitPrice),
            holdingCostPercent: 25,
            orderCost: 50,
            stockoutCost: parseFloat(product.unitPrice) * 2,
            serviceLevel: 0.95
          };

          const optimization = await reorderOptimizationService.optimizeReorder(productData);

          try {
            if (reorderOptimizationML.getModelInfo().trained) {
              const mlState = {
                currentStock: productData.currentStock,
                avgDailyDemand: productData.avgDailyDemand,
                demandTrend: 0.1,
                leadTimeDays: productData.leadTimeDays,
                daysUntilStockout: productData.avgDailyDemand > 0 ? productData.currentStock / productData.avgDailyDemand : 999,
                seasonalFactor: 1.0
              };
              const mlOpt = await reorderOptimizationML.predict(mlState);
              optimization.reorderQuantity = mlOpt.orderQuantity;
              optimization.expectedAnnualCost = mlOpt.expectedCost;
              if (mlOpt.shouldReorder) {
                optimization.urgency = 'critical';
              }
            }
          } catch (err) { }

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentReorderPoint: product.reorderPoint,
            currentReorderQuantity: product.reorderQuantity,
            optimizedReorderPoint: optimization.reorderPoint,
            optimizedReorderQuantity: optimization.reorderQuantity,
            safetyStock: optimization.safetyStock,
            expectedAnnualCost: optimization.expectedAnnualCost,
            urgency: optimization.urgency
          };
        })
      );

      const validOptimizations = optimizations.filter(o => o !== null);

      return {
        optimizations: validOptimizations,
        totalProducts: allProducts.length,
        optimizedProducts: validOptimizations.length
      };
    }),

  /**
   * Stock Classification - ML Model
   * Classifies products using ABC analysis (K-Means clustering)
   */
  classifyStock: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allProducts = await db.select().from(products);

      // Get movement data for each product
      const productData = await Promise.all(
        allProducts.map(async (product) => {
          const movements = await db
            .select()
            .from(stockMovements)
            .where(eq(stockMovements.productId, product.id))
            .orderBy(desc(stockMovements.createdAt))
            .limit(100);

          const outboundMovements = movements.filter(m => m.movementType === 'out');
          const totalQuantitySold = outboundMovements.reduce((sum, m) => sum + m.quantity, 0);
          const revenue = totalQuantitySold * parseFloat(product.unitPrice);
          const turnoverRate = product.currentStock > 0
            ? totalQuantitySold / product.currentStock
            : 0;
          const movementFrequency = outboundMovements.length;

          // Calculate days in stock (from first movement to now)
          const firstMovement = movements.length > 0 ? movements[movements.length - 1].createdAt : new Date();
          const daysInStock = Math.floor((Date.now() - firstMovement.getTime()) / (1000 * 60 * 60 * 24));

          // Calculate average order size
          const avgOrderSize = outboundMovements.length > 0
            ? totalQuantitySold / outboundMovements.length
            : 0;

          return {
            productId: product.id,
            productName: product.name,
            totalQuantitySold,
            totalRevenue: revenue,
            turnoverRate,
            movementFrequency,
            avgOrderSize,
            daysInStock
          };
        })
      );

      const result = await stockClassificationService.classifyProducts(productData);

      try {
        if (!stockClassificationML.getModelInfo().trained) {
          await stockClassificationML.train(productData);
        }
        const realClusters = await stockClassificationML.predict(productData);

        const classMap = new Map();
        realClusters.forEach(c => classMap.set(c.productId, c.class));

        result.classifications.forEach(c => {
          if (classMap.has(c.productId)) {
            c.class = classMap.get(c.productId)!;
            if (c.class === 'A') c.priority = 'high';
            else if (c.class === 'B') c.priority = 'medium';
            else c.priority = 'low';
          }
        });
      } catch (err) {
        console.error("Real ML classifyStock failed:", err);
      }

      return {
        classifications: result.classifications,
        summary: result.summary
      };
    })
});