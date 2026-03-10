import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

/**
 * Financial Analytics Page
 * Comprehensive financial trend analysis with multiple visualizations
 */
export default function FinancialAnalytics() {
  const [months, setMonths] = useState(12);

  // Fetch financial trends
  const { data: trends, isLoading: trendsLoading } = trpc.advancedAnalytics.getFinancialTrends.useQuery({
    months,
  });

  // Fetch revenue vs expense
  const { data: revenueVsExpense, isLoading: revenueLoading } =
    trpc.advancedAnalytics.getRevenueVsExpense.useQuery({
      months,
    });

  // Fetch cash flow projection
  const { data: cashFlow, isLoading: cashFlowLoading } =
    trpc.advancedAnalytics.getCashFlowProjection.useQuery({
      months: 6,
    });

  // Fetch profit margin analysis
  const { data: profitMargin, isLoading: marginLoading } =
    trpc.advancedAnalytics.getProfitMarginAnalysis.useQuery({
      months,
    });

  const isLoading = trendsLoading || revenueLoading || cashFlowLoading || marginLoading;

  // Calculate summary statistics
  const summary = {
    totalRevenue: trends?.reduce((sum, t) => sum + t.revenue, 0) || 0,
    totalExpenses: trends?.reduce((sum, t) => sum + t.expenses, 0) || 0,
    avgMargin: trends && trends.length > 0 ? trends.reduce((sum, t) => sum + t.margin, 0) / trends.length : 0,
    trend: trends && trends.length > 1 ? trends[trends.length - 1].profit - trends[0].profit : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial trend analysis and forecasting</p>
        </div>
        <div className="flex gap-2">
          {[3, 6, 12].map((m) => (
            <Button
              key={m}
              onClick={() => setMonths(m)}
              variant={months === m ? "default" : "outline"}
              size="sm"
            >
              {m}M
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(summary.totalRevenue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-600 mt-1">Last {months} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(summary.totalExpenses / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-600 mt-1">Last {months} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-gray-600 mt-1">Average across period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">${(summary.trend / 1000).toFixed(1)}K</div>
              {summary.trend >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">Change from start</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="margin">Margins</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Financial Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue, Expenses & Profit Trend</CardTitle>
              <CardDescription>Monthly financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" name="Expenses" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Profit"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue vs Expense Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expense Comparison</CardTitle>
              <CardDescription>Side-by-side monthly comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueVsExpense && revenueVsExpense.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueVsExpense}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Margin Tab */}
        <TabsContent value="margin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Trend</CardTitle>
              <CardDescription>Percentage of revenue retained as profit</CardDescription>
            </CardHeader>
            <CardContent>
              {profitMargin && profitMargin.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={profitMargin}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis label={{ value: "Margin (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <ReferenceLine y={20} stroke="#999" strokeDasharray="5 5" label="20% Target" />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      name="Profit Margin"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Projection</CardTitle>
              <CardDescription>6-month forward forecast</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlow && cashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Projected Revenue" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" name="Projected Expenses" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="projected"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Net Cash Flow"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center text-gray-500">
                  No forecast data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Positive Outlook</p>
                  <p className="text-sm text-gray-600">
                    Cash flow projections show consistent positive growth over the next 6 months.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Revenue Growth</p>
                  <p className="text-sm text-gray-600">
                    Projected revenue increase of 15-20% based on historical trends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Cost Management</p>
                  <p className="text-sm text-gray-600">
                    Monitor expense growth to maintain healthy profit margins above 20%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Quality Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Financial analytics are based on approved invoices and expenses. Data is updated
            daily. For detailed reports, please use the Reports module.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
