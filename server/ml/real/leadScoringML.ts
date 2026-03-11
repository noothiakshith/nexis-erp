/**
 * REAL ML: Lead Scoring using Logistic Regression
 * Trains on historical conversion data to predict probability
 */

import * as tf from '@tensorflow/tfjs';

interface LeadFeatures {
  engagementScore: number;
  companySize: number;
  industryScore: number; // Encoded industry value
  interactionCount: number;
  emailOpenRate: number;
  websiteVisits: number;
  demoRequested: number; // 0 or 1
  budgetRange: number;
  decisionMaker: number; // 0 or 1
  responseTime: number;
}

interface TrainingData {
  features: LeadFeatures;
  converted: boolean; // Target variable
}

interface PredictionResult {
  probability: number;
  category: 'hot' | 'warm' | 'cold';
  confidence: number;
}

export class LeadScoringML {
  private model: tf.Sequential | null = null;
  private scaler: { mean: number[]; std: number[] } | null = null;
  private trained: boolean = false;

  /**
   * Train logistic regression model
   */
  async train(trainingData: TrainingData[]): Promise<void> {
    if (trainingData.length < 10) {
      throw new Error('Need at least 10 training samples');
    }

    // Extract features and labels
    const features = trainingData.map(d => this.featuresToArray(d.features));
    const labels = trainingData.map(d => d.converted ? 1 : 0);

    // Normalize features
    const { normalized, mean, std } = this.normalizeFeatures(features);
    this.scaler = { mean, std };

    // Create tensors
    const xs = tf.tensor2d(normalized);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Build logistic regression model
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10],
          units: 1,
          activation: 'sigmoid',
          kernelInitializer: 'glorotUniform'
        })
      ]
    });

    // Compile with binary crossentropy loss
    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Train model
    await this.model.fit(xs, ys, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, acc = ${logs?.acc.toFixed(4)}`);
          }
        }
      }
    });

    this.trained = true;
    console.log('✅ Logistic regression model trained');

    // Cleanup
    xs.dispose();
    ys.dispose();
  }

  /**
   * Predict conversion probability
   */
  async predict(features: LeadFeatures): Promise<PredictionResult> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    // Convert to array and normalize
    const featureArray = this.featuresToArray(features);
    const normalized = featureArray.map((val, i) => 
      (val - this.scaler!.mean[i]) / this.scaler!.std[i]
    );

    // Predict
    const input = tf.tensor2d([normalized]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const probability = (await prediction.data())[0];

    // Cleanup
    input.dispose();
    prediction.dispose();

    // Categorize
    let category: 'hot' | 'warm' | 'cold';
    if (probability >= 0.7) category = 'hot';
    else if (probability >= 0.4) category = 'warm';
    else category = 'cold';

    // Confidence based on distance from decision boundary (0.5)
    const confidence = Math.abs(probability - 0.5) * 2;

    return {
      probability: Math.round(probability * 100) / 100,
      category,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Convert features object to array
   */
  private featuresToArray(features: LeadFeatures): number[] {
    return [
      features.engagementScore,
      features.companySize,
      features.industryScore,
      features.interactionCount,
      features.emailOpenRate,
      features.websiteVisits,
      features.demoRequested,
      features.budgetRange,
      features.decisionMaker,
      features.responseTime
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
   * Evaluate model on test data
   */
  async evaluate(testData: TrainingData[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
  }> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained');
    }

    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const data of testData) {
      const result = await this.predict(data.features);
      const predicted = result.probability >= 0.5;
      const actual = data.converted;

      if (predicted && actual) truePositives++;
      else if (predicted && !actual) falsePositives++;
      else if (!predicted && !actual) trueNegatives++;
      else falseNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / testData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      precision: Math.round(precision * 100) / 100,
      recall: Math.round(recall * 100) / 100
    };
  }

  /**
   * Save model to disk
   */
  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }
    await this.model.save(`file://${path}`);
    console.log(`✅ Model saved to ${path}`);
  }

  /**
   * Load model from disk
   */
  async loadModel(path: string, scaler: { mean: number[]; std: number[] }): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}/model.json`) as tf.Sequential;
    this.scaler = scaler;
    this.trained = true;
    console.log(`✅ Model loaded from ${path}`);
  }

  getModelInfo(): { trained: boolean; features: number } {
    return {
      trained: this.trained,
      features: 10
    };
  }
}

export const leadScoringML = new LeadScoringML();
