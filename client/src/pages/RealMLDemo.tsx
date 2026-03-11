/**
 * Real ML Demo Page
 * Showcases all 6 real machine learning models
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Brain, TrendingUp, Shield, Package, DollarSign, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RealMLDemo() {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [trainingResults, setTrainingResults] = useState<any>(null);

  const statusQuery = trpc.mlReal.getTrainingStatus.useQuery();
  const trainMutation = trpc.mlReal.trainAllModels.useMutation({
    onSuccess: (data) => {
      setTrainingStatus('success');
      setTrainingResults(data);
      statusQuery.refetch();
    },
    onError: () => {
      setTrainingStatus('error');
    }
  });

  const handleTrainModels = async () => {
    setTrainingStatus('training');
    trainMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Real Machine Learning System
          </h1>
          <p className="text-muted-foreground mt-2">
            6 trained ML models using TensorFlow.js, K-Means, LSTM, and more
          </p>
        </div>
        <Button
          onClick={handleTrainModels}
          disabled={trainingStatus === 'training'}
          size="lg"
        >
          {trainingStatus === 'training' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Training Models...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Train All Models
            </>
          )}
        </Button>
      </div>

      {/* Training Status Alert */}
      {trainingStatus === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All models trained successfully! {trainingResults?.results && 
              `${Object.values(trainingResults.results).filter((r: any) => r.trained).length}/6 models ready.`
            }
          </AlertDescription>
        </Alert>
      )}

      {trainingStatus === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Training failed. Check console for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Model Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Model Status</CardTitle>
          <CardDescription>Current training status of all ML models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusQuery.data && Object.entries(statusQuery.data).map(([name, status]: [string, any]) => (
              <Card key={name} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold capitalize">
                      {name.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <Badge variant={status.trained ? 'default' : 'secondary'}>
                      {status.trained ? 'Trained' : 'Not Trained'}
                    </Badge>
                  </div>
                  {status.info && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {status.info.clusters && <p>Clusters: {status.info.clusters}</p>}
                      {status.info.features && <p>Features: {status.info.features}</p>}
                      {status.info.lookbackDays && <p>Lookback: {status.info.lookbackDays} days</p>}
                      {status.info.trees && <p>Trees: {status.info.trees}</p>}
                      {status.info.algorithm && <p>Algorithm: {status.info.algorithm}</p>}
                      {status.info.architecture && <p>Architecture: {status.info.architecture}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Demos */}
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="lead">
            <Users className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="demand">
            <TrendingUp className="h-4 w-4 mr-2" />
            Demand
          </TabsTrigger>
          <TabsTrigger value="fraud">
            <Shield className="h-4 w-4 mr-2" />
            Fraud
          </TabsTrigger>
          <TabsTrigger value="reorder">
            <Package className="h-4 w-4 mr-2" />
            Reorder
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <DollarSign className="h-4 w-4 mr-2" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockClassificationDemo />
        </TabsContent>

        <TabsContent value="lead">
          <LeadScoringDemo />
        </TabsContent>

        <TabsContent value="demand">
          <DemandForecastingDemo />
        </TabsContent>

        <TabsContent value="fraud">
          <FraudDetectionDemo />
        </TabsContent>

        <TabsContent value="reorder">
          <ReorderOptimizationDemo />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowForecastingDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stock Classification Demo Component
function StockClassificationDemo() {
  const [result, setResult] = useState<any>(null);
  const classifyMutation = trpc.mlReal.classifyProducts.useMutation({
    onSuccess: (data) => setResult(data)
  });

  const testProducts = [
    { productId: 1, productName: 'High Seller', totalRevenue: 50000, turnoverRate: 8, movementFrequency: 25, avgOrderSize: 100, daysInStock: 30 },
    { productId: 2, productName: 'Medium Seller', totalRevenue: 20000, turnoverRate: 4, movementFrequency: 12, avgOrderSize: 50, daysInStock: 60 },
    { productId: 3, productName: 'Slow Mover', totalRevenue: 5000, turnoverRate: 1, movementFrequency: 3, avgOrderSize: 20, daysInStock: 120 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Classification (K-Means Clustering)</CardTitle>
        <CardDescription>
          Automatically groups products into A/B/C classes using unsupervised learning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => classifyMutation.mutate({ products: testProducts })}>
          Classify Test Products
        </Button>

        {result && (
          <div className="space-y-2">
            <h3 className="font-semibold">Classification Results:</h3>
            {result.map((r: any) => (
              <div key={r.productId} className="flex items-center justify-between p-3 border rounded">
                <span>{r.productName}</span>
                <Badge variant={r.class === 'A' ? 'default' : r.class === 'B' ? 'secondary' : 'outline'}>
                  Class {r.class} (Cluster {r.cluster})
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lead Scoring Demo Component
function LeadScoringDemo() {
  const [result, setResult] = useState<any>(null);
  const scoreMutation = trpc.mlReal.scoreLead.useMutation({
    onSuccess: (data) => setResult(data)
  });

  const testLead = {
    engagementScore: 85,
    companySize: 500,
    industryScore: 5,
    interactionCount: 15,
    emailOpenRate: 75,
    websiteVisits: 10,
    demoRequested: 1,
    budgetRange: 50000,
    decisionMaker: 1,
    responseTime: 24
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Scoring (Logistic Regression)</CardTitle>
        <CardDescription>
          Predicts conversion probability using trained neural network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => scoreMutation.mutate(testLead)}>
          Score Test Lead
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Probability</p>
                <p className="text-3xl font-bold">{(result.probability * 100).toFixed(1)}%</p>
              </div>
              <Badge variant={result.category === 'hot' ? 'default' : result.category === 'warm' ? 'secondary' : 'outline'}>
                {result.category.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Demand Forecasting Demo Component
function DemandForecastingDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demand Forecasting (LSTM Neural Network)</CardTitle>
        <CardDescription>
          Deep learning model predicts future demand from historical patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          LSTM architecture: 50→50→25→1 with dropout layers
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Learns complex temporal dependencies automatically
        </p>
      </CardContent>
    </Card>
  );
}

// Fraud Detection Demo Component
function FraudDetectionDemo() {
  const [result, setResult] = useState<any>(null);
  const detectMutation = trpc.mlReal.detectFraud.useMutation({
    onSuccess: (data) => setResult(data)
  });

  const suspiciousTransaction = {
    amount: 5000,
    hour: 2,
    dayOfWeek: 6,
    transactionFrequency24h: 15,
    avgAmount: 300,
    stdDevAmount: 100,
    timeSinceLastTransaction: 3,
    isWeekend: 1,
    isRoundAmount: 1
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Detection (Isolation Forest)</CardTitle>
        <CardDescription>
          100 isolation trees detect anomalous transaction patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => detectMutation.mutate(suspiciousTransaction)}>
          Analyze Suspicious Transaction
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="text-sm text-muted-foreground">Anomaly Score</p>
                <p className="text-3xl font-bold">{result.score}</p>
              </div>
              <Badge variant={result.risk === 'critical' ? 'destructive' : result.risk === 'high' ? 'default' : 'secondary'}>
                {result.risk.toUpperCase()} RISK
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Factors:</p>
              {result.factors.map((factor: string, i: number) => (
                <p key={i} className="text-sm text-muted-foreground">• {factor}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Reorder Optimization Demo Component
function ReorderOptimizationDemo() {
  const [result, setResult] = useState<any>(null);
  const optimizeMutation = trpc.mlReal.optimizeReorder.useMutation({
    onSuccess: (data) => setResult(data)
  });

  const testState = {
    currentStock: 50,
    avgDailyDemand: 10,
    demandTrend: 0.2,
    leadTimeDays: 7,
    daysUntilStockout: 5,
    seasonalFactor: 1.2
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reorder Optimization (Deep Q-Learning)</CardTitle>
        <CardDescription>
          Reinforcement learning learns optimal reorder policy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => optimizeMutation.mutate(testState)}>
          Get Reorder Recommendation
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="text-sm text-muted-foreground">Recommended Order</p>
                <p className="text-3xl font-bold">{result.orderQuantity} units</p>
              </div>
              <Badge variant={result.shouldReorder ? 'default' : 'secondary'}>
                {result.shouldReorder ? 'REORDER NOW' : 'NO ACTION'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Reasoning:</p>
              {result.reasoning.map((reason: string, i: number) => (
                <p key={i} className="text-sm text-muted-foreground">{reason}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Cash Flow Forecasting Demo Component
function CashFlowForecastingDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Forecasting (Prophet Algorithm)</CardTitle>
        <CardDescription>
          Neural network trend + Fourier seasonality with changepoint detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Components: Trend (neural network) + Weekly seasonality + Uncertainty
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Automatic changepoint detection for trend shifts
        </p>
      </CardContent>
    </Card>
  );
}
