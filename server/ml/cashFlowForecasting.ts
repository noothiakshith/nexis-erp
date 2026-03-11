/**
 * Cash Flow Forecasting using Time Series Analysis
 * Implements simplified Prophet-like algorithm
 */

interface CashFlowData {
  date: Date;
  amount: number;
}

interface Forecast {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  trend: number;
}

export class CashFlowForecastingService {
  /**
   * Forecast cash flow using trend + seasonality decomposition
   */
  async forecastCashFlow(
    historicalData: CashFlowData[],
    daysAhead: number = 90
  ): Promise<Forecast[]> {
    if (historicalData.length < 7) {
      throw new Error('Need at least 7 days of historical data');
    }

    // Sort by date
    const sortedData = [...historicalData].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // Extract trend using linear regression
    const trend = this.calculateTrend(sortedData);
    
    // Extract seasonality (weekly pattern)
    const seasonality = this.calculateSeasonality(sortedData, trend);
    
    // Calculate residuals for confidence intervals
    const residuals = this.calculateResiduals(sortedData, trend, seasonality);
    const stdDev = this.standardDeviation(residuals);

    // Generate forecasts
    const forecasts: Forecast[] = [];
    const lastDate = sortedData[sortedData.length - 1].date;
    
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const dayIndex = sortedData.length + i - 1;
      const trendValue = trend.slope * dayIndex + trend.intercept;
      const seasonalValue = seasonality[forecastDate.getDay()];
      const predicted = trendValue + seasonalValue;
      
      // Confidence intervals (95% = 1.96 * stdDev)
      const margin = 1.96 * stdDev * Math.sqrt(1 + i / sortedData.length);
      
      forecasts.push({
        date: forecastDate,
        predicted: Math.max(0, predicted),
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
        trend: trendValue
      });
    }

    return forecasts;
  }

  /**
   * Calculate linear trend using least squares regression
   */
  private calculateTrend(data: CashFlowData[]): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point, index) => {
      sumX += index;
      sumY += point.amount;
      sumXY += index * point.amount;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate weekly seasonality pattern
   */
  private calculateSeasonality(
    data: CashFlowData[],
    trend: { slope: number; intercept: number }
  ): number[] {
    // Initialize seasonality for each day of week (0-6)
    const seasonalSums = new Array(7).fill(0);
    const seasonalCounts = new Array(7).fill(0);

    data.forEach((point, index) => {
      const trendValue = trend.slope * index + trend.intercept;
      const detrended = point.amount - trendValue;
      const dayOfWeek = point.date.getDay();
      
      seasonalSums[dayOfWeek] += detrended;
      seasonalCounts[dayOfWeek]++;
    });

    // Calculate average seasonal component for each day
    const seasonality = seasonalSums.map((sum, i) => 
      seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
    );

    // Normalize to sum to zero
    const avgSeasonal = seasonality.reduce((a, b) => a + b, 0) / 7;
    return seasonality.map(s => s - avgSeasonal);
  }

  /**
   * Calculate residuals for confidence intervals
   */
  private calculateResiduals(
    data: CashFlowData[],
    trend: { slope: number; intercept: number },
    seasonality: number[]
  ): number[] {
    return data.map((point, index) => {
      const trendValue = trend.slope * index + trend.intercept;
      const seasonalValue = seasonality[point.date.getDay()];
      const predicted = trendValue + seasonalValue;
      return point.amount - predicted;
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
   * Get summary statistics
   */
  async getSummaryStats(forecasts: Forecast[]): Promise<{
    avgPredicted: number;
    totalPredicted: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  }> {
    const avgPredicted = forecasts.reduce((sum, f) => sum + f.predicted, 0) / forecasts.length;
    const totalPredicted = forecasts.reduce((sum, f) => sum + f.predicted, 0);
    
    // Determine trend
    const firstWeek = forecasts.slice(0, 7).reduce((sum, f) => sum + f.predicted, 0) / 7;
    const lastWeek = forecasts.slice(-7).reduce((sum, f) => sum + f.predicted, 0) / 7;
    const trendChange = ((lastWeek - firstWeek) / firstWeek) * 100;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (trendChange > 5) trend = 'increasing';
    else if (trendChange < -5) trend = 'decreasing';
    else trend = 'stable';

    // Calculate volatility (coefficient of variation)
    const stdDev = this.standardDeviation(forecasts.map(f => f.predicted));
    const volatility = (stdDev / avgPredicted) * 100;

    return {
      avgPredicted: Math.round(avgPredicted),
      totalPredicted: Math.round(totalPredicted),
      trend,
      volatility: Math.round(volatility)
    };
  }
}

export const cashFlowForecastingService = new CashFlowForecastingService();
