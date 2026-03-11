# Real Machine Learning Implementation Guide

## 🎯 Overview

This system has been upgraded from rule-based algorithms to **real machine learning models** using TensorFlow.js and proper ML techniques.

## 📊 What Changed: Rule-Based → Real ML

### 1️⃣ Stock Classification

**Before (Rule-Based):**
```typescript
score = revenue * 0.5 + turnover * 0.3 + frequency * 0.2
```

**After (Real ML - K-Means Clustering):**
- ✅ Unsupervised learning automatically discovers product groups
- ✅ No manual thresholds or weights
- ✅ Features: `[revenue, turnover, frequency, orderSize, daysInStock]`
- ✅ Algorithm: K-Means with k=3 clusters
- ✅ Automatic A/B/C labeling based on cluster characteristics

**Location:** `server/ml/real/stockClassificationML.ts`

---

### 2️⃣ Lead Scoring

**Before (Rule-Based):**
```typescript
score = engagement * 25 + companySize * 15 + industry * 10 + ...
```

**After (Real ML - Logistic Regression):**
- ✅ Trained on historical conversion data
- ✅ Learns which features actually predict conversions
- ✅ Outputs probability (0-1) instead of arbitrary score
- ✅ Features: 10 dimensions including engagement, company size, industry, etc.
- ✅ Binary classification with sigmoid activation

**Location:** `server/ml/real/leadScoringML.ts`

**Training:**
```typescript
await leadScoringML.train(trainingData);
// trainingData = [{ features: {...}, converted: true/false }]
```

**Inference:**
```typescript
const result = await leadScoringML.predict(leadFeatures);
// result = { probability: 0.85, category: 'hot', confidence: 0.92 }
```

---

### 3️⃣ Demand Forecasting

**Before (Statistical):**
```typescript
forecast = trend + seasonality  // Linear regression
```

**After (Real ML - LSTM Neural Network):**
- ✅ Deep learning captures complex temporal patterns
- ✅ Learns from sequences (7 days → predict next day)
- ✅ Architecture: LSTM(50) → LSTM(50) → Dense(25) → Dense(1)
- ✅ Handles non-linear trends and multiple seasonalities
- ✅ Iterative forecasting for multi-step ahead predictions

**Location:** `server/ml/real/demandForecastingML.ts`

**Architecture:**
```
Input: [day1, day2, ..., day7] (7 days)
  ↓
LSTM Layer (50 units, return sequences)
  ↓
Dropout (0.2)
  ↓
LSTM Layer (50 units)
  ↓
Dropout (0.2)
  ↓
Dense Layer (25 units, ReLU)
  ↓
Output: [day8] (next day prediction)
```

---

### 4️⃣ Fraud Detection

**Before (Heuristics):**
```typescript
if (amount > avg + 3*std) anomalyScore += 30;
if (hour < 6 || hour > 22) anomalyScore += 20;
```

**After (Real ML - Isolation Forest):**
- ✅ Unsupervised anomaly detection
- ✅ Learns normal transaction patterns
- ✅ Detects unknown fraud patterns automatically
- ✅ 100 isolation trees for robust detection
- ✅ Features: amount, time, frequency, patterns

**Location:** `server/ml/real/fraudDetectionML.ts`

**How Isolation Forest Works:**
1. Build 100 random decision trees on normal transactions
2. Anomalies are isolated faster (shorter path length)
3. Anomaly score = 2^(-avgPathLength / c)
4. Score > 0.7 = Critical risk

---

### 5️⃣ Reorder Optimization

**Before (EOQ Formula):**
```typescript
eoq = sqrt((2 * demand * orderCost) / holdingCost)
```

**After (Real ML - Deep Q-Learning):**
- ✅ Reinforcement learning learns optimal policy
- ✅ State: [stock, demand, trend, leadTime, daysToStockout, seasonal]
- ✅ Action: order quantity (discretized: 0, 50, 100, 200, 500, 1000, 2000)
- ✅ Reward: profit - holding cost - ordering cost - stockout cost
- ✅ Q-Network learns when and how much to order

**Location:** `server/ml/real/reorderOptimizationML.ts`

