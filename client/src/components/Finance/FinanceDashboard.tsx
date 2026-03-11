import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

export function FinanceDashboard() {
  const { data: invoices } = trpc.finance.getInvoices.useQuery();
  const { data: expenses } = trpc.finance.getExpenses.useQuery();

  // Calculate key financial metrics
  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Invoice metrics
  const paidInvoices = invoices?.filter(inv => inv.status === "paid") || [];
  const pendingInvoices = invoices?.filter(inv => inv.status === "sent" || inv.status === "draft") || [];
  const overdueInvoices = invoices?.filter(inv => 
    (inv.status === "sent" || inv.status === "draft") && 
    new Date(inv.dueDate!) < new Date()
  ) || [];

  const paidAmount = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

  // Expense metrics
  const approvedExpenses = expenses?.filter(exp => exp.status === "approved" || exp.status === "paid") || [];
  const pendingExpenseAmount = expenses?.filter(exp => exp.status === "submitted")
    .reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0) || 0;

  // Cash flow trend (mock data - in real app would be calculated from historical data)
  const cashFlowTrend = [
    { month: "Jan", income: 45000, expenses: 32000 },
    { month: "Feb", income: 52000, expenses: 35000 },
    { month: "Mar", income: 48000, expenses: 38000 },
    { month: "Apr", income: 61000, expenses: 42000 },
    { month: "May", income: 55000, expenses: 39000 },
    { month: "Jun", income: 58000, expenses: 41000 },
  ];

  const currentMonth = cashFlowTrend[cashFlowTrend.length - 1];
  const previousMonth = cashFlowTrend[cashFlowTrend.length - 2];
  const monthlyGrowth = previousMonth ? 
    ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-900">
                  ${totalRevenue.toLocaleString()}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  {monthlyGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Math.abs(monthlyGrowth).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl text-emerald-700">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-red-900">
                  ${totalExpenses.toLocaleString()}
                </h3>
                <p className="text-xs text-red-600 mt-2">
                  {approvedExpenses.length} approved items
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-xl text-red-700">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Net Profit</p>
                <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  ${netProfit.toLocaleString()}
                </h3>
                <p className="text-xs text-blue-600 mt-2">
                  {profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Pending Payments</p>
                <h3 className="text-2xl font-bold text-amber-900">
                  ${pendingAmount.toLocaleString()}
                </h3>
                <p className="text-xs text-amber-600 mt-2">
                  {pendingInvoices.length} invoices
                </p>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Overview */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Paid</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-700">${paidAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{paidInvoices.length} invoices</p>
                </div>
              </div>
              <Progress value={totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">Pending</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-amber-700">${pendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{pendingInvoices.length} invoices</p>
                </div>
              </div>
              <Progress value={totalRevenue > 0 ? (pendingAmount / totalRevenue) * 100 : 0} className="h-2" />
            </div>

            {overdueAmount > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-slate-700">Overdue</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-700">${overdueAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{overdueInvoices.length} invoices</p>
                  </div>
                </div>
                <Progress value={totalRevenue > 0 ? (overdueAmount / totalRevenue) * 100 : 0} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Trend */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Cash Flow Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cashFlowTrend.slice(-3).map((month, index) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{month.month}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        Net: ${(month.income - month.expenses).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Income:</span>
                      <span className="font-medium">${month.income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Expenses:</span>
                      <span className="font-medium">${month.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress 
                    value={(month.income / Math.max(...cashFlowTrend.map(m => m.income))) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Recent Invoices */}
              {invoices?.slice(0, 3).map((invoice) => (
                <div key={`invoice-${invoice.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(invoice.issueDate!), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${parseFloat(invoice.totalAmount!).toLocaleString()}</p>
                    <Badge 
                      className={`text-xs ${
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Recent Expenses */}
              {expenses?.slice(0, 2).map((expense) => (
                <div key={`expense-${expense.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                      <p className="text-xs text-slate-500">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${parseFloat(expense.amount!).toLocaleString()}</p>
                    <Badge 
                      className={`text-xs ${
                        expense.status === 'approved' || expense.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Alerts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Financial Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Overdue Invoices</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {overdueInvoices.length} invoices totaling ${overdueAmount.toLocaleString()} are overdue
                  </p>
                </div>
              )}

              {pendingExpenseAmount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Pending Approvals</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    ${pendingExpenseAmount.toLocaleString()} in expenses awaiting approval
                  </p>
                </div>
              )}

              {profitMargin < 10 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Low Profit Margin</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Current profit margin is {profitMargin.toFixed(1)}%. Consider reviewing expenses.
                  </p>
                </div>
              )}

              {overdueInvoices.length === 0 && pendingExpenseAmount === 0 && profitMargin >= 10 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">All Good!</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    No critical financial issues detected. Keep up the good work!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}