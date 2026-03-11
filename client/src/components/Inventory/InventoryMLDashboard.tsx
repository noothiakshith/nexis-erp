import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Brain, 
  TrendingUp, 
  Package, 
  AlertCircle,
  Loader2,
  BarChart3,
  Target,
  Zap
} from "lucide-react";

export function InventoryMLDashboard() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // ML Queries
  const { data: classification, isLoading: classLoading } = trpc.ai.classifyStock.useQuery();
  const { data: batchForecast, isLoading: forecastLoading } = trpc.ai.batchDemandForecast.useQuery({ daysAhead: 30 });
  const { data: batchOptimization, isLoading: optimizationLoading } = trpc.ai.batchOptimizeReorder.useQuery();
  
  // Single product queries (only when selected)
  const { data: singleForecast } = trpc.ai.demandForecast.useQuery(
    { productId: selectedProductId!, daysAhead: 30 },
    { enabled: !!selectedProductId }
  );
  const { data: singleOptimization } = trpc.ai.optimizeReorder.useQuery(
    { productId: selectedProductId! },
    { enabled: !!selectedProductId }
  );

  const getClassColor = (cls: string) => {
    switch (cls) {
      case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'C': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-100 rounded-2xl">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Inventory ML Intelligence</h2>
              <p className="text-slate-600 mt-1">
                Real-time predictions powered by machine learning algorithms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Products Analyzed</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {classification?.summary?.totalProducts || 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1">ABC Classification</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Forecasts Generated</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {batchForecast?.forecastedProducts || 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1">30-day predictions</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Optimizations</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {batchOptimization?.optimizedProducts || 0}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Reorder points calculated</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABC Classification */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                ABC Stock Classification (ML)
              </CardTitle>
              <CardDescription>
                Products classified by revenue, turnover, and frequency using K-Means clustering
              </CardDescription>
            </div>
            {classLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>
        </CardHeader>
        <CardContent>
          {classLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Running ML classification...</p>
            </div>
          ) : classification?.classifications && classification.classifications.length > 0 ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-700 mb-1">Class A (Fast Movers)</p>
                  <p className="text-2xl font-bold text-emerald-900">{classification.summary.classA.count}</p>
                  <p className="text-xs text-emerald-600 mt-1">{classification.summary.classA.revenuePercent}% of revenue</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Class B (Medium Movers)</p>
                  <p className="text-2xl font-bold text-blue-900">{classification.summary.classB.count}</p>
                  <p className="text-xs text-blue-600 mt-1">{classification.summary.classB.revenuePercent}% of revenue</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-700 mb-1">Class C (Slow Movers)</p>
                  <p className="text-2xl font-bold text-amber-900">{classification.summary.classC.count}</p>
                  <p className="text-xs text-amber-600 mt-1">{classification.summary.classC.revenuePercent}% of revenue</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-center">Class</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Turnover</th>
                      <th className="px-4 py-3 text-center">Priority</th>
                      <th className="px-4 py-3">Recommendations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classification.classifications.map((item: any) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 text-sm">{item.productName}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getClassColor(item.class)}>
                            Class {item.class}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm font-bold text-slate-700">{item.score}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          ${item.metrics.revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {item.metrics.turnover}x
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={
                            item.priority === 'high' ? 'border-emerald-300 text-emerald-700' :
                            item.priority === 'medium' ? 'border-blue-300 text-blue-700' :
                            'border-amber-300 text-amber-700'
                          }>
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-600 max-w-xs">
                            {item.recommendations[0]}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Classification Data</h3>
              <p className="text-slate-500">Add products and stock movements to enable ML classification.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demand Forecasting */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Demand Forecasting (ML)
              </CardTitle>
              <CardDescription>
                30-day demand predictions using time-series analysis with trend and seasonality
              </CardDescription>
            </div>
            {forecastLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>
        </CardHeader>
        <CardContent>
          {forecastLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Generating forecasts...</p>
            </div>
          ) : batchForecast?.forecasts && batchForecast.forecasts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Avg Daily Demand</th>
                    <th className="px-4 py-3 text-right">30-Day Forecast</th>
                    <th className="px-4 py-3 text-center">Trend</th>
                    <th className="px-4 py-3 text-center">Seasonality</th>
                    <th className="px-4 py-3">Peak Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchForecast.forecasts.map((forecast: any) => (
                    <tr key={forecast.productId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 text-sm">{forecast.productName}</p>
                        <p className="text-xs text-slate-500 font-mono">{forecast.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-bold text-slate-700">
                          {forecast.avgDailyDemand}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {forecast.totalForecast}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={
                          forecast.trend === 'increasing' ? 'border-emerald-300 text-emerald-700' :
                          forecast.trend === 'decreasing' ? 'border-red-300 text-red-700' :
                          'border-slate-300 text-slate-700'
                        }>
                          {forecast.trend}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {forecast.seasonalityDetected ? (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            Detected
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {forecast.peakDay}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Insufficient Data</h3>
              <p className="text-slate-500">
                Need at least 7 days of stock movement history per product to generate forecasts.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Run: <code className="bg-slate-100 px-2 py-1 rounded">npx tsx server/seedInventoryData.ts</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reorder Optimization */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Reorder Optimization (ML)
              </CardTitle>
              <CardDescription>
                Optimal reorder points and quantities using Economic Order Quantity (EOQ) model
              </CardDescription>
            </div>
            {optimizationLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>
        </CardHeader>
        <CardContent>
          {optimizationLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Calculating optimizations...</p>
            </div>
          ) : batchOptimization?.optimizations && batchOptimization.optimizations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Current ROP</th>
                    <th className="px-4 py-3 text-center">Optimized ROP</th>
                    <th className="px-4 py-3 text-center">Optimized Qty</th>
                    <th className="px-4 py-3 text-center">Safety Stock</th>
                    <th className="px-4 py-3 text-right">Annual Cost</th>
                    <th className="px-4 py-3 text-center">Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchOptimization.optimizations.map((opt: any) => (
                    <tr key={opt.productId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 text-sm">{opt.productName}</p>
                        <p className="text-xs text-slate-500 font-mono">{opt.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-sm text-slate-600">{opt.currentReorderPoint}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-sm font-bold text-blue-700">{opt.optimizedReorderPoint}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-sm font-bold text-emerald-700">{opt.optimizedReorderQuantity}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-sm text-slate-700">{opt.safetyStock}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">
                        ${opt.expectedAnnualCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getUrgencyColor(opt.urgency)}>
                          {opt.urgency}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Insufficient Data</h3>
              <p className="text-slate-500">
                Need at least 7 days of demand history per product to calculate optimizations.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Run: <code className="bg-slate-100 px-2 py-1 rounded">npx tsx server/seedInventoryData.ts</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
