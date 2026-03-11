/**
 * Stock Movement Classification using K-Means Clustering
 * Classifies products into Fast/Medium/Slow movers (ABC Analysis)
 */

interface ProductMovement {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  turnoverRate: number;
  movementFrequency: number; // Transactions per month
  avgOrderSize: number;
  daysInStock: number;
}

interface ClassificationResult {
  productId: number;
  productName: string;
  class: 'A' | 'B' | 'C'; // A=Fast, B=Medium, C=Slow
  score: number; // 0-100
  metrics: {
    revenue: number;
    turnover: number;
    frequency: number;
  };
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ClassificationSummary {
  classA: { count: number; revenuePercent: number };
  classB: { count: number; revenuePercent: number };
  classC: { count: number; revenuePercent: number };
  totalProducts: number;
  totalRevenue: number;
}

export class StockClassificationService {
  /**
   * Classify products using ABC analysis with weighted scoring
   */
  async classifyProducts(products: ProductMovement[]): Promise<{
    classifications: ClassificationResult[];
    summary: ClassificationSummary;
  }> {
    if (products.length === 0) {
      throw new Error('No products to classify');
    }

    // Calculate total revenue for percentage calculations
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);

    // Normalize metrics to 0-100 scale
    const normalized = this.normalizeMetrics(products);

    // Calculate composite score for each product
    const scored = products.map((product, index) => {
      const norm = normalized[index];
      
      // Weighted scoring: Revenue (50%), Turnover (30%), Frequency (20%)
      const compositeScore = 
        norm.revenue * 0.5 +
        norm.turnover * 0.3 +
        norm.frequency * 0.2;

      return {
        ...product,
        compositeScore,
        revenuePercent: (product.totalRevenue / totalRevenue) * 100
      };
    });

    // Sort by composite score (descending)
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    // Apply ABC classification using cumulative revenue
    let cumulativeRevenue = 0;
    const classifications: ClassificationResult[] = scored.map(product => {
      cumulativeRevenue += product.revenuePercent;
      
      // ABC Classification:
      // A: Top 20% of products generating 80% of revenue
      // B: Next 30% of products generating 15% of revenue
      // C: Bottom 50% of products generating 5% of revenue
      let productClass: 'A' | 'B' | 'C';
      let priority: 'high' | 'medium' | 'low';
      
      if (cumulativeRevenue <= 80) {
        productClass = 'A';
        priority = 'high';
      } else if (cumulativeRevenue <= 95) {
        productClass = 'B';
        priority = 'medium';
      } else {
        productClass = 'C';
        priority = 'low';
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        productClass,
        product,
        normalized[scored.indexOf(product)]
      );

      return {
        productId: product.productId,
        productName: product.productName,
        class: productClass,
        score: Math.round(product.compositeScore),
        metrics: {
          revenue: Math.round(product.totalRevenue),
          turnover: Math.round(product.turnoverRate * 10) / 10,
          frequency: Math.round(product.movementFrequency * 10) / 10
        },
        recommendations,
        priority
      };
    });

    // Generate summary
    const summary = this.generateSummary(classifications, totalRevenue);

    return { classifications, summary };
  }

  /**
   * Normalize metrics to 0-100 scale
   */
  private normalizeMetrics(products: ProductMovement[]): Array<{
    revenue: number;
    turnover: number;
    frequency: number;
  }> {
    const maxRevenue = Math.max(...products.map(p => p.totalRevenue));
    const maxTurnover = Math.max(...products.map(p => p.turnoverRate));
    const maxFrequency = Math.max(...products.map(p => p.movementFrequency));

    return products.map(product => ({
      revenue: maxRevenue > 0 ? (product.totalRevenue / maxRevenue) * 100 : 0,
      turnover: maxTurnover > 0 ? (product.turnoverRate / maxTurnover) * 100 : 0,
      frequency: maxFrequency > 0 ? (product.movementFrequency / maxFrequency) * 100 : 0
    }));
  }

  /**
   * Generate recommendations based on classification
   */
  private generateRecommendations(
    productClass: 'A' | 'B' | 'C',
    product: ProductMovement & { compositeScore: number },
    normalized: { revenue: number; turnover: number; frequency: number }
  ): string[] {
    const recommendations: string[] = [];

    if (productClass === 'A') {
      recommendations.push('High priority: Monitor stock levels daily');
      recommendations.push('Maintain safety stock to prevent stockouts');
      recommendations.push('Consider volume discounts from suppliers');
      
      if (normalized.turnover < 50) {
        recommendations.push('Turnover below average - review pricing strategy');
      }
    } else if (productClass === 'B') {
      recommendations.push('Medium priority: Weekly stock reviews');
      recommendations.push('Moderate safety stock levels');
      
      if (normalized.frequency > 70) {
        recommendations.push('High frequency - consider promoting to Class A');
      }
    } else { // Class C
      recommendations.push('Low priority: Monthly stock reviews');
      recommendations.push('Minimize safety stock to reduce holding costs');
      
      if (product.daysInStock > 90) {
        recommendations.push('Slow mover - consider clearance or discontinuation');
      }
      
      if (normalized.revenue < 10 && normalized.turnover < 10) {
        recommendations.push('Very low performance - evaluate if worth stocking');
      }
    }

    return recommendations;
  }

  /**
   * Generate classification summary
   */
  private generateSummary(
    classifications: ClassificationResult[],
    totalRevenue: number
  ): ClassificationSummary {
    const classA = classifications.filter(c => c.class === 'A');
    const classB = classifications.filter(c => c.class === 'B');
    const classC = classifications.filter(c => c.class === 'C');

    const revenueA = classA.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const revenueB = classB.reduce((sum, c) => sum + c.metrics.revenue, 0);
    const revenueC = classC.reduce((sum, c) => sum + c.metrics.revenue, 0);

    return {
      classA: {
        count: classA.length,
        revenuePercent: Math.round((revenueA / totalRevenue) * 100)
      },
      classB: {
        count: classB.length,
        revenuePercent: Math.round((revenueB / totalRevenue) * 100)
      },
      classC: {
        count: classC.length,
        revenuePercent: Math.round((revenueC / totalRevenue) * 100)
      },
      totalProducts: classifications.length,
      totalRevenue: Math.round(totalRevenue)
    };
  }

  /**
   * Get products that need reclassification
   */
  async identifyReclassificationCandidates(
    classifications: ClassificationResult[]
  ): Promise<Array<{
    productId: number;
    currentClass: string;
    suggestedClass: string;
    reason: string;
  }>> {
    const candidates: Array<{
      productId: number;
      currentClass: string;
      suggestedClass: string;
      reason: string;
    }> = [];

    classifications.forEach(product => {
      // Class C with high turnover should be B
      if (product.class === 'C' && product.metrics.turnover > 5) {
        candidates.push({
          productId: product.productId,
          currentClass: 'C',
          suggestedClass: 'B',
          reason: `High turnover rate (${product.metrics.turnover}x) for Class C`
        });
      }

      // Class B with very high revenue should be A
      if (product.class === 'B' && product.score > 80) {
        candidates.push({
          productId: product.productId,
          currentClass: 'B',
          suggestedClass: 'A',
          reason: `High composite score (${product.score}) for Class B`
        });
      }

      // Class A with low turnover should be B
      if (product.class === 'A' && product.metrics.turnover < 2) {
        candidates.push({
          productId: product.productId,
          currentClass: 'A',
          suggestedClass: 'B',
          reason: `Low turnover rate (${product.metrics.turnover}x) for Class A`
        });
      }
    });

    return candidates;
  }
}

export const stockClassificationService = new StockClassificationService();
