import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
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

export default function DashboardV2() {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">("month");

  // Fetch approval metrics
  const { data: approvalStats } = trpc.approvals.getApprovalStats.useQuery();
  const { data: pendingApprovals } = trpc.approvals.getPendingApprovals.useQuery();

  // Fetch all dashboard metrics
  const { data: allMetrics, isLoading: metricsLoading } =
    trpc.metrics.getAllDashboardMetrics.useQuery();

  const { data: analyticsDashboard, isLoading: analyticsLoading } =
    trpc.metrics.getAnalyticsDashboard.useQuery();

  const isLoading = metricsLoading || analyticsLoading;

  // Calculate KPI changes (relative comparison)
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
    <Card className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</CardTitle>
          <div className={`p-2 rounded-xl ${color} shadow-lg transition-transform group-hover:scale-110`}>{Icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-3xl font-extrabold text-slate-900">{value}</div>
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium">vs last {timeframe}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <ERPDashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      </ERPDashboardLayout>
    );
  }

  return (
    <ERPDashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-150">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Executive Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Real-time business performance & insights</p>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 self-start">
            {(["month", "quarter", "year"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeframe === tf
                  ? "bg-white text-blue-600 shadow-md transform scale-105"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Financial KPIs */}
        {allMetrics?.financial && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Revenue"
              value={`$${(allMetrics.financial.revenue / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`}
              change={kpiChanges.revenue}
              icon={<DollarSign className="w-5 h-5 text-white" />}
              color="bg-indigo-600"
            />
            <StatCard
              title="Expenses"
              value={`$${(allMetrics.financial.expenses / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`}
              change={kpiChanges.expenses}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="bg-rose-500"
            />
            <StatCard
              title="Profit"
              value={`$${(allMetrics.financial.profit / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`}
              change={kpiChanges.profit}
              icon={<CheckCircle className="w-5 h-5 text-white" />}
              color="bg-emerald-500"
            />
            <StatCard
              title="Profit Margin"
              value={`${(allMetrics.financial.profitMargin || 0).toFixed(1)}%`}
              change={2.3}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="bg-amber-500"
            />
          </div>
        )}

        <Tabs defaultValue="financial" className="w-full space-y-6">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full max-w-2xl border border-slate-200">
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="financial">Finance</TabsTrigger>
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="inventory">Inventory</TabsTrigger>
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="sales">Sales</TabsTrigger>
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="hr">HR</TabsTrigger>
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="approvals">Approvals</TabsTrigger>
            <TabsTrigger className="rounded-xl font-bold py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm" value="operations">Operations</TabsTrigger>
          </TabsList>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <CardDescription>Monthly growth over the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsDashboard?.financial?.revenueByMonth ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsDashboard.financial.revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4f46e5"
                          strokeWidth={4}
                          dot={{ fill: "#4f46e5", r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                  <CardDescription>Spending distribution by category</CardDescription>
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
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          label
                        >
                          {analyticsDashboard.financial.expenseBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
                      No expense data
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allMetrics?.inventory && (
                <>
                  <StatCard
                    title="Total SKU"
                    value={allMetrics.inventory.totalProducts}
                    change={2.1}
                    icon={<Package className="w-5 h-5 text-white" />}
                    color="bg-blue-600"
                  />
                  <StatCard
                    title="Low Stock"
                    value={allMetrics.inventory.lowStockCount}
                    change={-5.2}
                    icon={<AlertTriangle className="w-5 h-5 text-white" />}
                    color="bg-amber-500"
                  />
                  <StatCard
                    title="Alerts"
                    value={allMetrics.inventory.reorderAlerts}
                    change={3.1}
                    icon={<Clock className="w-5 h-5 text-white" />}
                    color="bg-rose-500"
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allMetrics?.sales && (
                <>
                  <StatCard
                    title="Deals"
                    value={allMetrics.sales.totalCustomers}
                    change={8.4}
                    icon={<Users className="w-5 h-5 text-white" />}
                    color="bg-indigo-600"
                  />
                  <StatCard
                    title="Pipeline"
                    value={`$${(allMetrics.sales.pipelineValue / 1000).toFixed(1)}K`}
                    change={12.2}
                    icon={<ShoppingCart className="w-5 h-5 text-white" />}
                    color="bg-emerald-600"
                  />
                  <StatCard
                    title="Win Rate"
                    value={`${(allMetrics.sales.conversionRate || 0).toFixed(1)}%`}
                    change={1.5}
                    icon={<TrendingUp className="w-5 h-5 text-white" />}
                    color="bg-blue-600"
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* HR Tab */}
          <TabsContent value="hr" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allMetrics?.hr && (
                <>
                  <StatCard
                    title="Personnel"
                    value={allMetrics.hr.totalEmployees}
                    change={1.2}
                    icon={<Users className="w-5 h-5 text-white" />}
                    color="bg-slate-700"
                  />
                  <StatCard
                    title="Attendance"
                    value="94.2%"
                    change={-0.3}
                    icon={<Clock className="w-5 h-5 text-white" />}
                    color="bg-orange-500"
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Awaiting Action"
                value={approvalStats?.totalPending || 0}
                change={0}
                icon={<AlertTriangle className="w-5 h-5 text-white" />}
                color="bg-amber-500"
              />
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Approved Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{approvalStats?.history || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle>Recent Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pendingApprovals && pendingApprovals.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {pendingApprovals.slice(0, 5).map((app) => (
                      <div key={app.stepId} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 capitalize">{app.requestType?.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-400">Request #{app.requestId} • Step {app.stepNumber}</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">Pending</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p>All clear! No pending approvals.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ERPDashboardLayout>
  );
}
