/**
 * Demand Forecasting using Time Series Analysis
 * Predicts future product demand based on historical sales patterns
 */

interface SalesData {
  date: Date;
  quantity: number;
  productId: number;
}

interface DemandForecast {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

interface ForecastSummary {
  avgDailyDemand: number;
  totalForecast: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalityDetected: boolean;
  peakDay: string;
}

export class DemandForecastingService {
  /**
   * Forecast demand using exponential smoothing with trend and seasonality
   */
  async forecastDemand(
    historicalSales: SalesData[],
    daysAhead: number = 30
  ): Promise<{ forecasts: DemandForecast[]; summary: ForecastSummary }> {
    if (historicalSales.length < 7) {
      throw new Error(`Need at least 7 days of sales data, have ${historicalSales.length}`);
    }

    // Sort by date
    const sortedSales = [...historicalSales].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // Calculate trend using linear regression
    const trend = this.calculateTrend(sortedSales);
    
    // Detect weekly seasonality
    const seasonality = this.calculateWeeklySeasonality(sortedSales);
    
    // Calculate base level using exponential smoothing
    const alpha = 0.3; // Smoothing parameter
    let level = sortedSales[0].quantity;
    
    for (let i = 1; i < sortedSales.length; i++) {
      level = alpha * sortedSales[i].quantity + (1 - alpha) * level;
    }

    // Calculate forecast error for confidence intervals
    const errors = this.calculateForecastErrors(sortedSales, trend, seasonality);
    const stdError = this.standardDeviation(errors);

    // Generate forecasts
    const forecasts: DemandForecast[] = [];
    const lastDate = sortedSales[sortedSales.length - 1].date;
    
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Combine level, trend, and seasonality
      const trendComponent = trend.slope * (sortedSales.length + i) + trend.intercept;
      const seasonalComponent = seasonality[forecastDate.getDay()];
      const predicted = Math.max(0, level + trendComponent + seasonalComponent);
      
      // Confidence intervals (wider for further predictions)
      const margin = 1.96 * stdError * Math.sqrt(i);
      const confidence = Math.max(50, 100 - (i * 1.5)); // Decreases with time
      
      forecasts.push({
        date: forecastDate,
        predicted: Math.round(predicted),
        lower: Math.max(0, Math.round(predicted - margin)),
        upper: Math.round(predicted + margin),
        confidence: Math.round(confidence)
      });
    }

    // Generate summary
    const summary = this.generateSummary(forecasts, seasonality, trend);

    return { forecasts, summary };
  }

  /**
   * Calculate linear trend
   */
  private calculateTrend(sales: SalesData[]): { slope: number; intercept: number } {
    const n = sales.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    sales.forEach((sale, index) => {
      sumX += index;
      sumY += sale.quantity;
      sumXY += index * sale.quantity;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate weekly seasonality pattern
   */
  private calculateWeeklySeasonality(sales: SalesData[]): number[] {
    const seasonalSums = new Array(7).fill(0);
    const seasonalCounts = new Array(7).fill(0);

    // Calculate average for each day of week
    sales.forEach(sale => {
      const dayOfWeek = sale.date.getDay();
      seasonalSums[dayOfWeek] += sale.quantity;
      seasonalCounts[dayOfWeek]++;
    });

    const seasonality = seasonalSums.map((sum, i) => 
      seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
    );

    // Normalize to sum to zero
    const avgSeasonal = seasonality.reduce((a, b) => a + b, 0) / 7;
    return seasonality.map(s => s - avgSeasonal);
  }

  /**
   * Calculate forecast errors for confidence intervals
   */
  private calculateForecastErrors(
    sales: SalesData[],
    trend: { slope: number; intercept: number },
    seasonality: number[]
  ): number[] {
    return sales.map((sale, index) => {
      const trendValue = trend.slope * index + trend.intercept;
      const seasonalValue = seasonality[sale.date.getDay()];
      const predicted = trendValue + seasonalValue;
      return sale.quantity - predicted;
    });
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate forecast summary
   */
  private generateSummary(
    forecasts: DemandForecast[],
    seasonality: number[],
    trend: { slope: number; intercept: number }
  ): ForecastSummary {
    const avgDailyDemand = Math.round(
      forecasts.reduce((sum, f) => sum + f.predicted, 0) / forecasts.length
    );
    
    const totalForecast = forecasts.reduce((sum, f) => sum + f.predicted, 0);
    
    // Determine trend direction
    let trendDirection: 'increasing' | 'decreasing' | 'stable';
    if (trend.slope > 0.5) trendDirection = 'increasing';
    else if (trend.slope < -0.5) trendDirection = 'decreasing';
    else trendDirection = 'stable';

    // Check if seasonality is significant
    const maxSeasonal = Math.max(...seasonality.map(Math.abs));
    const seasonalityDetected = maxSeasonal > 1;

    // Find peak day
    const maxSeasonalIndex = seasonality.indexOf(Math.max(...seasonality));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDay = days[maxSeasonalIndex];

    return {
      avgDailyDemand,
      totalForecast: Math.round(totalForecast),
      trend: trendDirection,
      seasonalityDetected,
      peakDay
    };
  }
}

export const demandForecastingService = new DemandForecastingService();
