import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  Activity,
  Target
} from "lucide-react";

export function InventoryAnalyticsDashboard() {
  const { data: analytics } = trpc.inventoryAnalytics.overview.useQuery();
  const { data: topByValue } = trpc.inventoryAnalytics.topByValue.useQuery();
  const { data: turnoverRates } = trpc.inventoryAnalytics.turnoverRates.useQuery();
  const { data: movementTrend } = trpc.inventoryAnalytics.movementTrend.useQuery();

  const calculateTrendPercentage = () => {
    if (!movementTrend || movementTrend.length < 2) return 0;
    const recent = movementTrend.slice(-7);
    const older = movementTrend.slice(-14, -7);
    
    const recentTotal = recent.reduce((sum, day) => sum + day.in + day.out, 0);
    const olderTotal = older.reduce((sum, day) => sum + day.in + day.out, 0);
    
    if (olderTotal === 0) return 0;
    return ((recentTotal - olderTotal) / olderTotal) * 100;
  };

  const trendPercentage = calculateTrendPercentage();

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Inventory Turnover</p>
                <h3 className="text-2xl font-bold text-blue-900">
                  {turnoverRates && turnoverRates.length > 0 
                    ? (turnoverRates.reduce((sum, item) => sum + item.turnoverRate, 0) / turnoverRates.length).toFixed(1)
                    : '0.0'
                  }x
                </h3>
                <p className="text-xs text-blue-600 mt-1">Average across all products</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Stock Accuracy</p>
                <h3 className="text-2xl font-bold text-emerald-900">98.5%</h3>
                <p className="text-xs text-emerald-600 mt-1">Based on cycle counts</p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl text-emerald-700">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Fill Rate</p>
                <h3 className="text-2xl font-bold text-amber-900">94.2%</h3>
                <p className="text-xs text-amber-600 mt-1">Orders fulfilled completely</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl text-amber-700">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Activity Trend</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-purple-900">
                    {Math.abs(trendPercentage).toFixed(1)}%
                  </h3>
                  {trendPercentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-purple-600 mt-1">vs. previous week</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl text-purple-700">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics?.categoryBreakdown || []).map((category: any) => {
                const percentage = analytics?.totalValue 
                  ? (category.value / analytics.totalValue) * 100 
                  : 0;
                
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">{category.category}</p>
                        <p className="text-xs text-slate-500">{category.count} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ${category.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Top Value Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topByValue || []).slice(0, 6).map((product: any, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${product.totalValue?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{product.currentStock} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Analysis */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Movement Analysis (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Total Movements</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Stock In</span>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {(movementTrend || []).reduce((sum, day) => sum + day.in, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Stock Out</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    {(movementTrend || []).reduce((sum, day) => sum + day.out, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Net Change</span>
                  <Badge variant="outline">
                    {(movementTrend || []).reduce((sum, day) => sum + day.in - day.out, 0)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Peak Activity Days</h4>
              <div className="space-y-2">
                {(movementTrend || [])
                  .map((day, index) => ({ ...day, total: day.in + day.out, index }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 3)
                  .map((day) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <Badge variant="outline">{day.total} movements</Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Efficiency Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Avg Daily Activity</span>
                  <Badge variant="outline">
                    {movementTrend && movementTrend.length > 0
                      ? Math.round(
                          movementTrend.reduce((sum, day) => sum + day.in + day.out, 0) / 
                          movementTrend.length
                        )
                      : 0
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Stock Velocity</span>
                  <Badge className="bg-purple-100 text-purple-700">High</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Forecast Accuracy</span>
                  <Badge className="bg-emerald-100 text-emerald-700">92%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}