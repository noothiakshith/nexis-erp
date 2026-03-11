/**
 * Real ML Finance Intelligence
 * Fraud Detection (Isolation Forest) + Cash Flow Forecasting (Prophet)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { Shield, DollarSign, AlertTriangle, Loader2, Brain, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RealMLFinanceIntelligence() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Real ML Finance Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Isolation Forest + Prophet Algorithm
        </p>
      </div>

      <Tabs defaultValue="fraud" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fraud">
            <Shield className="h-4 w-4 mr-2" />
            Fraud Detection
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <DollarSign className="h-4 w-4 mr-2" />
            Cash Flow Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fraud">
          <FraudDetectionML />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowForecastingML />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FraudDetectionML() {
  const [transactionData, setTransactionData] = useState({
    amount: 2500,
    hour: 14,
    dayOfWeek: 3,
    transactionFrequency24h: 2,
    avgAmount: 300,
    stdDevAmount: 100,
    timeSinceLastTransaction: 120,
    isWeekend: 0,
    isRoundAmount: 0
  });

  const statusQuery = trpc.mlReal.getTrainingStatus.useQuery();
  const detectMutation = trpc.mlReal.detectFraud.useMutation();

  const handleDetectFraud = () => {
    detectMutation.mutate(transactionData);
  };

  const fraudStatus = statusQuery.data?.fraudDetection;
  const result = detectMutation.data;

  return (
    <div className="space-y-4">
      {/* Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Isolation Forest Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {fraudStatus?.trained ? 'Model Trained' : 'Not Trained'}
              </p>
            </div>
            <Badge variant={fraudStatus?.trained ? 'default' : 'secondary'}>
              {fraudStatus?.info?.trees || 0} Trees
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Input */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Enter transaction data for fraud analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={transactionData.amount}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Hour (0-23)</Label>
              <Input
                type="number"
                value={transactionData.hour}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, hour: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Day of Week (0-6)</Label>
              <Input
                type="number"
                value={transactionData.dayOfWeek}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, dayOfWeek: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Frequency (24h)</Label>
              <Input
                type="number"
                value={transactionData.transactionFrequency24h}
                onChange={(e) =>
                  setTransactionData({
                    ...transactionData,
                    transactionFrequency24h: Number(e.target.value)
                  })
                }
              />
            </div>
            <div>
              <Label>Avg Amount ($)</Label>
              <Input
                type="number"
                value={transactionData.avgAmount}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, avgAmount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Time Since Last (min)</Label>
              <Input
                type="number"
                value={transactionData.timeSinceLastTransaction}
                onChange={(e) =>
                  setTransactionData({
                    ...transactionData,
                    timeSinceLastTransaction: Number(e.target.value)
                  })
                }
              />
            </div>
          </div>

          <Button
            onClick={handleDetectFraud}
            disabled={!fraudStatus?.trained || detectMutation.isPending}
            className="w-full"
          >
            {detectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Detect Fraud with ML
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card
          className={`border-2 ${
            result.risk === 'critical'
              ? 'border-red-300 bg-red-50'
              : result.risk === 'high'
              ? 'border-orange-300 bg-orange-50'
              : result.risk === 'medium'
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-green-300 bg-green-50'
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${
                  result.risk === 'critical'
                    ? 'text-red-600'
                    : result.risk === 'high'
                    ? 'text-orange-600'
                    : result.risk === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}
              />
              Fraud Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomaly Score</p>
                <p className="text-4xl font-bold">{result.score}</p>
              </div>
              <Badge
                variant={
                  result.risk === 'critical' || result.risk === 'high'
                    ? 'destructive'
                    : result.risk === 'medium'
                    ? 'default'
                    : 'secondary'
                }
                className="text-lg px-4 py-2"
              >
                {result.risk.toUpperCase()} RISK
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Detected Factors:</p>
              {result.factors.map((factor: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-white rounded border">
              <p className="font-semibold mb-1">Algorithm: Isolation Forest</p>
              <p>100 isolation trees detect anomalous patterns in transaction data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CashFlowForecastingML() {
  const statusQuery = trpc.mlReal.getTrainingStatus.useQuery();
  const cashFlowStatus = statusQuery.data?.cashFlowForecasting;

  return (
    <div className="space-y-4">
      {/* Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prophet Algorithm Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {cashFlowStatus?.trained ? 'Model Trained' : 'Not Trained'}
                </p>
              </div>
              <Badge variant={cashFlowStatus?.trained ? 'default' : 'secondary'}>
                Prophet-like
              </Badge>
            </div>
            {cashFlowStatus?.info && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Components: {cashFlowStatus.info.components?.join(', ')}</p>
                <p>Seasonal Period: {cashFlowStatus.info.seasonalPeriod} days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <p className="font-semibold text-blue-900">Prophet Algorithm Features:</p>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Neural network learns trend component</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Fourier series captures weekly seasonality</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Automatic changepoint detection for trend shifts</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Uncertainty quantification with confidence intervals</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
