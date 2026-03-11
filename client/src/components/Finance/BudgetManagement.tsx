import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface Budget {
  id: number;
  department: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  fiscalYear: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetManagementProps {
  onCreateBudget?: () => void;
}

export function BudgetManagement({ onCreateBudget }: BudgetManagementProps = {}) {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Mock budget data - in real app would come from tRPC
  const budgets: Budget[] = [
    {
      id: 1,
      department: "Marketing",
      category: "Digital Advertising",
      budgetAmount: 50000,
      spentAmount: 32000,
      fiscalYear: 2024,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      department: "IT",
      category: "Software Licenses",
      budgetAmount: 25000,
      spentAmount: 18500,
      fiscalYear: 2024,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      department: "HR",
      category: "Training & Development",
      budgetAmount: 15000,
      spentAmount: 8200,
      fiscalYear: 2024,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      department: "Operations",
      category: "Office Supplies",
      budgetAmount: 12000,
      spentAmount: 13500,
      fiscalYear: 2024,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 5,
      department: "Sales",
      category: "Travel & Entertainment",
      budgetAmount: 30000,
      spentAmount: 22000,
      fiscalYear: 2024,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const filteredBudgets = budgets.filter(budget => {
    const matchesYear = budget.fiscalYear.toString() === selectedYear;
    const matchesDepartment = selectedDepartment === "all" || budget.department === selectedDepartment;
    return matchesYear && matchesDepartment;
  });

  const departments = Array.from(new Set(budgets.map(b => b.department)));

  const getUtilizationStatus = (budget: Budget) => {
    const percentage = (budget.spentAmount / budget.budgetAmount) * 100;
    if (percentage > 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage > 90) return { status: 'warning', color: 'text-amber-600', bgColor: 'bg-amber-100' };
    if (percentage > 75) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { status: 'low', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'closed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Calculate totals
  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = filteredBudgets.filter(b => b.spentAmount > b.budgetAmount).length;

  // Department breakdown
  const departmentBreakdown = departments.map(dept => {
    const deptBudgets = filteredBudgets.filter(b => b.department === dept);
    const deptTotal = deptBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const deptSpent = deptBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
    return {
      department: dept,
      budgetAmount: deptTotal,
      spentAmount: deptSpent,
      utilization: deptTotal > 0 ? (deptSpent / deptTotal) * 100 : 0,
      count: deptBudgets.length
    };
  }).sort((a, b) => b.budgetAmount - a.budgetAmount);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Budget Management</h2>
          <p className="text-slate-500 text-sm">Plan, track, and manage organizational budgets</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">FY 2024</SelectItem>
              <SelectItem value="2023">FY 2023</SelectItem>
              <SelectItem value="2025">FY 2025</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={onCreateBudget}>
            <Plus className="w-4 h-4" />
            New Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Budget</p>
                <h3 className="text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">{filteredBudgets.length} budgets</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Spent</p>
                <h3 className="text-2xl font-bold text-slate-900">${totalSpent.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% utilized
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Remaining</p>
                <h3 className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${Math.abs(totalRemaining).toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {totalRemaining >= 0 ? 'Available' : 'Over budget'}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${totalRemaining >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {totalRemaining >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Over Budget</p>
                <h3 className="text-2xl font-bold text-red-700">{overBudgetCount}</h3>
                <p className="text-xs text-red-600 mt-1">
                  {filteredBudgets.length > 0 ? ((overBudgetCount / filteredBudgets.length) * 100).toFixed(0) : 0}% of budgets
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Department Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentBreakdown.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{dept.department}</p>
                      <p className="text-xs text-slate-500">{dept.count} budgets</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ${dept.spentAmount.toLocaleString()} / ${dept.budgetAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{dept.utilization.toFixed(1)}% used</p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(dept.utilization, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Budget Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredBudgets
                .filter(budget => {
                  const utilization = (budget.spentAmount / budget.budgetAmount) * 100;
                  return utilization > 90 || budget.spentAmount > budget.budgetAmount;
                })
                .slice(0, 5)
                .map((budget) => {
                  const utilization = (budget.spentAmount / budget.budgetAmount) * 100;
                  const isOverBudget = budget.spentAmount > budget.budgetAmount;
                  
                  return (
                    <div key={budget.id} className={`p-3 rounded-lg border ${
                      isOverBudget ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-4 h-4 ${isOverBudget ? 'text-red-600' : 'text-amber-600'}`} />
                        <span className={`font-medium text-sm ${isOverBudget ? 'text-red-800' : 'text-amber-800'}`}>
                          {budget.department} - {budget.category}
                        </span>
                      </div>
                      <p className={`text-sm ${isOverBudget ? 'text-red-700' : 'text-amber-700'}`}>
                        {isOverBudget 
                          ? `Over budget by $${(budget.spentAmount - budget.budgetAmount).toLocaleString()}`
                          : `${utilization.toFixed(1)}% utilized - approaching limit`
                        }
                      </p>
                    </div>
                  );
                })}
              
              {filteredBudgets.filter(b => (b.spentAmount / b.budgetAmount) * 100 > 90).length === 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800 text-sm">All budgets healthy</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    No budgets are currently over or near their limits.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Budget Details ({filteredBudgets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Department & Category</th>
                  <th className="px-6 py-4 text-right">Budget Amount</th>
                  <th className="px-6 py-4 text-right">Spent Amount</th>
                  <th className="px-6 py-4 text-center">Utilization</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBudgets.map((budget) => {
                  const utilization = (budget.spentAmount / budget.budgetAmount) * 100;
                  const utilizationStatus = getUtilizationStatus(budget);
                  
                  return (
                    <tr key={budget.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{budget.department}</p>
                          <p className="text-sm text-slate-500">{budget.category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-slate-900">
                          ${budget.budgetAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${utilizationStatus.color}`}>
                          ${budget.spentAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Badge className={utilizationStatus.bgColor + ' ' + utilizationStatus.color}>
                              {utilization.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className="h-2 w-20 mx-auto"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getBudgetStatusColor(budget.status)}>
                          {budget.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredBudgets.length === 0 && (
            <div className="py-12 text-center">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No budgets found</h3>
              <p className="text-slate-500 mb-4">
                Create your first budget to start tracking departmental spending.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Budget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}