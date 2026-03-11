import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Zap,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  Users,
  Building
} from "lucide-react";

interface FinancialHealthScore {
  overall: number;
  liquidity: number;
  profitability: number;
  efficiency: number;
  leverage: number;
  growth: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface BenchmarkData {
  category: string;
  ourValue: number;
  industryAverage: number;
  topQuartile: number;
  unit: string;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface PredictiveInsight {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  category: 'revenue' | 'profitability' | 'efficiency' | 'liquidity';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export function AdvancedFinancialAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("12m");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Financial Health Score
  const healthScore: FinancialHealthScore = {
    overall: 78,
    liquidity: 85,
    profitability: 72,
    efficiency: 81,
    leverage: 68,
    growth: 89,
    trend: 'improving'
  };

  // Benchmark Data
  const benchmarkData: BenchmarkData[] = [
    {
      category: "Gross Profit Margin",
      ourValue: 68.5,
      industryAverage: 62.3,
      topQuartile: 75.2,
      unit: "%",
      performance: "good"
    },
    {
      category: "Current Ratio",
      ourValue: 2.4,
      industryAverage: 1.8,
      topQuartile: 2.8,
      unit: "x",
      performance: "good"
    },
    {
      category: "ROE",
      ourValue: 15.2,
      industryAverage: 12.8,
      topQuartile: 18.5,
      unit: "%",
      performance: "good"
    },
    {
      category: "Asset Turnover",
      ourValue: 1.1,
      industryAverage: 1.3,
      topQuartile: 1.7,
      unit: "x",
      performance: "poor"
    },
    {
      category: "Debt-to-Equity",
      ourValue: 0.45,
      industryAverage: 0.52,
      topQuartile: 0.35,
      unit: "x",
      performance: "good"
    },
    {
      category: "Revenue Growth",
      ourValue: 18.3,
      industryAverage: 12.1,
      topQuartile: 22.8,
      unit: "%",
      performance: "good"
    }
  ];

  // Predictive Insights
  const predictiveInsights: PredictiveInsight[] = [
    {
      id: "insight-1",
      metric: "Monthly Recurring Revenue",
      currentValue: 285000,
      predictedValue: 342000,
      timeframe: "Next 6 months",
      confidence: 87,
      trend: "up",
      impact: "high",
      recommendation: "Accelerate customer acquisition in Q2 to capitalize on growth momentum"
    },
    {
      id: "insight-2",
      metric: "Customer Acquisition Cost",
      currentValue: 450,
      predictedValue: 380,
      timeframe: "Next 3 months",
      confidence: 92,
      trend: "down",
      impact: "medium",
      recommendation: "Optimize marketing channels to maintain cost efficiency gains"
    },
    {
      id: "insight-3",
      metric: "Cash Burn Rate",
      currentValue: 125000,
      predictedValue: 98000,
      timeframe: "Next 4 months",
      confidence: 78,
      trend: "down",
      impact: "high",
      recommendation: "Continue operational efficiency improvements to extend runway"
    },
    {
      id: "insight-4",
      metric: "Gross Margin",
      currentValue: 68.5,
      predictedValue: 71.2,
      timeframe: "Next 6 months",
      confidence: 83,
      trend: "up",
      impact: "medium",
      recommendation: "Focus on premium product mix to sustain margin expansion"
    }
  ];

  // KPI Metrics
  const kpiMetrics: KPIMetric[] = [
    {
      id: "kpi-1",
      name: "Monthly Recurring Revenue",
      value: 285000,
      target: 300000,
      unit: "$",
      trend: 12.5,
      category: "revenue",
      status: "good"
    },
    {
      id: "kpi-2",
      name: "Customer Lifetime Value",
      value: 4250,
      target: 4000,
      unit: "$",
      trend: 8.3,
      category: "revenue",
      status: "excellent"
    },
    {
      id: "kpi-3",
      name: "Gross Profit Margin",
      value: 68.5,
      target: 70,
      unit: "%",
      trend: 2.1,
      category: "profitability",
      status: "good"
    },
    {
      id: "kpi-4",
      name: "Operating Cash Flow",
      value: 156000,
      target: 150000,
      unit: "$",
      trend: 15.7,
      category: "liquidity",
      status: "excellent"
    },
    {
      id: "kpi-5",
      name: "Days Sales Outstanding",
      value: 32,
      target: 30,
      unit: "days",
      trend: -5.2,
      category: "efficiency",
      status: "warning"
    },
    {
      id: "kpi-6",
      name: "Inventory Turnover",
      value: 8.2,
      target: 10,
      unit: "x",
      trend: -2.1,
      category: "efficiency",
      status: "warning"
    }
  ];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'good': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'average': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'poor': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const filteredKPIs = selectedCategory === 'all' 
    ? kpiMetrics 
    : kpiMetrics.filter(kpi => kpi.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Advanced Financial Analytics
          </h2>
          <p className="text-slate-500 text-sm">Comprehensive financial performance analysis and benchmarking</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Financial Health Score */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getHealthScoreColor(healthScore.overall)}`}>
                      {healthScore.overall}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Overall Score</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {healthScore.trend === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      {healthScore.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
                      {healthScore.trend === 'stable' && <Activity className="w-4 h-4 text-blue-600" />}
                      <span className="text-xs text-slate-600 capitalize">{healthScore.trend}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Liquidity</span>
                  <span className="text-sm font-bold text-slate-900">{healthScore.liquidity}/100</span>
                </div>
                <Progress value={healthScore.liquidity} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Profitability</span>
                  <span className="text-sm font-bold text-slate-900">{healthScore.profitability}/100</span>
                </div>
                <Progress value={healthScore.profitability} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Efficiency</span>
                  <span className="text-sm font-bold text-slate-900">{healthScore.efficiency}/100</span>
                </div>
                <Progress value={healthScore.efficiency} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Leverage</span>
                  <span className="text-sm font-bold text-slate-900">{healthScore.leverage}/100</span>
                </div>
                <Progress value={healthScore.leverage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Growth</span>
                  <span className="text-sm font-bold text-slate-900">{healthScore.growth}/100</span>
                </div>
                <Progress value={healthScore.growth} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Dashboard */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Performance Indicators
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={selectedCategory === 'revenue' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('revenue')}
              >
                Revenue
              </Button>
              <Button 
                size="sm" 
                variant={selectedCategory === 'profitability' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('profitability')}
              >
                Profitability
              </Button>
              <Button 
                size="sm" 
                variant={selectedCategory === 'efficiency' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('efficiency')}
              >
                Efficiency
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKPIs.map((kpi) => (
              <div key={kpi.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-slate-900 text-sm">{kpi.name}</h4>
                  <div className={`p-1 rounded ${getKPIStatusColor(kpi.status)}`}>
                    {kpi.status === 'excellent' && <CheckCircle className="w-4 h-4" />}
                    {kpi.status === 'good' && <CheckCircle className="w-4 h-4" />}
                    {kpi.status === 'warning' && <AlertCircle className="w-4 h-4" />}
                    {kpi.status === 'critical' && <AlertCircle className="w-4 h-4" />}
                  </div>
                </div>
                
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {kpi.unit === '$' ? '$' : ''}{kpi.value.toLocaleString()}{kpi.unit !== '$' ? kpi.unit : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      Target: {kpi.unit === '$' ? '$' : ''}{kpi.target.toLocaleString()}{kpi.unit !== '$' ? kpi.unit : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {kpi.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      kpi.trend > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {Math.abs(kpi.trend)}%
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={(kpi.value / kpi.target) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Benchmarking */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Industry Benchmarking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {benchmarkData.map((benchmark, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-slate-900">{benchmark.category}</h4>
                  <Badge className={getPerformanceColor(benchmark.performance)}>
                    {benchmark.performance}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Our Value</p>
                    <p className="text-lg font-bold text-slate-900">
                      {benchmark.ourValue}{benchmark.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Industry Avg</p>
                    <p className="text-lg font-medium text-slate-700">
                      {benchmark.industryAverage}{benchmark.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Top Quartile</p>
                    <p className="text-lg font-medium text-slate-700">
                      {benchmark.topQuartile}{benchmark.unit}
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between items-center h-4 bg-slate-100 rounded-full">
                    <div 
                      className="absolute h-4 bg-blue-200 rounded-full"
                      style={{ 
                        width: `${(benchmark.industryAverage / benchmark.topQuartile) * 100}%` 
                      }}
                    ></div>
                    <div 
                      className="absolute h-4 bg-blue-600 rounded-full"
                      style={{ 
                        width: `${(benchmark.ourValue / benchmark.topQuartile) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Analytics */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictiveInsights.map((insight) => (
              <div key={insight.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{insight.metric}</h4>
                    <p className="text-sm text-slate-600">{insight.timeframe}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(insight.trend)}
                    <Badge className="bg-blue-100 text-blue-700">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-slate-500">Current Value</p>
                    <p className="text-lg font-bold text-slate-900">
                      {insight.currentValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Predicted Value</p>
                    <p className={`text-lg font-bold ${
                      insight.trend === 'up' ? 'text-emerald-700' : 
                      insight.trend === 'down' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {insight.predictedValue.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Recommendation:</span> {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}