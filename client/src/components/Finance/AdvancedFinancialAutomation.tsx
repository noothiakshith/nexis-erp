import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Bot, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  FileText,
  CreditCard,
  Target,
  Workflow,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Calendar,
  DollarSign,
  Lightbulb
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'invoice_generation' | 'expense_approval' | 'budget_reallocation' | 'payment_scheduling';
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  action: string;
  frequency: string;
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
  savings: number;
}

interface AutomationMetrics {
  totalRules: number;
  activeRules: number;
  timeSaved: number;
  costSaved: number;
  accuracy: number;
  processedThisMonth: number;
}

export function AdvancedFinancialAutomation() {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  // Mock automation rules
  const automationRules: AutomationRule[] = [
    {
      id: "rule-1",
      name: "Smart Invoice Generation",
      description: "Automatically generate invoices for recurring clients based on contract terms and delivery confirmations",
      type: "invoice_generation",
      status: "active",
      trigger: "Contract milestone completion + delivery confirmation",
      action: "Generate invoice with dynamic pricing and send to client",
      frequency: "Real-time",
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      successRate: 98.5,
      savings: 15000
    },
    {
      id: "rule-2", 
      name: "Intelligent Expense Pre-Approval",
      description: "Pre-approve expenses based on employee role, budget availability, and spending patterns using ML models",
      type: "expense_approval",
      status: "active",
      trigger: "Expense submission + ML risk assessment",
      action: "Auto-approve low-risk expenses, flag high-risk for review",
      frequency: "Real-time",
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
      nextRun: new Date(),
      successRate: 94.2,
      savings: 8500
    },
    {
      id: "rule-3",
      name: "Dynamic Budget Reallocation",
      description: "Automatically reallocate unused budget from underperforming departments to high-ROI initiatives",
      type: "budget_reallocation",
      status: "active", 
      trigger: "Monthly budget variance analysis + ROI scoring",
      action: "Propose and execute budget transfers with approval workflow",
      frequency: "Monthly",
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      successRate: 87.3,
      savings: 25000
    },
    {
      id: "rule-4",
      name: "Smart Payment Scheduling",
      description: "Optimize payment timing to maximize cash flow while maintaining vendor relationships and early payment discounts",
      type: "payment_scheduling",
      status: "paused",
      trigger: "Invoice due date - cash flow optimization algorithm",
      action: "Schedule payments for optimal cash flow and discount capture",
      frequency: "Daily",
      lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      successRate: 91.7,
      savings: 12000
    }
  ];

  const metrics: AutomationMetrics = {
    totalRules: automationRules.length,
    activeRules: automationRules.filter(r => r.status === 'active').length,
    timeSaved: 156, // hours per month
    costSaved: 60500, // dollars per month
    accuracy: 92.8, // percentage
    processedThisMonth: 1247 // transactions
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice_generation': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'expense_approval': return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'budget_reallocation': return <Target className="w-5 h-5 text-purple-600" />;
      case 'payment_scheduling': return <Calendar className="w-5 h-5 text-amber-600" />;
      default: return <Bot className="w-5 h-5 text-slate-600" />;
    }
  };

  const toggleRuleStatus = (ruleId: string) => {
    // In real implementation, would update via API
    console.log("Toggling rule status:", ruleId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Bot className="w-7 h-7 text-blue-600" />
            Advanced Financial Automation
          </h2>
          <p className="text-slate-500 text-sm">Intelligent automation rules for financial processes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Rules
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Rules</p>
                <h3 className="text-2xl font-bold text-blue-900">{metrics.activeRules}/{metrics.totalRules}</h3>
                <p className="text-xs text-blue-600 mt-1">Automation coverage</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                <Workflow className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Time Saved</p>
                <h3 className="text-2xl font-bold text-emerald-900">{metrics.timeSaved}h</h3>
                <p className="text-xs text-emerald-600 mt-1">Per month</p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl text-emerald-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Cost Savings</p>
                <h3 className="text-2xl font-bold text-purple-900">${(metrics.costSaved / 1000).toFixed(0)}K</h3>
                <p className="text-xs text-purple-600 mt-1">Per month</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl text-purple-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Accuracy</p>
                <h3 className="text-2xl font-bold text-amber-900">{metrics.accuracy}%</h3>
                <p className="text-xs text-amber-600 mt-1">Success rate</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl text-amber-700">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div 
                key={rule.id} 
                className={`p-6 border rounded-lg transition-all cursor-pointer ${
                  selectedRule === rule.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      {getTypeIcon(rule.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-lg">{rule.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge className={getStatusColor(rule.status)}>
                          {rule.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Success Rate: {rule.successRate}%
                        </span>
                        <span className="text-xs text-emerald-600 font-medium">
                          Saved: ${rule.savings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={rule.status === 'active'} 
                      onCheckedChange={() => toggleRuleStatus(rule.id)}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 px-2">
                        {rule.status === 'active' ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {selectedRule === rule.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-slate-800 mb-3">Rule Configuration</h5>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Trigger Condition</p>
                            <p className="text-sm text-slate-600">{rule.trigger}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Automated Action</p>
                            <p className="text-sm text-slate-600">{rule.action}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Execution Frequency</p>
                            <p className="text-sm text-slate-600">{rule.frequency}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-800 mb-3">Performance Metrics</h5>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-slate-600">Success Rate</span>
                              <span className="text-sm font-medium">{rule.successRate}%</span>
                            </div>
                            <Progress value={rule.successRate} className="h-2" />
                          </div>
                          {rule.lastRun && (
                            <div>
                              <p className="text-sm font-medium text-slate-700">Last Execution</p>
                              <p className="text-sm text-slate-600">
                                {rule.lastRun.toLocaleDateString()} at {rule.lastRun.toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                          {rule.nextRun && (
                            <div>
                              <p className="text-sm font-medium text-slate-700">Next Scheduled Run</p>
                              <p className="text-sm text-slate-600">
                                {rule.nextRun.toLocaleDateString()} at {rule.nextRun.toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Rule
                      </Button>
                      <Button size="sm" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Run Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Automation Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-blue-700" />
                </div>
                <h4 className="font-semibold text-blue-900">Late Payment Alerts</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Automatically send payment reminders and escalate overdue invoices
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Rule
              </Button>
            </div>

            <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <h4 className="font-semibold text-emerald-900">Expense Categorization</h4>
              </div>
              <p className="text-sm text-emerald-700 mb-3">
                Auto-categorize expenses using ML and historical patterns
              </p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Create Rule
              </Button>
            </div>

            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <h4 className="font-semibold text-purple-900">Budget Variance Alerts</h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Monitor budget performance and alert on significant variances
              </p>
              <Button size="sm" className="bg-purple-600 hover:purple-blue-700 text-white">
                Create Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}