/**
 * REAL ML: Stock Classification using K-Means Clustering
 * Uses TensorFlow.js for actual unsupervised learning
 */

import * as tf from '@tensorflow/tfjs';
// @ts-ignore - ml-kmeans types
import { kmeans as KMeansAlgo } from 'ml-kmeans';

interface ProductFeatures {
  productId: number;
  productName: string;
  totalRevenue: number;
  turnoverRate: number;
  movementFrequency: number;
  avgOrderSize: number;
  daysInStock: number;
}

interface ClusterResult {
  productId: number;
  productName: string;
  cluster: number; // 0, 1, 2
  class: 'A' | 'B' | 'C';
  features: number[];
  centroidDistance: number;
}

export class StockClassificationML {
  private model: any = null;
  private scaler: { mean: number[]; std: number[] } | null = null;

  /**
   * Train K-Means clustering model on product data
   */
  async train(products: ProductFeatures[]): Promise<void> {
    if (products.length < 3) {
      throw new Error('Need at least 3 products for clustering');
    }

    // Extract features
    const features = products.map(p => [
      p.totalRevenue,
      p.turnoverRate,
      p.movementFrequency,
      p.avgOrderSize,
      p.daysInStock
    ]);

    // Normalize features (Z-score normalization)
    const { normalized, mean, std } = this.normalizeFeatures(features);
    this.scaler = { mean, std };

    // Train K-Means with k=3 clusters
    this.model = KMeansAlgo(normalized, 3, {
      initialization: 'kmeans++',
      maxIterations: 100
    }) as any;

    console.log('✅ K-Means model trained with 3 clusters');
  }

  /**
   * Predict cluster for products
   */
  async predict(products: ProductFeatures[]): Promise<ClusterResult[]> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    const features = products.map(p => [
      p.totalRevenue,
      p.turnoverRate,
      p.movementFrequency,
      p.avgOrderSize,
      p.daysInStock
    ]);

    // Normalize using training scaler
    const normalized = features.map(f => 
      f.map((val, i) => (val - this.scaler!.mean[i]) / this.scaler!.std[i])
    );

    // Predict clusters
    const predictions = this.model.nearest(normalized);

    // Calculate cluster characteristics to assign A/B/C labels
    const clusterStats = this.calculateClusterStats(products, predictions);
    const clusterLabels = this.assignClusterLabels(clusterStats);

    // Build results
    return products.map((product, i) => {
      const cluster = predictions[i];
      const centroidDistance = this.calculateDistance(
        normalized[i],
        this.model!.centroids[cluster]
      );

      return {
        productId: product.productId,
        productName: product.productName,
        cluster,
        class: clusterLabels[cluster],
        features: features[i],
        centroidDistance
      };
    });
  }

  /**
   * Normalize features using Z-score
   */
  private normalizeFeatures(features: number[][]): {
    normalized: number[][];
    mean: number[];
    std: number[];
  } {
    const numFeatures = features[0].length;
    const mean: number[] = [];
    const std: number[] = [];

    // Calculate mean and std for each feature
    for (let j = 0; j < numFeatures; j++) {
      const values = features.map(f => f[j]);
      const m = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / values.length;
      const s = Math.sqrt(variance) || 1; // Avoid division by zero

      mean.push(m);
      std.push(s);
    }

    // Normalize
    const normalized = features.map(f =>
      f.map((val, i) => (val - mean[i]) / std[i])
    );

    return { normalized, mean, std };
  }

  /**
   * Calculate statistics for each cluster
   */
  private calculateClusterStats(
    products: ProductFeatures[],
    predictions: number[]
  ): Map<number, { avgRevenue: number; avgTurnover: number; count: number }> {
    const stats = new Map<number, { avgRevenue: number; avgTurnover: number; count: number }>();

    for (let cluster = 0; cluster < 3; cluster++) {
      const clusterProducts = products.filter((_, i) => predictions[i] === cluster);
      
      if (clusterProducts.length > 0) {
        const avgRevenue = clusterProducts.reduce((sum, p) => sum + p.totalRevenue, 0) / clusterProducts.length;
        const avgTurnover = clusterProducts.reduce((sum, p) => sum + p.turnoverRate, 0) / clusterProducts.length;
        
        stats.set(cluster, {
          avgRevenue,
          avgTurnover,
          count: clusterProducts.length
        });
      }
    }

    return stats;
  }

  /**
   * Assign A/B/C labels based on cluster characteristics
   * Cluster with highest revenue/turnover = A, lowest = C
   */
  private assignClusterLabels(
    stats: Map<number, { avgRevenue: number; avgTurnover: number; count: number }>
  ): { [cluster: number]: 'A' | 'B' | 'C' } {
    const clusters = Array.from(stats.entries()).map(([cluster, stat]) => ({
      cluster,
      score: stat.avgRevenue * 0.6 + stat.avgTurnover * 0.4
    }));

    // Sort by score descending
    clusters.sort((a, b) => b.score - a.score);

    const labels: { [cluster: number]: 'A' | 'B' | 'C' } = {};
    labels[clusters[0].cluster] = 'A'; // Highest score
    labels[clusters[1].cluster] = 'B'; // Medium score
    labels[clusters[2].cluster] = 'C'; // Lowest score

    return labels;
  }

  /**
   * Calculate Euclidean distance
   */
  private calculateDistance(point: number[], centroid: number[]): number {
    return Math.sqrt(
      point.reduce((sum, val, i) => sum + Math.pow(val - centroid[i], 2), 0)
    );
  }

  /**
   * Get model info
   */
  getModelInfo(): { trained: boolean; clusters: number } {
    return {
      trained: this.model !== null,
      clusters: 3
    };
  }
}

export const stockClassificationML = new StockClassificationML();
