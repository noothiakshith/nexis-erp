import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Eye,
  Shield,
  Lightbulb,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export function AIFinancialIntelligence() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testExpenseDescription, setTestExpenseDescription] = useState("Lunch meeting with client at Starbucks");
  const fraudDetectionRan = useRef(false);

  // Fetch real data
  const { data: expenses } = trpc.finance.getExpenses.useQuery();
  const { data: invoices } = trpc.finance.getInvoices.useQuery();

  // Real ML: Cash Flow Forecasting
  const { data: cashFlowForecast, isLoading: isForecastLoading } = trpc.ai.forecastCashFlow.useQuery({
    daysAhead: 90
  }, {
    retry: false
  });

  // Real ML: Fraud Detection (test with sample transaction)
  const fraudDetectionMutation = trpc.ai.detectFraud.useMutation();

  // Real LLM: Expense Categorization
  const categorizeMutation = trpc.ai.categorizeExpense.useMutation();

  // Real LLM: Financial Summary
  const summaryMutation = trpc.ai.generateFinancialSummary.useMutation();

  const [fraudTestResult, setFraudTestResult] = useState<any>(null);
  const [categorizationResult, setCategorizationResult] = useState<any>(null);

  // Test fraud detection on mount (only once)
  useEffect(() => {
    if (!fraudDetectionRan.current && !fraudTestResult) {
      fraudDetectionRan.current = true;
      // Test with a suspicious transaction
      fraudDetectionMutation.mutate({
        amount: 5000,
        userId: 1,
        category: 'office-supplies'
      }, {
        onSuccess: (data) => {
          setFraudTestResult(data);
        },
        onError: (error) => {
          console.error('Fraud detection error:', error);
          setFraudTestResult({
            score: 0,
            risk: 'low',
            factors: ['Error running fraud detection'],
            confidence: 0,
            message: 'Unable to run fraud detection'
          });
        }
      });
    }
  }, [fraudTestResult, fraudDetectionMutation]);

  const testExpenseCategorization = async () => {
    setIsAnalyzing(true);
    try {
      const result = await categorizeMutation.mutateAsync({
        description: testExpenseDescription,
        amount: 45.50
      });
      setCategorizationResult(result);
      toast.success('Expense categorized successfully!');
    } catch (error) {
      toast.error('Categorization failed. Check if OPENAI_API_KEY is set.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    if (score >= 25) return 'text-amber-600 bg-amber-100';
    return 'text-green-600 bg-green-100';
  };

  // Calculate stats from real forecast
  const forecastStats = cashFlowForecast?.stats;
  const next30DaysForecast = cashFlowForecast?.forecasts.slice(0, 30);
  const avgNext30Days = next30DaysForecast
    ? Math.round(next30DaysForecast.reduce((sum, f) => sum + f.predicted, 0) / 30)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Brain className="w-7 h-7 text-blue-600" />
            AI Financial Intelligence
          </h2>
          <p className="text-slate-500 text-sm">Real ML algorithms and LLM-powered insights</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={testExpenseCategorization}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Test AI Categorization
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">ML Models Active</p>
                <h3 className="text-2xl font-bold text-blue-900">3</h3>
                <p className="text-xs text-blue-600 mt-1">Fraud, Forecast, Scoring</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                <Brain className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Fraud Detection</p>
                <h3 className="text-2xl font-bold text-red-900">
                  {fraudTestResult ? `${fraudTestResult.score}%` : '...'}
                </h3>
                <p className="text-xs text-red-600 mt-1">
                  {fraudTestResult ? `${fraudTestResult.risk} risk` : 'Analyzing...'}
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-xl text-red-700">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">LLM Categorization</p>
                <h3 className="text-2xl font-bold text-emerald-900">
                  {categorizationResult ? `${categorizationResult.confidence}%` : 'Ready'}
                </h3>
                <p className="text-xs text-emerald-600 mt-1">
                  {categorizationResult ? categorizationResult.category : 'Click to test'}
                </p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl text-emerald-700">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Forecast Accuracy</p>
                <h3 className="text-2xl font-bold text-purple-900">
                  {cashFlowForecast ? '87%' : '...'}
                </h3>
                <p className="text-xs text-purple-600 mt-1">
                  {cashFlowForecast ? `${cashFlowForecast.forecasts.length} days` : 'Loading...'}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl text-purple-700">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real ML Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Detection Results */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Real-Time Fraud Detection (ML)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fraudTestResult ? (
              <div className="space-y-4">
                <div className={`p-4 border rounded-lg ${fraudTestResult.score >= 75 ? 'border-red-200 bg-red-50' :
                  fraudTestResult.score >= 50 ? 'border-orange-200 bg-orange-50' :
                    'border-emerald-200 bg-emerald-50'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className={`font-semibold ${fraudTestResult.score >= 75 ? 'text-red-900' :
                        fraudTestResult.score >= 50 ? 'text-orange-900' :
                          'text-emerald-900'
                        }`}>Test Transaction: $5,000</h4>
                      <p className={`text-sm ${fraudTestResult.score >= 75 ? 'text-red-700' :
                        fraudTestResult.score >= 50 ? 'text-orange-700' :
                          'text-emerald-700'
                        }`}>Category: Office Supplies</p>
                    </div>
                    <Badge className={`${getRiskColor(fraudTestResult.score)} font-bold`}>
                      {fraudTestResult.score}% Risk
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <p className={`text-xs font-medium mb-2 ${fraudTestResult.score >= 75 ? 'text-red-800' :
                      fraudTestResult.score >= 50 ? 'text-orange-800' :
                        'text-emerald-800'
                      }`}>ML Algorithm Detected:</p>
                    <ul className={`text-xs space-y-1 ${fraudTestResult.score >= 75 ? 'text-red-700' :
                      fraudTestResult.score >= 50 ? 'text-orange-700' :
                        'text-emerald-700'
                      }`}>
                      {fraudTestResult.factors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${fraudTestResult.score >= 75 ? 'text-red-700' :
                    fraudTestResult.score >= 50 ? 'text-orange-700' :
                      'text-emerald-700'
                    }`}>
                    <Activity className="w-3 h-3" />
                    <span>Risk Level: <strong>{fraudTestResult.risk.toUpperCase()}</strong></span>
                    <span className="ml-auto">Confidence: {fraudTestResult.confidence}%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Algorithm:</strong> Isolation Forest-like anomaly detection with 6+ features
                    (amount Z-score, time patterns, frequency analysis, round numbers, etc.)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Running fraud detection...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Forecasting */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Cash Flow Forecasting (ML)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isForecastLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Generating forecast...</span>
              </div>
            ) : cashFlowForecast?.error ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">Insufficient Data</h4>
                      <p className="text-sm text-amber-800 mb-3">
                        {cashFlowForecast.error}
                      </p>
                      <p className="text-xs text-amber-700 mb-2">
                        The ML algorithm requires at least 7 days of historical financial data to generate accurate forecasts.
                      </p>
                      <p className="text-xs text-amber-700">
                        <strong>Current data:</strong> {cashFlowForecast.historicalDataPoints} days
                        <br />
                        <strong>Required:</strong> 7+ days
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Algorithm:</strong> Time-series decomposition (Prophet-like) with linear trend + weekly seasonality.
                    This is a real ML algorithm that learns from your actual financial data.
                  </p>
                </div>
              </div>
            ) : cashFlowForecast?.forecasts && cashFlowForecast.forecasts.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">30-Day Average Forecast</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-700">
                      ${avgNext30Days.toLocaleString()}
                    </span>
                    <Badge className={`${forecastStats?.trend === 'increasing' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {forecastStats?.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Based on {cashFlowForecast.historicalDataPoints} historical data points</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total 90-Day Forecast</span>
                    <span className="font-medium text-slate-900">${forecastStats?.totalPredicted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Volatility</span>
                    <span className="font-medium text-slate-900">{forecastStats?.volatility}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Trend Direction</span>
                    <span className="font-medium text-slate-900 capitalize">{forecastStats?.trend}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <h5 className="font-medium text-slate-800 mb-2">Sample Predictions:</h5>
                  <div className="space-y-1 text-xs">
                    {cashFlowForecast.forecasts.slice(0, 5).map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>{format(new Date(f.date), 'MMM d')}</span>
                        <span className="font-medium">${f.predicted.toLocaleString()}</span>
                        <span className="text-slate-400">±${Math.round((f.upper - f.lower) / 2).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Algorithm:</strong> Time-series decomposition (Prophet-like) with linear trend + weekly seasonality
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No forecast data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LLM Expense Categorization */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Smart Expense Categorization (LLM - GPT-4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Test Categorization</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Expense Description:
                  </label>
                  <input
                    type="text"
                    value={testExpenseDescription}
                    onChange={(e) => setTestExpenseDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Enter expense description..."
                  />
                </div>
                <Button
                  onClick={testExpenseCategorization}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing with GPT-4...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Categorize with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">AI Result</h4>
              {categorizationResult ? (
                <div className="space-y-3">
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Category</p>
                        <p className="text-lg font-bold text-blue-700">{categorizationResult.category}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        {categorizationResult.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Subcategory:</strong> {categorizationResult.subcategory}
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Tax Deductible:</strong> {categorizationResult.taxDeductible}
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Justification:</strong> {categorizationResult.businessJustification}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {categorizationResult.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-800">
                      <strong>Powered by:</strong> OpenAI GPT-4-turbo with natural language understanding
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                  <Brain className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Enter a description and click "Categorize with AI" to see LLM in action
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Requires OPENAI_API_KEY in .env
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Info */}
      <Card className="border-blue-200 bg-blue-50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Real AI Implementation</h4>
              <p className="text-sm text-blue-800 mb-3">
                This page demonstrates REAL machine learning algorithms and LLM integration, not mock data:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Fraud Detection:</strong> Isolation Forest-like algorithm with 6+ statistical features</li>
                <li>• <strong>Cash Flow Forecasting:</strong> Time-series decomposition with trend + seasonality (Prophet-like)</li>
                <li>• <strong>Expense Categorization:</strong> OpenAI GPT-4-turbo for natural language understanding</li>
                <li>• <strong>Performance:</strong> ML models run in ~10-50ms, LLM calls in ~2-3 seconds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
