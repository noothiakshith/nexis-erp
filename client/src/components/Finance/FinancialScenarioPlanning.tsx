import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Calculator,
  PieChart,
  LineChart,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  PlayCircle,
  RotateCcw
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'optimistic' | 'realistic' | 'pessimistic' | 'custom';
  parameters: {
    revenueGrowth: number;
    expenseIncrease: number;
    marketConditions: number;
    customerRetention: number;
    newCustomerAcquisition: number;
  };
  results: {
    projectedRevenue: number;
    projectedExpenses: number;
    netIncome: number;
    cashFlow: number;
    breakEvenPoint: number;
    riskScore: number;
  };
  probability: number;
  createdAt: Date;
}

interface MonteCarloResult {
  scenario: string;
  probability: number;
  revenue: { min: number; max: number; mean: number; };
  expenses: { min: number; max: number; mean: number; };
  profit: { min: number; max: number; mean: number; };
  confidenceInterval: { lower: number; upper: number; };
}

interface StressTest {
  id: string;
  name: string;
  description: string;
  stressFactors: {
    revenueDecline: number;
    costIncrease: number;
    customerLoss: number;
    marketDownturn: number;
  };
  impact: {
    cashFlowReduction: number;
    profitabilityImpact: number;
    liquidityRisk: number;
    recoveryTime: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function FinancialScenarioPlanning() {
  const [activeScenario, setActiveScenario] = useState<string>("scenario-1");
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [customParameters, setCustomParameters] = useState({
    revenueGrowth: [15],
    expenseIncrease: [8],
    marketConditions: [75],
    customerRetention: [85],
    newCustomerAcquisition: [25]
  });

  // Mock scenarios
  const scenarios: Scenario[] = [
    {
      id: "scenario-1",
      name: "Optimistic Growth",
      description: "Best-case scenario with strong market conditions and high customer acquisition",
      type: "optimistic",
      parameters: {
        revenueGrowth: 25,
        expenseIncrease: 12,
        marketConditions: 90,
        customerRetention: 95,
        newCustomerAcquisition: 40
      },
      results: {
        projectedRevenue: 2850000,
        projectedExpenses: 1950000,
        netIncome: 900000,
        cashFlow: 1200000,
        breakEvenPoint: 8.2,
        riskScore: 25
      },
      probability: 20,
      createdAt: new Date()
    },
    {
      id: "scenario-2",
      name: "Realistic Projection",
      description: "Most likely scenario based on historical data and current market trends",
      type: "realistic",
      parameters: {
        revenueGrowth: 15,
        expenseIncrease: 8,
        marketConditions: 75,
        customerRetention: 85,
        newCustomerAcquisition: 25
      },
      results: {
        projectedRevenue: 2300000,
        projectedExpenses: 1800000,
        netIncome: 500000,
        cashFlow: 750000,
        breakEvenPoint: 10.5,
        riskScore: 45
      },
      probability: 60,
      createdAt: new Date()
    },
    {
      id: "scenario-3",
      name: "Conservative Outlook",
      description: "Cautious scenario accounting for potential market challenges and slower growth",
      type: "pessimistic",
      parameters: {
        revenueGrowth: 5,
        expenseIncrease: 15,
        marketConditions: 55,
        customerRetention: 75,
        newCustomerAcquisition: 10
      },
      results: {
        projectedRevenue: 1950000,
        projectedExpenses: 1850000,
        netIncome: 100000,
        cashFlow: 250000,
        breakEvenPoint: 15.8,
        riskScore: 75
      },
      probability: 20,
      createdAt: new Date()
    }
  ];

  // Mock Monte Carlo results
  const monteCarloResults: MonteCarloResult[] = [
    {
      scenario: "10,000 Simulations",
      probability: 95,
      revenue: { min: 1800000, max: 3200000, mean: 2350000 },
      expenses: { min: 1600000, max: 2100000, mean: 1825000 },
      profit: { min: -150000, max: 1200000, mean: 525000 },
      confidenceInterval: { lower: 350000, upper: 750000 }
    }
  ];

  // Mock stress tests
  const stressTests: StressTest[] = [
    {
      id: "stress-1",
      name: "Economic Recession",
      description: "Severe economic downturn with reduced consumer spending and market contraction",
      stressFactors: {
        revenueDecline: 35,
        costIncrease: 20,
        customerLoss: 25,
        marketDownturn: 40
      },
      impact: {
        cashFlowReduction: 65,
        profitabilityImpact: 85,
        liquidityRisk: 70,
        recoveryTime: 18
      },
      riskLevel: "critical"
    },
    {
      id: "stress-2",
      name: "Supply Chain Disruption",
      description: "Major supply chain issues leading to increased costs and delivery delays",
      stressFactors: {
        revenueDecline: 15,
        costIncrease: 30,
        customerLoss: 10,
        marketDownturn: 20
      },
      impact: {
        cashFlowReduction: 35,
        profitabilityImpact: 45,
        liquidityRisk: 40,
        recoveryTime: 8
      },
      riskLevel: "medium"
    },
    {
      id: "stress-3",
      name: "Competitive Pressure",
      description: "New market entrants with aggressive pricing and superior technology",
      stressFactors: {
        revenueDecline: 20,
        costIncrease: 15,
        customerLoss: 30,
        marketDownturn: 10
      },
      impact: {
        cashFlowReduction: 40,
        profitabilityImpact: 50,
        liquidityRisk: 35,
        recoveryTime: 12
      },
      riskLevel: "high"
    }
  ];

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'optimistic': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'realistic': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pessimistic': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'custom': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-amber-600 bg-amber-100';
    if (score >= 30) return 'text-blue-600 bg-blue-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const runSimulation = () => {
    setIsRunningSimulation(true);
    setTimeout(() => {
      setIsRunningSimulation(false);
    }, 3000);
  };

  const currentScenario = scenarios.find(s => s.id === activeScenario);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Financial Scenario Planning
          </h2>
          <p className="text-slate-500 text-sm">Advanced what-if analysis and stress testing for strategic planning</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Parameters
          </Button>
          <Button 
            onClick={runSimulation}
            disabled={isRunningSimulation}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {isRunningSimulation ? "Running..." : "Run Simulation"}
          </Button>
        </div>
      </div>

      {/* Scenario Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Scenario Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <div 
                    key={scenario.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      activeScenario === scenario.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{scenario.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{scenario.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getScenarioColor(scenario.type)}>
                          {scenario.type}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700">
                          {scenario.probability}% likely
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Projected Revenue</p>
                        <p className="font-semibold text-slate-900">
                          ${(scenario.results.projectedRevenue / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Net Income</p>
                        <p className={`font-semibold ${
                          scenario.results.netIncome > 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          ${(scenario.results.netIncome / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Cash Flow</p>
                        <p className="font-semibold text-blue-700">
                          ${(scenario.results.cashFlow / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Risk Score</p>
                        <Badge className={getRiskColor(scenario.results.riskScore)}>
                          {scenario.results.riskScore}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Scenario Builder */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Custom Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Revenue Growth (%)</Label>
                <Slider
                  value={customParameters.revenueGrowth}
                  onValueChange={(value) => setCustomParameters(prev => ({ ...prev, revenueGrowth: value }))}
                  max={50}
                  min={-20}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>-20%</span>
                  <span className="font-medium">{customParameters.revenueGrowth[0]}%</span>
                  <span>50%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Expense Increase (%)</Label>
                <Slider
                  value={customParameters.expenseIncrease}
                  onValueChange={(value) => setCustomParameters(prev => ({ ...prev, expenseIncrease: value }))}
                  max={30}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{customParameters.expenseIncrease[0]}%</span>
                  <span>30%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Market Conditions</Label>
                <Slider
                  value={customParameters.marketConditions}
                  onValueChange={(value) => setCustomParameters(prev => ({ ...prev, marketConditions: value }))}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Poor</span>
                  <span className="font-medium">{customParameters.marketConditions[0]}%</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Customer Retention (%)</Label>
                <Slider
                  value={customParameters.customerRetention}
                  onValueChange={(value) => setCustomParameters(prev => ({ ...prev, customerRetention: value }))}
                  max={100}
                  min={50}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50%</span>
                  <span className="font-medium">{customParameters.customerRetention[0]}%</span>
                  <span>100%</span>
                </div>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate Scenario
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monte Carlo Simulation */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Monte Carlo Simulation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Probability Distribution</h4>
              {monteCarloResults.map((result, index) => (
                <div key={index} className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-slate-900">{result.scenario}</span>
                      <Badge className="bg-blue-100 text-blue-700">{result.probability}% Confidence</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Revenue Range</p>
                        <p className="font-medium text-slate-900">
                          ${(result.revenue.min / 1000000).toFixed(1)}M - ${(result.revenue.max / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-slate-600">Mean: ${(result.revenue.mean / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Expense Range</p>
                        <p className="font-medium text-slate-900">
                          ${(result.expenses.min / 1000000).toFixed(1)}M - ${(result.expenses.max / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-slate-600">Mean: ${(result.expenses.mean / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Profit Range</p>
                        <p className="font-medium text-slate-900">
                          ${(result.profit.min / 1000).toFixed(0)}K - ${(result.profit.max / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-slate-600">Mean: ${(result.profit.mean / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Key Insights</h4>
              <div className="space-y-3">
                <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-900">High Probability of Profitability</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    85% chance of achieving positive net income above $300K
                  </p>
                </div>
                
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Revenue Growth Potential</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Strong upside potential with 25% chance of exceeding $2.8M revenue
                  </p>
                </div>
                
                <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Downside Risk</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    15% probability of losses if market conditions deteriorate significantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stress Testing */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Stress Testing Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stressTests.map((test) => (
              <div key={test.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-900">{test.name}</h4>
                  <Badge className={getStressLevelColor(test.riskLevel)}>
                    {test.riskLevel} risk
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">{test.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Impact Assessment</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Cash Flow Reduction</span>
                        <span className="text-xs font-medium text-red-700">-{test.impact.cashFlowReduction}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Profitability Impact</span>
                        <span className="text-xs font-medium text-red-700">-{test.impact.profitabilityImpact}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Recovery Time</span>
                        <span className="text-xs font-medium text-slate-700">{test.impact.recoveryTime} months</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <LineChart className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}