**Q-Learning Process:**
```
State → Q-Network → Q-values for each action → Select best action
                ↓
            Experience replay
                ↓
            Train network
```

---

### 6️⃣ Cash Flow Forecasting

**Before (Simple Trend + Seasonality):**
```typescript
forecast = linearTrend + weeklySeasonality
```

**After (Real ML - Prophet-like Algorithm):**
- ✅ Neural network learns trend component
- ✅ Fourier series for seasonality
- ✅ Automatic changepoint detection
- ✅ Handles holidays and special events
- ✅ Uncertainty quantification

**Location:** `server/ml/real/cashFlowForecastingML.ts`

**Components:**
- **Trend:** Neural network (Dense layers)
- **Seasonality:** Weekly pattern learned from data
- **Uncertainty:** Confidence intervals that widen over time

---

## 🏗️ ML Architecture

### Data Pipeline

```
Database
   ↓
Feature Engineering (mlPipeline.ts)
   ↓
Normalization (Z-score or Min-Max)
   ↓
Model Training
   ↓
Model Storage (in-memory or disk)
   ↓
Inference API (tRPC routes)
   ↓
Frontend
```

### Training Pipeline

**File:** `server/ml/real/mlPipeline.ts`

**Train all models:**
```typescript
import { mlPipeline } from './server/ml/real/mlPipeline';

const results = await mlPipeline.trainAllModels();
// Trains all 6 ML models from database data
```

**Check training status:**
```typescript
const status = mlPipeline.getTrainingStatus();
// Returns: { stockClassification: { trained: true, info: {...} }, ... }
```

---

## 🔌 API Usage

### tRPC Routes

**File:** `server/routers/mlReal.ts`

All ML models are exposed via tRPC:

```typescript
// Train all models
await trpc.mlReal.trainAllModels.mutate();

// Get training status
const status = await trpc.mlReal.getTrainingStatus.query();

// Stock Classification
const classifications = await trpc.mlReal.classifyProducts.mutate({
  products: [{ productId, productName, totalRevenue, ... }]
});

// Lead Scoring
const score = await trpc.mlReal.scoreLead.mutate({
  engagementScore: 85,
  companySize: 500,
  industryScore: 5,
  ...
});

// Demand Forecasting
const forecasts = await trpc.mlReal.forecastDemand.mutate({
  recentSales: [{ date, quantity }, ...],
  daysAhead: 30
});

// Fraud Detection
const fraudScore = await trpc.mlReal.detectFraud.mutate({
  amount: 5000,
  hour: 23,
  dayOfWeek: 6,
  ...
});

// Reorder Optimization
const recommendation = await trpc.mlReal.optimizeReorder.mutate({
  currentStock: 50,
  avgDailyDemand: 10,
  demandTrend: 0.2,
  ...
});

// Cash Flow Forecasting
const cashFlowForecasts = await trpc.mlReal.forecastCashFlow.mutate({
  historicalData: [{ date, amount }, ...],
  daysAhead: 90
});
```

---

## 📦 Dependencies

```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-node": "^4.22.0",
  "ml-kmeans": "^7.0.0",
  "ml-matrix": "^6.12.1"
}
```

**Installed via:**
```bash
pnpm add @tensorflow/tfjs @tensorflow/tfjs-node ml-kmeans ml-matrix
```

---

## 🚀 Getting Started

### 1. Train Models

```bash
# Start the server
pnpm dev

# In another terminal or via API:
curl -X POST http://localhost:3000/api/trpc/mlReal.trainAllModels
```

Or programmatically:
```typescript
import { mlPipeline } from './server/ml/real/mlPipeline';
await mlPipeline.trainAllModels();
```

### 2. Use Models for Inference

Once trained, models are ready for predictions:

```typescript
// Example: Score a lead
const leadScore = await leadScoringML.predict({
  engagementScore: 75,
  companySize: 250,
  industryScore: 4,
  interactionCount: 8,
  emailOpenRate: 65,
  websiteVisits: 12,
  demoRequested: 1,
  budgetRange: 50000,
  decisionMaker: 1,
  responseTime: 24
});

console.log(leadScore);
// { probability: 0.78, category: 'hot', confidence: 0.85 }
```

---

## 📊 Model Performance

