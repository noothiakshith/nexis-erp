import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  Edit, 
  Trash2, 
  Download,
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  FileText,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

interface ExpenseManagementProps {
  onSubmitExpense?: () => void;
}

export function ExpenseManagement({ onSubmitExpense }: ExpenseManagementProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);

  const { data: expenses, refetch } = trpc.finance.getExpenses.useQuery();

  const filteredExpenses = (expenses || []).filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set((expenses || []).map(exp => exp.category)));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': 
      case 'paid': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'submitted': return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': 
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'submitted': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'travel': return '✈️';
      case 'meals': return '🍽️';
      case 'office supplies': return '📎';
      case 'software': return '💻';
      case 'marketing': return '📢';
      case 'training': return '📚';
      default: return '📄';
    }
  };

  // Calculate metrics
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
  const approvedAmount = filteredExpenses.filter(exp => exp.status === 'approved' || exp.status === 'paid')
    .reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
  const pendingAmount = filteredExpenses.filter(exp => exp.status === 'submitted')
    .reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
  const rejectedAmount = filteredExpenses.filter(exp => exp.status === 'rejected')
    .reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);

  // Category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryExpenses = filteredExpenses.filter(exp => exp.category === category);
    const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
    return { category, total: categoryTotal, count: categoryExpenses.length };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
          <p className="text-slate-500 text-sm">Track and manage all expense reports and reimbursements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={onSubmitExpense}>
            <Plus className="w-4 h-4" />
            Submit Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} reports</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Approved</p>
                <h3 className="text-2xl font-bold text-emerald-700">${approvedAmount.toLocaleString()}</h3>
                <p className="text-xs text-emerald-600 mt-1">
                  {filteredExpenses.filter(exp => exp.status === 'approved' || exp.status === 'paid').length} reports
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-amber-700">${pendingAmount.toLocaleString()}</h3>
                <p className="text-xs text-amber-600 mt-1">
                  {filteredExpenses.filter(exp => exp.status === 'submitted').length} reports
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Rejected</p>
                <h3 className="text-2xl font-bold text-red-700">${rejectedAmount.toLocaleString()}</h3>
                <p className="text-xs text-red-600 mt-1">
                  {filteredExpenses.filter(exp => exp.status === 'rejected').length} reports
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 6).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCategoryIcon(cat.category)}</span>
                    <div>
                      <p className="font-medium text-slate-900">{cat.category}</p>
                      <p className="text-xs text-slate-500">{cat.count} expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${cat.total.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">
                      {totalAmount > 0 ? ((cat.total / totalAmount) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(expense.status)}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                      <p className="text-xs text-slate-500">
                        {expense.category} • {format(new Date(expense.expenseDate!), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${parseFloat(expense.amount!).toLocaleString()}</p>
                    <Badge className={`text-xs ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expense Reports ({filteredExpenses.length})</CardTitle>
            {selectedExpenses.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Approve Selected ({selectedExpenses.length})
                </Button>
                <Button size="sm" variant="outline">
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExpenses(filteredExpenses.map(exp => exp.id));
                        } else {
                          setSelectedExpenses([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300"
                        checked={selectedExpenses.includes(expense.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses([...selectedExpenses, expense.id]);
                          } else {
                            setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(expense.status)}
                        <div>
                          <p className="font-semibold text-slate-900">{expense.description}</p>
                          {expense.notes && (
                            <p className="text-xs text-slate-500 mt-1">{expense.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                        <span className="font-medium text-slate-700">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-900">
                        ${parseFloat(expense.amount!).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-700">
                        {format(new Date(expense.expenseDate!), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {expense.status === 'draft' && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {expense.status === 'submitted' && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center">
              <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? 'No expenses found' : 'No expenses yet'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Submit your first expense report to get started.'
                }
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit First Expense
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}