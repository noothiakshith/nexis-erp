import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Eye,
  Share
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedReport, setSelectedReport] = useState("profit-loss");

  const { data: invoices } = trpc.finance.getInvoices.useQuery();
  const { data: expenses } = trpc.finance.getExpenses.useQuery();

  // Calculate date ranges
  const getCurrentPeriodDates = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "current-month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last-month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "current-quarter":
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        return { start: quarterStart, end: quarterEnd };
      case "current-year":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start: periodStart, end: periodEnd } = getCurrentPeriodDates();

  // Filter data by period
  const periodInvoices = (invoices || []).filter(inv => {
    const invoiceDate = new Date(inv.issueDate!);
    return invoiceDate >= periodStart && invoiceDate <= periodEnd;
  });

  const periodExpenses = (expenses || []).filter(exp => {
    const expenseDate = new Date(exp.expenseDate!);
    return expenseDate >= periodStart && expenseDate <= periodEnd;
  });

  // Calculate financial metrics
  const totalRevenue = periodInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const totalExpenses = periodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
  const netIncome = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  // Previous period comparison
  const prevPeriodStart = subMonths(periodStart, 1);
  const prevPeriodEnd = subMonths(periodEnd, 1);
  
  const prevPeriodInvoices = (invoices || []).filter(inv => {
    const invoiceDate = new Date(inv.issueDate!);
    return invoiceDate >= prevPeriodStart && invoiceDate <= prevPeriodEnd;
  });

  const prevRevenue = prevPeriodInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  // Expense categories breakdown
  const expenseCategories = Array.from(new Set(periodExpenses.map(exp => exp.category)));
  const categoryBreakdown = expenseCategories.map(category => {
    const categoryExpenses = periodExpenses.filter(exp => exp.category === category);
    const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
    return {
      category,
      amount: categoryTotal,
      percentage: totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0,
      count: categoryExpenses.length
    };
  }).sort((a, b) => b.amount - a.amount);

  // Cash flow analysis
  const monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    
    const monthInvoices = (invoices || []).filter(inv => {
      const invoiceDate = new Date(inv.issueDate!);
      return invoiceDate >= monthStart && invoiceDate <= monthEnd;
    });
    
    const monthExpenses = (expenses || []).filter(exp => {
      const expenseDate = new Date(exp.expenseDate!);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);

    monthlyData.push({
      month: format(monthStart, 'MMM yyyy'),
      revenue: monthRevenue,
      expenses: monthExpenseTotal,
      netIncome: monthRevenue - monthExpenseTotal
    });
  }

  const reportTypes = [
    { value: "profit-loss", label: "Profit & Loss Statement", icon: TrendingUp },
    { value: "balance-sheet", label: "Balance Sheet", icon: BarChart3 },
    { value: "cash-flow", label: "Cash Flow Statement", icon: Activity },
    { value: "expense-report", label: "Expense Analysis", icon: PieChart },
    { value: "revenue-report", label: "Revenue Analysis", icon: DollarSign }
  ];

  const renderProfitLossReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-700">${totalRevenue.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {revenueGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Math.abs(revenueGrowth).toFixed(1)}% vs prev period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-red-700">${totalExpenses.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-2">{periodExpenses.length} transactions</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Net Income</p>
                <h3 className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${netIncome.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  {grossMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className={`p-3 rounded-xl ${netIncome >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {netIncome >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Gross Margin</p>
                <h3 className={`text-2xl font-bold ${grossMargin >= 20 ? 'text-emerald-700' : grossMargin >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
                  {grossMargin.toFixed(1)}%
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  {grossMargin >= 20 ? 'Excellent' : grossMargin >= 10 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <p className="text-sm text-slate-500">
            {format(periodStart, 'MMM d, yyyy')} - {format(periodEnd, 'MMM d, yyyy')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-4">
              <h4 className="font-semibold text-slate-900 mb-3">Revenue</h4>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Total Revenue</span>
                <span className="font-semibold text-emerald-700">${totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-b border-slate-200 pb-4">
              <h4 className="font-semibold text-slate-900 mb-3">Expenses</h4>
              <div className="space-y-2">
                {categoryBreakdown.map(category => (
                  <div key={category.category} className="flex justify-between items-center">
                    <span className="text-slate-700">{category.category}</span>
                    <span className="font-medium text-red-700">${category.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-900">Total Expenses</span>
                  <span className="font-semibold text-red-700">${totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Net Income</span>
                <span className={`text-lg font-bold ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${netIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashFlowReport = () => (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Cash Flow Analysis (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={month.month} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-900">{month.month}</h4>
                  <Badge className={`${month.netIncome >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    Net: ${month.netIncome.toLocaleString()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue:</span>
                    <span className="font-medium text-emerald-700">${month.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expenses:</span>
                    <span className="font-medium text-red-700">${month.expenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpenseReport = () => (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Expense Analysis by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((category) => (
              <div key={category.category} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{category.category}</h4>
                    <p className="text-xs text-slate-500">{category.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${category.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{category.percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case "profit-loss":
        return renderProfitLossReport();
      case "cash-flow":
        return renderCashFlowReport();
      case "expense-report":
        return renderExpenseReport();
      case "balance-sheet":
        return (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Balance Sheet</h3>
              <p className="text-slate-500">Balance sheet reporting coming soon.</p>
            </CardContent>
          </Card>
        );
      case "revenue-report":
        return (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Revenue Analysis</h3>
              <p className="text-slate-500">Detailed revenue analysis coming soon.</p>
            </CardContent>
          </Card>
        );
      default:
        return renderProfitLossReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-slate-500 text-sm">Generate comprehensive financial statements and analysis</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Share className="w-4 h-4" />
            Share Report
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.value}
                  onClick={() => setSelectedReport(report.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedReport === report.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${
                    selectedReport === report.value ? 'text-blue-600' : 'text-slate-600'
                  }`} />
                  <h3 className={`font-semibold text-sm ${
                    selectedReport === report.value ? 'text-blue-900' : 'text-slate-900'
                  }`}>
                    {report.label}
                  </h3>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
}