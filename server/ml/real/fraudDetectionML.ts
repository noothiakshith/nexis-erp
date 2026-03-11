/**
 * REAL ML: Fraud Detection using Isolation Forest
 * Detects anomalies in transaction patterns
 */

import * as tf from '@tensorflow/tfjs';

interface TransactionFeatures {
  amount: number;
  hour: number;
  dayOfWeek: number;
  transactionFrequency24h: number;
  avgAmount: number;
  stdDevAmount: number;
  timeSinceLastTransaction: number; // minutes
  isWeekend: number; // 0 or 1
  isRoundAmount: number; // 0 or 1
}

interface AnomalyScore {
  score: number; // 0-1, higher = more anomalous
  risk: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: string[];
}

/**
 * Simplified Isolation Forest implementation
 * In production, use a proper library or Python backend
 */
export class FraudDetectionML {
  private trees: IsolationTree[] = [];
  private numTrees: number = 100;
  private sampleSize: number = 256;
  private scaler: { mean: number[]; std: number[] } | null = null;
  private trained: boolean = false;

  /**
   * Train Isolation Forest on normal transaction data
   */
  async train(normalTransactions: TransactionFeatures[]): Promise<void> {
    if (normalTransactions.length < 100) {
      throw new Error('Need at least 100 transactions for training');
    }

    // Convert to feature arrays
    const features = normalTransactions.map(t => this.featuresToArray(t));

    // Normalize features
    const { normalized, mean, std } = this.normalizeFeatures(features);
    this.scaler = { mean, std };

    // Build isolation trees
    this.trees = [];
    for (let i = 0; i < this.numTrees; i++) {
      // Random sample
      const sample = this.randomSample(normalized, this.sampleSize);

      // Build tree
      const tree = this.buildTree(sample, 0, Math.ceil(Math.log2(this.sampleSize)));
      this.trees.push(tree);
    }

    this.trained = true;
    console.log(`✅ Isolation Forest trained with ${this.numTrees} trees`);
  }

  /**
   * Predict anomaly score
   */
  async predict(transaction: TransactionFeatures): Promise<AnomalyScore> {
    if (!this.trained || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    // Convert and normalize
    const featureArray = this.featuresToArray(transaction);
    const normalized = featureArray.map((val, i) =>
      (val - this.scaler!.mean[i]) / this.scaler!.std[i]
    );

    // Calculate average path length across all trees
    const pathLengths = this.trees.map(tree => this.pathLength(tree, normalized, 0));
    const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;

    // Normalize to anomaly score (0-1)
    const c = this.averagePathLength(this.sampleSize);
    const anomalyScore = Math.pow(2, -avgPathLength / c);

    // Identify factors
    const factors = this.identifyAnomalyFactors(transaction, featureArray);

    // Determine risk level
    let risk: 'low' | 'medium' | 'high' | 'critical';
    if (anomalyScore >= 0.7) risk = 'critical';
    else if (anomalyScore >= 0.6) risk = 'high';
    else if (anomalyScore >= 0.5) risk = 'medium';
    else risk = 'low';

    // Confidence based on consistency across trees
    const pathLengthStd = this.standardDeviation(pathLengths);
    const confidence = 1 - Math.min(1, pathLengthStd / avgPathLength);

    return {
      score: Math.round(anomalyScore * 100) / 100,
      risk,
      confidence: Math.round(confidence * 100) / 100,
      factors
    };
  }

  /**
   * Build isolation tree recursively
   */
  private buildTree(data: number[][], depth: number, maxDepth: number): IsolationTree {
    if (depth >= maxDepth || data.length <= 1) {
      return { type: 'leaf', size: data.length };
    }

    // Random feature and split value
    const feature = Math.floor(Math.random() * data[0].length);
    const values = data.map(d => d[feature]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return { type: 'leaf', size: data.length };
    }

    const splitValue = min + Math.random() * (max - min);

    // Split data
    const left = data.filter(d => d[feature] < splitValue);
    const right = data.filter(d => d[feature] >= splitValue);

    return {
      type: 'node',
      feature,
      splitValue,
      left: this.buildTree(left, depth + 1, maxDepth),
      right: this.buildTree(right, depth + 1, maxDepth)
    };
  }

  /**
   * Calculate path length for a sample
   */
  private pathLength(tree: IsolationTree, sample: number[], depth: number): number {
    if (tree.type === 'leaf') {
      return depth + this.averagePathLength(tree.size || 0);
    }

    if (sample[tree.feature!] < tree.splitValue!) {
      return this.pathLength(tree.left!, sample, depth + 1);
    } else {
      return this.pathLength(tree.right!, sample, depth + 1);
    }
  }

  /**
   * Average path length for unsuccessful search in BST
   */
  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    const H = Math.log(n - 1) + 0.5772156649; // Euler's constant
    return 2 * H - (2 * (n - 1) / n);
  }

  /**
   * Identify which features are anomalous
   */
  private identifyAnomalyFactors(
    transaction: TransactionFeatures,
    features: number[]
  ): string[] {
    const factors: string[] = [];

    if (transaction.amount > transaction.avgAmount + 2 * transaction.stdDevAmount) {
      factors.push(`Amount ${Math.round(transaction.amount)} is unusually high`);
    }

    if (transaction.hour < 6 || transaction.hour > 22) {
      factors.push('Transaction at unusual hour');
    }

    if (transaction.transactionFrequency24h > 10) {
      factors.push(`${transaction.transactionFrequency24h} transactions in 24h`);
    }

    if (transaction.timeSinceLastTransaction < 5) {
      factors.push('Multiple transactions within minutes');
    }

    if (transaction.isRoundAmount === 1 && transaction.amount >= 1000) {
      factors.push('Suspiciously round amount');
    }

    return factors.length > 0 ? factors : ['Normal transaction pattern'];
  }

  /**
   * Convert features to array
   */
  private featuresToArray(features: TransactionFeatures): number[] {
    return [
      features.amount,
      features.hour,
      features.dayOfWeek,
      features.transactionFrequency24h,
      features.avgAmount,
      features.stdDevAmount,
      features.timeSinceLastTransaction,
      features.isWeekend,
      features.isRoundAmount
    ];
  }

  /**
   * Normalize features
   */
  private normalizeFeatures(features: number[][]): {
    normalized: number[][];
    mean: number[];
    std: number[];
  } {
    const numFeatures = features[0].length;
    const mean: number[] = [];
    const std: number[] = [];

    for (let j = 0; j < numFeatures; j++) {
      const values = features.map(f => f[j]);
      const m = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / values.length;
      const s = Math.sqrt(variance) || 1;

      mean.push(m);
      std.push(s);
    }

    const normalized = features.map(f =>
      f.map((val, i) => (val - mean[i]) / std[i])
    );

    return { normalized, mean, std };
  }

  /**
   * Random sample without replacement
   */
  private randomSample(data: number[][], size: number): number[][] {
    const sample: number[][] = [];
    const indices = new Set<number>();

    while (sample.length < Math.min(size, data.length)) {
      const idx = Math.floor(Math.random() * data.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        sample.push(data[idx]);
      }
    }

    return sample;
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  getModelInfo(): { trained: boolean; trees: number; sampleSize: number } {
    return {
      trained: this.trained,
      trees: this.numTrees,
      sampleSize: this.sampleSize
    };
  }
}

interface IsolationTree {
  type: 'node' | 'leaf';
  feature?: number;
  splitValue?: number;
  left?: IsolationTree;
  right?: IsolationTree;
  size?: number;
}

export const fraudDetectionML = new FraudDetectionML();
