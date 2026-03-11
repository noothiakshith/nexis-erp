/**
 * ML Training Pipeline
 * Orchestrates data collection, feature engineering, training, and model storage
 */

import { getDb } from '../../db';
import {
  products,
  stockMovements,
  leads,
  payments,
  invoices,
  expenses
} from '../../../drizzle/schema';
import { sql, desc, gte } from 'drizzle-orm';
import { stockClassificationML } from './stockClassificationML';
import { leadScoringML } from './leadScoringML';
import { demandForecastingML } from './demandForecastingML';
import { fraudDetectionML } from './fraudDetectionML';
import { reorderOptimizationML } from './reorderOptimizationML';
import { cashFlowForecastingML } from './cashFlowForecastingML';

export class MLPipeline {
  /**
   * Train all ML models
   */
  async trainAllModels(): Promise<{
    success: boolean;
    results: { [model: string]: { trained: boolean; error?: string } };
  }> {
    console.log('🚀 Starting ML training pipeline...\n');

    const results: { [model: string]: { trained: boolean; error?: string } } = {};

    // 1. Stock Classification
    try {
      console.log('📦 Training Stock Classification (K-Means)...');
      await this.trainStockClassification();
      results.stockClassification = { trained: true };
    } catch (error) {
      console.error('❌ Stock Classification failed:', error);
      results.stockClassification = {
        trained: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 2. Lead Scoring
    try {
      console.log('\n👥 Training Lead Scoring (Logistic Regression)...');
      await this.trainLeadScoring();
      results.leadScoring = { trained: true };
    } catch (error) {
      console.error('❌ Lead Scoring failed:', error);
      results.leadScoring = {
        trained: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 3. Demand Forecasting
    try {
      console.log('\n📈 Training Demand Forecasting (LSTM)...');
      await this.trainDemandForecasting();
      results.demandForecasting = { trained: true };
    } catch (error) {
      console.error('❌ Demand Forecasting failed:', error);
      results.demandForecasting = {
        trained: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 4. Fraud Detection
    try {
      console.log('\n🔒 Training Fraud Detection (Isolation Forest)...');
      await this.trainFraudDetection();
      results.fraudDetection = { trained: true };
    } catch (error) {
      console.error('❌ Fraud Detection failed:', error);
      results.fraudDetection = {
        trained: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 5. Cash Flow Forecasting
    try {
      console.log('\n💰 Training Cash Flow Forecasting (Prophet)...');
      await this.trainCashFlowForecasting();
      results.cashFlowForecasting = { trained: true };
    } catch (error) {
      console.error('❌ Cash Flow Forecasting failed:', error);
      results.cashFlowForecasting = {
        trained: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    console.log('\n✅ ML training pipeline completed!');

    const successCount = Object.values(results).filter(r => r.trained).length;
    const totalCount = Object.keys(results).length;

    return {
      success: successCount === totalCount,
      results
    };
  }

  /**
   * Train Stock Classification model
   */
  private async trainStockClassification(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('DB not available');

    // Fetch product movement data
    const productData = await db
      .select({
        productId: products.id,
        productName: products.name,
        currentStock: products.currentStock,
        unitCost: products.unitPrice
      })
      .from(products)
      .limit(100);

    if (productData.length < 3) {
      throw new Error('Not enough product data');
    }

    // Calculate features for each product
    const features = await Promise.all(
      productData.map(async (product: any) => {
        // Get movements for this product
        const movements = await db
          .select()
          .from(stockMovements)
          .where(sql`${stockMovements.productId} = ${product.productId}`)
          .orderBy(desc(stockMovements.createdAt))
          .limit(90);

        const totalQuantitySold = movements
          .filter((m: any) => m.movementType === 'out')
          .reduce((sum: number, m: any) => sum + Math.abs(m.quantity), 0);

        const totalRevenue = totalQuantitySold * (parseFloat(product.unitCost as string) || 0);
        const daysInStock = movements.length > 0 ? 90 : 0;
        const turnoverRate = daysInStock > 0 ? totalQuantitySold / daysInStock : 0;
        const movementFrequency = movements.length / 3; // Per month
        const avgOrderSize = movements.length > 0 ? totalQuantitySold / movements.length : 0;

        return {
          productId: product.productId,
          productName: product.productName,
          totalRevenue,
          turnoverRate,
          movementFrequency,
          avgOrderSize,
          daysInStock
        };
      })
    );

    // Train model
    await stockClassificationML.train(features);
  }

  /**
   * Train Lead Scoring model
   */
  private async trainLeadScoring(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('DB not available');

    // Fetch lead data
    const leadData = await db
      .select()
      .from(leads)
      .limit(100);

    if (leadData.length < 10) {
      throw new Error('Not enough lead data');
    }

    // Create training data with features
    const trainingData = leadData.map((lead: any) => {
      // Encode industry
      const industryMap: { [key: string]: number } = {
        'technology': 5,
        'finance': 4,
        'healthcare': 4,
        'manufacturing': 3,
        'retail': 2,
        'other': 1
      };

      const industryScore = industryMap[lead.industry?.toLowerCase() || 'other'] || 1;

      return {
        features: {
          engagementScore: Math.random() * 100, // Would come from actual engagement tracking
          companySize: lead.companySize || 50,
          industryScore,
          interactionCount: Math.floor(Math.random() * 20),
          emailOpenRate: Math.random() * 100,
          websiteVisits: Math.floor(Math.random() * 15),
          demoRequested: Math.random() > 0.7 ? 1 : 0,
          budgetRange: (lead.estimatedValue || 10000),
          decisionMaker: Math.random() > 0.5 ? 1 : 0,
          responseTime: Math.random() * 72
        },
        converted: lead.status === 'customer' // Target variable
      };
    });

    // Train model
    await leadScoringML.train(trainingData);
  }

  /**
   * Train Demand Forecasting model
   */
  private async trainDemandForecasting(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('DB not available');

    // Get a sample product
    const sampleProduct = await db
      .select()
      .from(products)
      .limit(1);

    if (sampleProduct.length === 0) {
      throw new Error('No products found');
    }

    // Get historical sales (movements)
    const movements = await db
      .select()
      .from(stockMovements)
      .where(sql`${stockMovements.productId} = ${sampleProduct[0].id}`)
      .orderBy(stockMovements.createdAt)
      .limit(90);

    if (movements.length < 30) {
      // Generate synthetic data for demo
      const salesData = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.floor(10 + Math.random() * 20 + Math.sin(i / 7) * 5)
      }));

      await demandForecastingML.train(salesData);
    } else {
      const salesData = movements.map((m: any) => ({
        date: m.createdAt,
        quantity: Math.abs(m.quantity)
      }));

      await demandForecastingML.train(salesData);
    }
  }

  /**
   * Train Fraud Detection model
   */
  private async trainFraudDetection(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('DB not available');

    // Fetch normal transactions using payments table
    const txData = await db
      .select()
      .from(payments)
      .limit(200);

    if (txData.length < 100) {
      // Generate synthetic normal transactions
      const normalTransactions = Array.from({ length: 150 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const amount = 100 + Math.random() * 500;

        return {
          amount,
          hour: 9 + Math.floor(Math.random() * 9), // Business hours
          dayOfWeek: date.getDay(),
          transactionFrequency24h: 1 + Math.floor(Math.random() * 3),
          avgAmount: 300,
          stdDevAmount: 100,
          timeSinceLastTransaction: 60 + Math.random() * 300,
          isWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
          isRoundAmount: amount % 100 === 0 ? 1 : 0
        };
      });

      await fraudDetectionML.train(normalTransactions);
    } else {
      // Use real transaction data
      const features = txData.map((tx: any) => {
        const d = new Date(tx.paymentDate);
        const amount = parseFloat(tx.amount) || 0;
        return {
          amount,
          hour: d.getHours(),
          dayOfWeek: d.getDay(),
          transactionFrequency24h: 2, // Would calculate from history
          avgAmount: 300,
          stdDevAmount: 100,
          timeSinceLastTransaction: 120,
          isWeekend: d.getDay() === 0 || d.getDay() === 6 ? 1 : 0,
          isRoundAmount: amount % 100 === 0 ? 1 : 0
        };
      });

      await fraudDetectionML.train(features);
    }
  }

  /**
   * Train Cash Flow Forecasting model
   */
  private async trainCashFlowForecasting(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('DB not available');

    // Fetch cash flow data (invoices + expenses)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

    const invoiceData = await db
      .select({
        date: invoices.issueDate,
        amount: invoices.totalAmount
      })
      .from(invoices)
      .where(gte(invoices.issueDate, thirtyDaysAgo))
      .orderBy(invoices.issueDate);

    const expenseData = await db
      .select({
        date: expenses.expenseDate,
        amount: expenses.amount
      })
      .from(expenses)
      .where(gte(expenses.expenseDate, thirtyDaysAgo))
      .orderBy(expenses.expenseDate);

    // Combine into daily cash flow
    const cashFlowMap = new Map<string, number>();

    invoiceData.forEach((inv: any) => {
      const dateKey = inv.date.toISOString().split('T')[0];
      cashFlowMap.set(dateKey, (cashFlowMap.get(dateKey) || 0) + (parseFloat(inv.amount) || 0));
    });

    expenseData.forEach((exp: any) => {
      const dateKey = exp.date.toISOString().split('T')[0];
      cashFlowMap.set(dateKey, (cashFlowMap.get(dateKey) || 0) - (parseFloat(exp.amount) || 0));
    });

    const cashFlowData = Array.from(cashFlowMap.entries())
      .map(([dateStr, amount]) => ({
        date: new Date(dateStr),
        amount
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (cashFlowData.length < 30) {
      // Generate synthetic data
      const syntheticData = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
        amount: 5000 + Math.random() * 3000 + Math.sin(i / 7) * 1000
      }));

      await cashFlowForecastingML.train(syntheticData);
    } else {
      await cashFlowForecastingML.train(cashFlowData);
    }
  }

  /**
   * Get training status for all models
   */
  getTrainingStatus(): {
    [model: string]: { trained: boolean; info: any };
  } {
    return {
      stockClassification: {
        trained: stockClassificationML.getModelInfo().trained,
        info: stockClassificationML.getModelInfo()
      },
      leadScoring: {
        trained: leadScoringML.getModelInfo().trained,
        info: leadScoringML.getModelInfo()
      },
      demandForecasting: {
        trained: demandForecastingML.getModelInfo().trained,
        info: demandForecastingML.getModelInfo()
      },
      fraudDetection: {
        trained: fraudDetectionML.getModelInfo().trained,
        info: fraudDetectionML.getModelInfo()
      },
      reorderOptimization: {
        trained: reorderOptimizationML.getModelInfo().trained,
        info: reorderOptimizationML.getModelInfo()
      },
      cashFlowForecasting: {
        trained: cashFlowForecastingML.getModelInfo().trained,
        info: cashFlowForecastingML.getModelInfo()
      }
    };
  }
}

export const mlPipeline = new MLPipeline();
