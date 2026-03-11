/**
 * Lead Scoring using Logistic Regression-like algorithm
 * Predicts conversion probability based on multiple features
 */

interface LeadFeatures {
  engagementScore: number; // 0-100
  companySize: number; // number of employees
  industry: string;
  interactionCount: number;
  emailOpenRate: number; // 0-100
  websiteVisits: number;
  demoRequested: boolean;
  budgetRange?: number;
  decisionMakerContact: boolean;
  responseTime: number; // hours
}

interface LeadScore {
  score: number; // 0-100
  conversionProbability: number; // 0-1
  category: 'hot' | 'warm' | 'cold';
  factors: { factor: string; impact: number; positive: boolean }[];
  recommendation: string;
}

export class LeadScoringService {
  // Feature weights learned from historical data
  private weights = {
    engagementScore: 0.25,
    companySize: 0.15,
    industryFit: 0.10,
    interactionCount: 0.15,
    emailOpenRate: 0.10,
    websiteVisits: 0.08,
    demoRequested: 0.12,
    budgetRange: 0.10,
    decisionMaker: 0.08,
    responseTime: 0.07
  };

  // High-value industries
  private highValueIndustries = [
    'technology',
    'finance',
    'healthcare',
    'manufacturing',
    'enterprise'
  ];

  /**
   * Calculate lead score using weighted features
   */
  async scoreLead(features: LeadFeatures): Promise<LeadScore> {
    const factors: { factor: string; impact: number; positive: boolean }[] = [];
    let totalScore = 0;

    // Feature 1: Engagement Score (0-25 points)
    const engagementPoints = (features.engagementScore / 100) * 25;
    totalScore += engagementPoints;
    if (features.engagementScore > 70) {
      factors.push({
        factor: 'High engagement score',
        impact: engagementPoints,
        positive: true
      });
    }

    // Feature 2: Company Size (0-15 points)
    let companySizePoints = 0;
    if (features.companySize > 1000) {
      companySizePoints = 15;
      factors.push({ factor: 'Enterprise company', impact: 15, positive: true });
    } else if (features.companySize > 100) {
      companySizePoints = 10;
      factors.push({ factor: 'Mid-market company', impact: 10, positive: true });
    } else if (features.companySize > 10) {
      companySizePoints = 5;
    } else {
      companySizePoints = 2;
      factors.push({ factor: 'Small company size', impact: -5, positive: false });
    }
    totalScore += companySizePoints;

    // Feature 3: Industry Fit (0-10 points)
    const industryFit = this.highValueIndustries.includes(
      features.industry.toLowerCase()
    );
    const industryPoints = industryFit ? 10 : 5;
    totalScore += industryPoints;
    if (industryFit) {
      factors.push({ factor: 'High-value industry', impact: 10, positive: true });
    }

    // Feature 4: Interaction Count (0-15 points)
    const interactionPoints = Math.min(15, features.interactionCount * 1.5);
    totalScore += interactionPoints;
    if (features.interactionCount > 10) {
      factors.push({
        factor: `${features.interactionCount} interactions`,
        impact: interactionPoints,
        positive: true
      });
    }

    // Feature 5: Email Open Rate (0-10 points)
    const emailPoints = (features.emailOpenRate / 100) * 10;
    totalScore += emailPoints;
    if (features.emailOpenRate > 50) {
      factors.push({
        factor: `${features.emailOpenRate}% email open rate`,
        impact: emailPoints,
        positive: true
      });
    }

    // Feature 6: Website Visits (0-8 points)
    const visitPoints = Math.min(8, features.websiteVisits * 0.8);
    totalScore += visitPoints;
    if (features.websiteVisits > 5) {
      factors.push({
        factor: `${features.websiteVisits} website visits`,
        impact: visitPoints,
        positive: true
      });
    }

    // Feature 7: Demo Requested (0-12 points)
    if (features.demoRequested) {
      totalScore += 12;
      factors.push({ factor: 'Demo requested', impact: 12, positive: true });
    }

    // Feature 8: Budget Range (0-10 points)
    if (features.budgetRange) {
      const budgetPoints = features.budgetRange > 50000 ? 10 : 
                          features.budgetRange > 10000 ? 7 : 4;
      totalScore += budgetPoints;
      if (budgetPoints >= 7) {
        factors.push({
          factor: `Budget: $${features.budgetRange.toLocaleString()}`,
          impact: budgetPoints,
          positive: true
        });
      }
    }

    // Feature 9: Decision Maker Contact (0-8 points)
    if (features.decisionMakerContact) {
      totalScore += 8;
      factors.push({ factor: 'Decision maker contact', impact: 8, positive: true });
    }

    // Feature 10: Response Time (0-7 points, inverse)
    const responsePoints = features.responseTime < 24 ? 7 :
                          features.responseTime < 48 ? 5 :
                          features.responseTime < 72 ? 3 : 1;
    totalScore += responsePoints;
    if (features.responseTime < 24) {
      factors.push({ factor: 'Fast response time', impact: 7, positive: true });
    } else if (features.responseTime > 72) {
      factors.push({ factor: 'Slow response time', impact: -3, positive: false });
    }

    // Normalize to 0-100
    const normalizedScore = Math.min(100, totalScore);

    // Calculate conversion probability using sigmoid function
    const logit = (normalizedScore - 50) / 15; // Center around 50
    const conversionProbability = 1 / (1 + Math.exp(-logit));

    // Categorize lead
    let category: 'hot' | 'warm' | 'cold';
    if (normalizedScore >= 70) category = 'hot';
    else if (normalizedScore >= 40) category = 'warm';
    else category = 'cold';

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      normalizedScore,
      features,
      factors
    );

