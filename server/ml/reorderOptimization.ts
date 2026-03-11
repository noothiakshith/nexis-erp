/**
 * Reorder Point Optimization using Economic Order Quantity (EOQ) and Safety Stock
 * Calculates optimal reorder points and quantities to minimize costs
 */

interface ProductData {
  productId: number;
  currentStock: number;
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  leadTimeStdDev: number;
  unitCost: number;
  holdingCostPercent: number; // Annual holding cost as % of unit cost
  orderCost: number; // Fixed cost per order
  stockoutCost: number; // Cost per unit stockout
  serviceLevel: number; // Desired service level (0-1)
}

interface ReorderRecommendation {
  productId: number;
  reorderPoint: number;
  reorderQuantity: number;
  safetyStock: number;
  expectedAnnualCost: number;
  orderFrequency: number; // Orders per year
  reasoning: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export class ReorderOptimizationService {
  /**
   * Calculate optimal reorder point and quantity using EOQ model with safety stock
   */
  async optimizeReorder(productData: ProductData): Promise<ReorderRecommendation> {
    const reasoning: string[] = [];

    // Calculate Economic Order Quantity (EOQ)
    const annualDemand = productData.avgDailyDemand * 365;
    const holdingCostPerUnit = productData.unitCost * (productData.holdingCostPercent / 100);
    
    const eoq = Math.sqrt(
      (2 * annualDemand * productData.orderCost) / holdingCostPerUnit
    );
    
    const reorderQuantity = Math.round(eoq);
    reasoning.push(`EOQ formula: √(2×${annualDemand}×${productData.orderCost}/${holdingCostPerUnit}) = ${reorderQuantity}`);

    // Calculate Safety Stock using service level
    const zScore = this.getZScore(productData.serviceLevel);
    
    // Safety stock accounts for demand and lead time variability
    const demandDuringLeadTime = productData.avgDailyDemand * productData.leadTimeDays;
    const demandVariance = Math.pow(productData.demandStdDev * Math.sqrt(productData.leadTimeDays), 2);
    const leadTimeVariance = Math.pow(productData.avgDailyDemand * productData.leadTimeStdDev, 2);
    const totalStdDev = Math.sqrt(demandVariance + leadTimeVariance);
    
    const safetyStock = Math.round(zScore * totalStdDev);
    reasoning.push(`Safety stock: ${zScore.toFixed(2)} × ${totalStdDev.toFixed(1)} = ${safetyStock} units`);

    // Calculate Reorder Point
    const reorderPoint = Math.round(demandDuringLeadTime + safetyStock);
    reasoning.push(`Reorder point: ${demandDuringLeadTime.toFixed(0)} (demand) + ${safetyStock} (safety) = ${reorderPoint}`);

    // Calculate expected annual costs
    const orderFrequency = annualDemand / reorderQuantity;
    const annualOrderCost = orderFrequency * productData.orderCost;
    const annualHoldingCost = (reorderQuantity / 2 + safetyStock) * holdingCostPerUnit;
    const expectedAnnualCost = annualOrderCost + annualHoldingCost;

    reasoning.push(`Annual cost: $${annualOrderCost.toFixed(0)} (ordering) + $${annualHoldingCost.toFixed(0)} (holding) = $${expectedAnnualCost.toFixed(0)}`);

    // Determine urgency based on current stock vs reorder point
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    const stockRatio = productData.currentStock / reorderPoint;
    
    if (stockRatio <= 0.5) {
      urgency = 'critical';
      reasoning.push(`CRITICAL: Stock at ${(stockRatio * 100).toFixed(0)}% of reorder point`);
    } else if (stockRatio <= 0.75) {
      urgency = 'high';
      reasoning.push(`HIGH: Stock at ${(stockRatio * 100).toFixed(0)}% of reorder point`);
    } else if (stockRatio <= 1.0) {
      urgency = 'medium';
      reasoning.push(`MEDIUM: Stock at ${(stockRatio * 100).toFixed(0)}% of reorder point`);
    } else {
      urgency = 'low';
      reasoning.push(`LOW: Stock above reorder point`);
    }

    return {
      productId: productData.productId,
      reorderPoint,
      reorderQuantity,
      safetyStock,
      expectedAnnualCost: Math.round(expectedAnnualCost),
      orderFrequency: Math.round(orderFrequency * 10) / 10,
      reasoning,
      urgency
    };
  }

  /**
   * Get Z-score for desired service level
   */
  private getZScore(serviceLevel: number): number {
    // Common service levels and their Z-scores
    const zScores: { [key: number]: number } = {
      0.50: 0.00,
      0.80: 0.84,
      0.85: 1.04,
      0.90: 1.28,
      0.95: 1.65,
      0.97: 1.88,
      0.98: 2.05,
      0.99: 2.33,
      0.995: 2.58,
      0.999: 3.09
    };

    // Find closest service level
    const levels = Object.keys(zScores).map(Number);
    const closest = levels.reduce((prev, curr) => 
      Math.abs(curr - serviceLevel) < Math.abs(prev - serviceLevel) ? curr : prev
    );

    return zScores[closest];
  }

  /**
   * Batch optimize multiple products
   */
  async batchOptimize(products: ProductData[]): Promise<ReorderRecommendation[]> {
    return Promise.all(products.map(product => this.optimizeReorder(product)));
  }

  /**
   * Calculate cost savings from optimization
   */
  calculateSavings(
    currentOrderQuantity: number,
    currentReorderPoint: number,
    optimized: ReorderRecommendation,
    productData: ProductData
  ): {
    annualSavings: number;
    savingsPercent: number;
    breakdown: { category: string; amount: number }[];
  } {
    const annualDemand = productData.avgDailyDemand * 365;
    const holdingCostPerUnit = productData.unitCost * (productData.holdingCostPercent / 100);

    // Current costs
    const currentOrderFreq = annualDemand / currentOrderQuantity;
    const currentOrderCost = currentOrderFreq * productData.orderCost;
    const currentHoldingCost = (currentOrderQuantity / 2) * holdingCostPerUnit;
    const currentTotalCost = currentOrderCost + currentHoldingCost;

    // Savings breakdown
    const orderingSavings = currentOrderCost - (optimized.orderFrequency * productData.orderCost);
    const holdingSavings = currentHoldingCost - ((optimized.reorderQuantity / 2 + optimized.safetyStock) * holdingCostPerUnit);
    const annualSavings = currentTotalCost - optimized.expectedAnnualCost;
    const savingsPercent = (annualSavings / currentTotalCost) * 100;

    return {
      annualSavings: Math.round(annualSavings),
      savingsPercent: Math.round(savingsPercent * 10) / 10,
      breakdown: [
        { category: 'Ordering Cost Savings', amount: Math.round(orderingSavings) },
        { category: 'Holding Cost Savings', amount: Math.round(holdingSavings) }
      ]
    };
  }
}

export const reorderOptimizationService = new ReorderOptimizationService();
