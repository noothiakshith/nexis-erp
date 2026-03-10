import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

/**
 * Enhanced Dashboard with Real Data Integration
 * Displays live metrics, revenue trends, inventory levels, and KPIs
 */
export default function DashboardV2() {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">("month");

  // Fetch all dashboard metrics
  const { data: allMetrics, isLoading: metricsLoading } =
    trpc.metrics.getAllDashboardMetrics.useQuery();

  const { data: analyticsDashboard, isLoading: analyticsLoading } =
    trpc.metrics.getAnalyticsDashboard.useQuery();

  const isLoading = metricsLoading || analyticsLoading;

  // Calculate KPI changes (mock for now)
  const kpiChanges = useMemo(
    () => ({
      revenue: 12.5,
      expenses: -8.3,
      profit: 25.4,
      customers: 5.2,
    }),
    []
  );

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>{Icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last period
        </p>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business metrics and KPIs</p>
        </div>
        <div className="flex gap-2">
          {(["month", "quarter", "year"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeframe === tf
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Financial KPIs */}
      {allMetrics?.financial && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={`$${(allMetrics.financial.revenue / 1000).toFixed(1)}K`}
            change={kpiChanges.revenue}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Expenses"
            value={`$${(allMetrics.financial.expenses / 1000).toFixed(1)}K`}
            change={kpiChanges.expenses}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-red-500"
          />
          <StatCard
            title="Profit"
            value={`$${(allMetrics.financial.profit / 1000).toFixed(1)}K`}
            change={kpiChanges.profit}
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Profit Margin"
            value={`${allMetrics.financial.profitMargin.toFixed(1)}%`}
            change={2.3}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
        </div>
      )}

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Finance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue for the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsDashboard?.financial?.revenueByMonth ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsDashboard.financial.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsDashboard?.financial?.expenseBreakdown &&
                analyticsDashboard.financial.expenseBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsDashboard.financial.expenseBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analyticsDashboard.financial.expenseBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No expense data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Budget Utilization */}
          {allMetrics?.financial && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>Current budget spending vs allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Budget</span>
                      <span className="text-sm font-bold">
                        {allMetrics.financial.budgetUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(allMetrics.financial.budgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allMetrics?.inventory && (
              <>
                <StatCard
                  title="Total Products"
                  value={allMetrics.inventory.totalProducts}
                  change={2.1}
                  icon={<Package className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Low Stock Items"
                  value={allMetrics.inventory.lowStockCount}
                  change={-5.2}
                  icon={<AlertTriangle className="w-5 h-5 text-white" />}
                  color="bg-orange-500"
                />
                <StatCard
                  title="Reorder Alerts"
                  value={allMetrics.inventory.reorderAlerts}
                  change={3.1}
                  icon={<Clock className="w-5 h-5 text-white" />}
                  color="bg-red-500"
                />
              </>
            )}
          </div>

          {/* Stock Levels by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels by Category</CardTitle>
              <CardDescription>Inventory distribution across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsDashboard?.inventory?.stockByCategory &&
              analyticsDashboard.inventory.stockByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsDashboard.inventory.stockByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No inventory data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          {allMetrics?.inventory?.lowStockProducts &&
            allMetrics.inventory.lowStockProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Products</CardTitle>
                  <CardDescription>Products below reorder point</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allMetrics.inventory.lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            Stock: {product.currentStock} / Reorder: {product.reorderPoint}
                          </p>
                        </div>
                        <Badge variant="destructive">Low Stock</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allMetrics?.sales && (
              <>
                <StatCard
                  title="Total Customers"
                  value={allMetrics.sales.totalCustomers}
                  change={kpiChanges.customers}
                  icon={<Users className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Pipeline Value"
                  value={`$${(allMetrics.sales.pipelineValue / 1000).toFixed(1)}K`}
                  change={8.5}
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  color="bg-green-500"
                />
                <StatCard
                  title="Conversion Rate"
                  value={`${allMetrics.sales.conversionRate.toFixed(1)}%`}
                  change={1.2}
                  icon={<CheckCircle className="w-5 h-5 text-white" />}
                  color="bg-purple-500"
                />
              </>
            )}
          </div>

          {/* Sales Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Leads by stage</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsDashboard?.sales?.leadsByStage &&
              analyticsDashboard.sales.leadsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsDashboard.sales.leadsByStage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Lead Count" />
                    <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Pipeline Value" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No sales data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Tab */}
        <TabsContent value="hr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allMetrics?.hr && (
              <>
                <StatCard
                  title="Total Employees"
                  value={allMetrics.hr.totalEmployees}
                  change={1.5}
                  icon={<Users className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Monthly Payroll"
                  value={`$${(allMetrics.hr.monthlyPayroll / 1000).toFixed(1)}K`}
                  change={0.8}
                  icon={<DollarSign className="w-5 h-5 text-white" />}
                  color="bg-green-500"
                />
              </>
            )}
          </div>

          {/* Employees by Department */}
          <Card>
            <CardHeader>
              <CardTitle>Employees by Department</CardTitle>
              <CardDescription>Headcount distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsDashboard?.hr?.employeeByDepartment &&
              analyticsDashboard.hr.employeeByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsDashboard.hr.employeeByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No HR data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allMetrics?.projects && (
              <>
                <StatCard
                  title="Active Projects"
                  value={allMetrics.projects.activeProjects}
                  change={3.2}
                  icon={<ShoppingCart className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Project Budget"
                  value={`$${(allMetrics.projects.totalBudget / 1000).toFixed(1)}K`}
                  change={5.1}
                  icon={<DollarSign className="w-5 h-5 text-white" />}
                  color="bg-purple-500"
                />
              </>
            )}
            {allMetrics?.procurement && (
              <>
                <StatCard
                  title="Approved POs"
                  value={allMetrics.procurement.approvedOrders}
                  change={2.8}
                  icon={<CheckCircle className="w-5 h-5 text-white" />}
                  color="bg-green-500"
                />
                <StatCard
                  title="Pending Approvals"
                  value={allMetrics.procurement.pendingApprovals}
                  change={-1.5}
                  icon={<Clock className="w-5 h-5 text-white" />}
                  color="bg-orange-500"
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-sm text-gray-600 text-right">
        Last updated: {allMetrics?.lastUpdated ? new Date(allMetrics.lastUpdated).toLocaleTimeString() : "N/A"}
      </div>
    </div>
  );
}