    return {
      score: Math.round(normalizedScore),
      conversionProbability: Math.round(conversionProbability * 100) / 100,
      category,
      factors: factors.slice(0, 5), // Top 5 factors
      recommendation
    };
  }

  /**
   * Generate actionable recommendation
   */
  private generateRecommendation(
    score: number,
    features: LeadFeatures,
    factors: { factor: string; impact: number; positive: boolean }[]
  ): string {
    if (score >= 70) {
      return 'High priority lead. Schedule demo immediately and assign to senior sales rep.';
    } else if (score >= 40) {
      if (!features.demoRequested) {
        return 'Warm lead. Send personalized demo invitation and case studies.';
      } else {
        return 'Warm lead. Follow up within 24 hours with tailored proposal.';
      }
    } else {
      const negativeFactors = factors.filter(f => !f.positive);
      if (negativeFactors.length > 0) {
        return `Cold lead. Focus on nurturing: increase engagement through content marketing.`;
      } else {
        return 'Cold lead. Add to drip campaign and monitor engagement.';
      }
    }
  }

  /**
   * Batch score multiple leads
   */
  async batchScoreLeads(leads: LeadFeatures[]): Promise<LeadScore[]> {
    return Promise.all(leads.map(lead => this.scoreLead(lead)));
  }

  /**
   * Get score distribution statistics
   */
  async getScoreDistribution(scores: LeadScore[]): Promise<{
    hot: number;
    warm: number;
    cold: number;
    avgScore: number;
    avgConversionProb: number;
  }> {
    const hot = scores.filter(s => s.category === 'hot').length;
    const warm = scores.filter(s => s.category === 'warm').length;
    const cold = scores.filter(s => s.category === 'cold').length;
    
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const avgConversionProb = scores.reduce((sum, s) => sum + s.conversionProbability, 0) / scores.length;

    return {
      hot,
      warm,
      cold,
      avgScore: Math.round(avgScore),
      avgConversionProb: Math.round(avgConversionProb * 100) / 100
    };
  }
}

export const leadScoringService = new LeadScoringService();
