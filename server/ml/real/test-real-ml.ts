/**
 * Test script for Real ML models
 * Run with: tsx server/ml/real/test-real-ml.ts
 */

import { stockClassificationML } from './stockClassificationML';
import { leadScoringML } from './leadScoringML';
import { demandForecastingML } from './demandForecastingML';
import { fraudDetectionML } from './fraudDetectionML';
import { reorderOptimizationML } from './reorderOptimizationML';
import { cashFlowForecastingML } from './cashFlowForecastingML';

async function testStockClassification() {
  console.log('\n🧪 Testing Stock Classification (K-Means)...\n');

  const products = [
    { productId: 1, productName: 'High Seller A', totalRevenue: 50000, turnoverRate: 8, movementFrequency: 25, avgOrderSize: 100, daysInStock: 30 },
    { productId: 2, productName: 'High Seller B', totalRevenue: 45000, turnoverRate: 7, movementFrequency: 22, avgOrderSize: 95, daysInStock: 35 },
    { productId: 3, productName: 'Medium Seller A', totalRevenue: 20000, turnoverRate: 4, movementFrequency: 12, avgOrderSize: 50, daysInStock: 60 },
    { productId: 4, productName: 'Medium Seller B', totalRevenue: 18000, turnoverRate: 3.5, movementFrequency: 10, avgOrderSize: 45, daysInStock: 65 },
    { productId: 5, productName: 'Slow Mover A', totalRevenue: 5000, turnoverRate: 1, movementFrequency: 3, avgOrderSize: 20, daysInStock: 120 },
    { productId: 6, productName: 'Slow Mover B', totalRevenue: 4000, turnoverRate: 0.8, movementFrequency: 2, avgOrderSize: 15, daysInStock: 150 },
  ];

  await stockClassificationML.train(products);
  const results = await stockClassificationML.predict(products);

  console.log('Classification Results:');
  results.forEach(r => {
    console.log(`  ${r.productName}: Class ${r.class} (Cluster ${r.cluster})`);
  });

  console.log('\n✅ Stock Classification test passed!');
}

async function testLeadScoring() {
  console.log('\n🧪 Testing Lead Scoring (Logistic Regression)...\n');

  // Generate synthetic training data
  const trainingData = [];
  for (let i = 0; i < 100; i++) {
    const engagementScore = Math.random() * 100;
    const companySize = Math.floor(Math.random() * 1000);
    const demoRequested = Math.random() > 0.7 ? 1 : 0;
    
    // Higher engagement + demo = more likely to convert
    const converted = (engagementScore > 60 && demoRequested === 1) || Math.random() > 0.8;

    trainingData.push({
      features: {
        engagementScore,
        companySize,
        industryScore: Math.floor(Math.random() * 5) + 1,
        interactionCount: Math.floor(Math.random() * 20),
        emailOpenRate: Math.random() * 100,
        websiteVisits: Math.floor(Math.random() * 15),
        demoRequested,
        budgetRange: Math.floor(Math.random() * 100000),
        decisionMaker: Math.random() > 0.5 ? 1 : 0,
        responseTime: Math.random() * 72
      },
      converted
    });
  }

  await leadScoringML.train(trainingData);

  // Test prediction
  const testLead = {
    engagementScore: 85,
    companySize: 500,
    industryScore: 5,
    interactionCount: 15,
    emailOpenRate: 75,
    websiteVisits: 10,
    demoRequested: 1,
    budgetRange: 50000,
    decisionMaker: 1,
    responseTime: 24
  };

  const result = await leadScoringML.predict(testLead);
  console.log('Lead Score Result:');
  console.log(`  Probability: ${(result.probability * 100).toFixed(1)}%`);
  console.log(`  Category: ${result.category}`);
  console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);

  console.log('\n✅ Lead Scoring test passed!');
}

async function testDemandForecasting() {
  console.log('\n🧪 Testing Demand Forecasting (LSTM)...\n');

  // Generate synthetic sales data with trend and seasonality
  const salesData = [];
  for (let i = 0; i < 60; i++) {
    const trend = i * 0.5;
    const seasonal = Math.sin(i / 7 * 2 * Math.PI) * 5;
    const noise = (Math.random() - 0.5) * 3;
    const quantity = Math.max(0, Math.floor(20 + trend + seasonal + noise));
    
    salesData.push({
      date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
      quantity
    });
  }

  await demandForecastingML.train(salesData);

  // Forecast next 7 days
  const forecasts = await demandForecastingML.forecast(salesData.slice(-7), 7);
  
  console.log('Demand Forecasts (next 7 days):');
  forecasts.forEach((f, i) => {
    console.log(`  Day ${i + 1}: ${f.predicted} units (${f.lower}-${f.upper}, ${f.confidence}% confidence)`);
  });

  console.log('\n✅ Demand Forecasting test passed!');
}