### Evaluation Metrics

Each model includes evaluation methods:

```typescript
// Lead Scoring
const metrics = await leadScoringML.evaluate(testData);
// { accuracy: 0.87, precision: 0.82, recall: 0.91 }

// Demand Forecasting
const metrics = await demandForecastingML.evaluate(testSales);
// { mae: 5.2, rmse: 7.8, mape: 12.5 }
```

---

## 💾 Model Persistence

Models can be saved and loaded:

```typescript
// Save
await leadScoringML.saveModel('./models/lead-scoring');

// Load
await leadScoringML.loadModel('./models/lead-scoring', scaler);
```

---

## 🔄 Retraining Schedule

For production, set up periodic retraining:

```typescript
import cron from 'node-cron';

// Retrain daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily ML retraining...');
  await mlPipeline.trainAllModels();
  console.log('Retraining complete!');
});
```

---

## 🎓 ML vs Rule-Based Comparison

| Feature | Rule-Based | Real ML |
|---------|-----------|---------|
| **Adaptability** | Manual updates needed | Learns from data automatically |
| **Accuracy** | Fixed thresholds | Improves with more data |
| **Complexity** | Simple patterns only | Captures complex patterns |
| **Maintenance** | High (manual tuning) | Low (automatic learning) |
| **Explainability** | High | Medium (feature importance) |
| **Scalability** | Limited | Excellent |
| **New Patterns** | Requires code changes | Detected automatically |

---

## 🧪 Testing

Test individual models:

```typescript
// Test stock classification
import { stockClassificationML } from './server/ml/real/stockClassificationML';

const testProducts = [
  { productId: 1, productName: 'Product A', totalRevenue: 50000, ... },
  { productId: 2, productName: 'Product B', totalRevenue: 10000, ... },
];

await stockClassificationML.train(testProducts);
const results = await stockClassificationML.predict(testProducts);

console.log(results);
// [{ productId: 1, cluster: 0, class: 'A', ... }, ...]
```

---

## 📈 Next Steps

### Production Enhancements

1. **Model Registry:** Use MLflow or similar for model versioning
2. **Feature Store:** Centralized feature management
3. **A/B Testing:** Compare model versions
4. **Monitoring:** Track model performance over time
5. **Auto-retraining:** Trigger retraining on data drift
6. **GPU Support:** Use TensorFlow GPU for faster training
7. **Distributed Training:** Scale to larger datasets

### Advanced Models

1. **XGBoost/LightGBM:** For better tabular data performance
2. **Transformer Models:** For time series forecasting
3. **Ensemble Methods:** Combine multiple models
4. **AutoML:** Automatic hyperparameter tuning

---

## 🐛 Troubleshooting

### Model Not Trained Error

```
Error: Model not trained. Call train() first.
```

**Solution:** Train the model before inference:
```typescript
await mlPipeline.trainAllModels();
```

### Insufficient Data Error

```
Error: Need at least X samples for training
```

**Solution:** Ensure database has enough historical data or use synthetic data for testing.

### TensorFlow Memory Issues

**Solution:** Dispose tensors after use:
```typescript
const tensor = tf.tensor([1, 2, 3]);
// ... use tensor ...
tensor.dispose();
```

---

## 📚 Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [K-Means Clustering](https://en.wikipedia.org/wiki/K-means_clustering)
- [Logistic Regression](https://en.wikipedia.org/wiki/Logistic_regression)
- [LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [Isolation Forest](https://en.wikipedia.org/wiki/Isolation_forest)
- [Q-Learning](https://en.wikipedia.org/wiki/Q-learning)
- [Prophet Algorithm](https://facebook.github.io/prophet/)

---

## ✅ Summary

You now have a **real machine learning system** with:

✅ **6 trained ML models** (K-Means, Logistic Regression, LSTM, Isolation Forest, Q-Learning, Prophet)  
✅ **Automatic learning** from historical data  
✅ **No manual thresholds** or rules  
✅ **Production-ready architecture** with training pipeline  
✅ **tRPC API** for easy integration  
✅ **Model persistence** for saving/loading  
✅ **Evaluation metrics** for performance tracking  

This is **real AI**, not just formulas! 🚀
