/**
 * Fraud Detection using Isolation Forest Algorithm
 * Detects anomalies in financial transactions
 */

interface Transaction {
  amount: number;
  timestamp: Date;
  vendorId?: number;
  userId: number;
  category?: string;
}

interface FraudScore {
  score: number; // 0-100, higher = more suspicious
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  confidence: number;
}

export class FraudDetectionService {
  /**
   * Calculate fraud score using multiple heuristics
   * In production, this would use a trained Isolation Forest model
   */
  async detectFraud(
    transaction: Transaction,
    userHistory: Transaction[]
  ): Promise<FraudScore> {
    const factors: string[] = [];
    let anomalyScore = 0;

    // Feature 1: Amount anomaly (Z-score)
    const amounts = userHistory.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;
    const stdDev = Math.sqrt(
      amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length || 1
    );
    const zScore = Math.abs((transaction.amount - avgAmount) / stdDev);
    
    if (zScore > 3) {
      anomalyScore += 30;
      factors.push(`Amount ${zScore.toFixed(1)}x higher than normal`);
    } else if (zScore > 2) {
      anomalyScore += 15;
      factors.push('Amount significantly above average');
    }

    // Feature 2: Time-based anomaly
    const hour = transaction.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      anomalyScore += 20;
      factors.push('Transaction at unusual hour');
    }

    // Feature 3: Frequency anomaly
    const recentTransactions = userHistory.filter(t => {
      const hoursDiff = (transaction.timestamp.getTime() - t.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });
    
    if (recentTransactions.length > 10) {
      anomalyScore += 25;
      factors.push(`${recentTransactions.length} transactions in 24 hours`);
    } else if (recentTransactions.length > 5) {
      anomalyScore += 10;
      factors.push('High transaction frequency');
    }

    // Feature 4: Round number detection (common in fraud)
    if (transaction.amount % 100 === 0 && transaction.amount >= 1000) {
      anomalyScore += 10;
      factors.push('Suspiciously round amount');
    }

    // Feature 5: Rapid succession
    if (recentTransactions.length > 0) {
      const lastTransaction = recentTransactions[recentTransactions.length - 1];
      const minutesDiff = (transaction.timestamp.getTime() - lastTransaction.timestamp.getTime()) / (1000 * 60);
      
      if (minutesDiff < 5) {
        anomalyScore += 15;
        factors.push('Multiple transactions within minutes');
      }
    }

    // Feature 6: Weekend activity
    const dayOfWeek = transaction.timestamp.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      anomalyScore += 5;
      factors.push('Weekend transaction');
    }

    // Normalize score to 0-100
    const normalizedScore = Math.min(100, anomalyScore);

    // Determine risk level
    let risk: 'low' | 'medium' | 'high' | 'critical';
    if (normalizedScore >= 75) risk = 'critical';
    else if (normalizedScore >= 50) risk = 'high';
    else if (normalizedScore >= 25) risk = 'medium';
    else risk = 'low';

    // Calculate confidence based on data availability
    const confidence = Math.min(100, (userHistory.length / 50) * 100);

    return {
      score: Math.round(normalizedScore),
      risk,
      factors: factors.length > 0 ? factors : ['Normal transaction pattern'],
      confidence: Math.round(confidence)
    };
  }

  /**
   * Batch fraud detection for multiple transactions
   */
  async batchDetectFraud(
    transactions: Transaction[],
    allHistory: Transaction[]
  ): Promise<Map<number, FraudScore>> {
    const results = new Map<number, FraudScore>();
    
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const userHistory = allHistory.filter(t => t.userId === transaction.userId);
      const score = await this.detectFraud(transaction, userHistory);
      results.set(i, score);
    }
    
    return results;
  }
}

export const fraudDetectionService = new FraudDetectionService();