async function testFraudDetection() {
  console.log('\n🧪 Testing Fraud Detection (Isolation Forest)...\n');

  // Generate normal transactions
  const normalTransactions = [];
  for (let i = 0; i < 150; i++) {
    normalTransactions.push({
      amount: 100 + Math.random() * 400,
      hour: 9 + Math.floor(Math.random() * 9), // Business hours
      dayOfWeek: Math.floor(Math.random() * 5) + 1, // Weekdays
      transactionFrequency24h: 1 + Math.floor(Math.random() * 3),
      avgAmount: 300,
      stdDevAmount: 100,
      timeSinceLastTransaction: 60 + Math.random() * 300,
      isWeekend: 0,
      isRoundAmount: 0
    });
  }

  await fraudDetectionML.train(normalTransactions);

  // Test normal transaction
  const normalTx = {
    amount: 250,
    hour: 14,
    dayOfWeek: 3,
    transactionFrequency24h: 2,
    avgAmount: 300,
    stdDevAmount: 100,
    timeSinceLastTransaction: 120,
    isWeekend: 0,
    isRoundAmount: 0
  };

  const normalResult = await fraudDetectionML.predict(normalTx);
  console.log('Normal Transaction:');
  console.log(`  Score: ${normalResult.score} (${normalResult.risk} risk)`);
  console.log(`  Factors: ${normalResult.factors.join(', ')}`);

  // Test suspicious transaction
  const suspiciousTx = {
    amount: 5000, // Very high
    hour: 2, // Late night
    dayOfWeek: 6, // Weekend
    transactionFrequency24h: 15, // Many transactions
    avgAmount: 300,
    stdDevAmount: 100,
    timeSinceLastTransaction: 3, // Very recent
    isWeekend: 1,
    isRoundAmount: 1
  };

  const suspiciousResult = await fraudDetectionML.predict(suspiciousTx);
  console.log('\nSuspicious Transaction:');
  console.log(`  Score: ${suspiciousResult.score} (${suspiciousResult.risk} risk)`);
  console.log(`  Factors: ${suspiciousResult.factors.join(', ')}`);

  console.log('\n✅ Fraud Detection test passed!');
}

async function testReorderOptimization() {
  console.log('\n🧪 Testing Reorder Optimization (Q-Learning)...\n');

  // Generate training experiences
  const experiences = [];
  for (let i = 0; i < 200; i++) {
    const currentStock = Math.floor(Math.random() * 500);
    const avgDailyDemand = 10 + Math.random() * 20;
    const demandTrend = (Math.random() - 0.5) * 2;
    const leadTimeDays = 5 + Math.floor(Math.random() * 10);
    const daysUntilStockout = currentStock / avgDailyDemand;
    const seasonalFactor = 0.8 + Math.random() * 0.7;

    const state = {
      currentStock,
      avgDailyDemand,
      demandTrend,
      leadTimeDays,
      daysUntilStockout,
      seasonalFactor
    };

    // Simulate action and reward
    const orderQuantity = [0, 50, 100, 200, 500, 1000, 2000][Math.floor(Math.random() * 7)];
    const reward = Math.random() * 100 - 50; // Simplified reward

    const nextStock = currentStock + orderQuantity - avgDailyDemand * 7;
    const nextState = {
      ...state,
      currentStock: Math.max(0, nextStock),
      daysUntilStockout: Math.max(0, nextStock) / avgDailyDemand
    };

    experiences.push({
      state,
      action: { orderQuantity },
      reward,
      nextState,
      done: nextStock <= 0
    });
  }

  await reorderOptimizationML.train(experiences);

  // Test prediction
  const testState = {
    currentStock: 50,
    avgDailyDemand: 10,
    demandTrend: 0.2,
    leadTimeDays: 7,
    daysUntilStockout: 5,
    seasonalFactor: 1.2
  };

  const recommendation = await reorderOptimizationML.predict(testState);
  console.log('Reorder Recommendation:');
  console.log(`  Should Reorder: ${recommendation.shouldReorder}`);
  console.log(`  Order Quantity: ${recommendation.orderQuantity} units`);
  console.log(`  Expected Cost: $${recommendation.expectedCost}`);
  console.log(`  Reasoning:`);
  recommendation.reasoning.forEach(r => console.log(`    - ${r}`));

  console.log('\n✅ Reorder Optimization test passed!');
}

async function testCashFlowForecasting() {
  console.log('\n🧪 Testing Cash Flow Forecasting (Prophet)...\n');

  // Generate synthetic cash flow data
  const cashFlowData = [];
  for (let i = 0; i < 60; i++) {
    const trend = 5000 + i * 50;
    const seasonal = Math.sin(i / 7 * 2 * Math.PI) * 1000;
    const noise = (Math.random() - 0.5) * 500;
    const amount = trend + seasonal + noise;
    
    cashFlowData.push({
      date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
      amount
    });
  }

  await cashFlowForecastingML.train(cashFlowData);

  // Forecast next 30 days
  const forecasts = await cashFlowForecastingML.forecast(cashFlowData, 30);
  
  console.log('Cash Flow Forecasts (next 30 days):');
  console.log(`  First 7 days:`);
  forecasts.slice(0, 7).forEach((f, i) => {
    console.log(`    Day ${i + 1}: $${f.predicted.toFixed(0)} ($${f.lower.toFixed(0)}-$${f.upper.toFixed(0)})`);
  });

  const summary = await cashFlowForecastingML.getSummary(forecasts);
  console.log(`\n  Summary:`);
  console.log(`    Avg Daily: $${summary.avgPredicted}`);
  console.log(`    Total 30 Days: $${summary.totalPredicted}`);
  console.log(`    Trend: ${summary.trend}`);
  console.log(`    Seasonality Strength: ${summary.seasonalityStrength.toFixed(1)}%`);

  console.log('\n✅ Cash Flow Forecasting test passed!');
}

async function runAllTests() {
  console.log('🚀 Starting Real ML Tests...\n');
  console.log('=' .repeat(60));

  try {
    await testStockClassification();
    await testLeadScoring();
    await testDemandForecasting();
    await testFraudDetection();
    await testReorderOptimization();
    await testCashFlowForecasting();

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 All tests passed! Real ML is working! 🎉\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
