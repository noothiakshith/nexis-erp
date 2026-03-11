import React, { useState } from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreateInvoiceModal } from "@/components/Finance/CreateInvoiceModal";
import { CreateExpenseModal } from "@/components/Finance/CreateExpenseModal";
import { FinanceDashboard } from "@/components/Finance/FinanceDashboard";
import { InvoiceManagement } from "@/components/Finance/InvoiceManagement";
import { ExpenseManagement } from "@/components/Finance/ExpenseManagement";
import { BudgetManagement } from "@/components/Finance/BudgetManagement";
import { FinancialReports } from "@/components/Finance/FinancialReports";
import { PaymentTracking } from "@/components/Finance/PaymentTracking";
import { AIFinancialIntelligence } from "@/components/Finance/AIFinancialIntelligence";
import { RealTimeCollaboration } from "@/components/Finance/RealTimeCollaboration";
import { AdvancedFinancialAutomation } from "@/components/Finance/AdvancedFinancialAutomation";
import { FinancialScenarioPlanning } from "@/components/Finance/FinancialScenarioPlanning";
import { AdvancedFinancialAnalytics } from "@/components/Finance/AdvancedFinancialAnalytics";
import { FinancialRiskManagement } from "@/components/Finance/FinancialRiskManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  CreditCard, 
  BarChart3, 
  Receipt, 
  Target, 
  TrendingUp, 
  DollarSign,
  Calculator,
  Brain,
  Users,
  Bot,
  LineChart,
  Award,
  Shield
} from "lucide-react";

export default function Finance() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch real data to replace placeholders
  const { data: invoices, refetch: refetchInvoices } = trpc.finance.getInvoices.useQuery();
  const { data: expenses, refetch: refetchExpenses } = trpc.finance.getExpenses.useQuery();

  const handleInvoiceSuccess = () => {
    refetchInvoices();
  };

  const handleExpenseSuccess = () => {
    refetchExpenses();
  };

  return (
    <ERPDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              Finance Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Comprehensive financial oversight and management tools</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsExpenseModalOpen(true)}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50 text-blue-700 shadow-sm transition-transform active:scale-95 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Submit Expense
            </Button>
            <Button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              New Invoice
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/50 border border-slate-200 p-1 rounded-xl shadow-sm inline-flex h-auto w-full overflow-x-auto justify-start">
            <TabsTrigger value="dashboard" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CreditCard className="w-4 h-4" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="budgets" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Target className="w-4 h-4" /> Budgets
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <DollarSign className="w-4 h-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="ai-intelligence" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Brain className="w-4 h-4" /> AI Intelligence
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="w-4 h-4" /> Collaboration
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Bot className="w-4 h-4" /> Automation
            </TabsTrigger>
            <TabsTrigger value="scenario-planning" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <LineChart className="w-4 h-4" /> Scenarios
            </TabsTrigger>
            <TabsTrigger value="advanced-analytics" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Award className="w-4 h-4" /> Analytics+
            </TabsTrigger>
            <TabsTrigger value="risk-management" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4" /> Risk Mgmt
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6 focus:outline-none focus:ring-0 mt-0">
            <FinanceDashboard />
          </TabsContent>

          {/* INVOICES TAB */}
          <TabsContent value="invoices" className="mt-0 focus:outline-none focus:ring-0">
            <InvoiceManagement onCreateInvoice={() => setIsInvoiceModalOpen(true)} />
          </TabsContent>

          {/* EXPENSES TAB */}
          <TabsContent value="expenses" className="mt-0 focus:outline-none focus:ring-0">
            <ExpenseManagement onSubmitExpense={() => setIsExpenseModalOpen(true)} />
          </TabsContent>

          {/* BUDGETS TAB */}
          <TabsContent value="budgets" className="mt-0 focus:outline-none focus:ring-0">
            <BudgetManagement onCreateBudget={() => toast.info("Budget creation coming soon!")} />
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="mt-0 focus:outline-none focus:ring-0">
            <FinancialReports />
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="mt-0 focus:outline-none focus:ring-0">
            <PaymentTracking />
          </TabsContent>

          {/* AI INTELLIGENCE TAB */}
          <TabsContent value="ai-intelligence" className="mt-0 focus:outline-none focus:ring-0">
            <AIFinancialIntelligence />
          </TabsContent>

          {/* COLLABORATION TAB */}
          <TabsContent value="collaboration" className="mt-0 focus:outline-none focus:ring-0">
            <RealTimeCollaboration />
          </TabsContent>

          {/* AUTOMATION TAB */}
          <TabsContent value="automation" className="mt-0 focus:outline-none focus:ring-0">
            <AdvancedFinancialAutomation />
          </TabsContent>

          {/* SCENARIO PLANNING TAB */}
          <TabsContent value="scenario-planning" className="mt-0 focus:outline-none focus:ring-0">
            <FinancialScenarioPlanning />
          </TabsContent>

          {/* ADVANCED ANALYTICS TAB */}
          <TabsContent value="advanced-analytics" className="mt-0 focus:outline-none focus:ring-0">
            <AdvancedFinancialAnalytics />
          </TabsContent>

          {/* RISK MANAGEMENT TAB */}
          <TabsContent value="risk-management" className="mt-0 focus:outline-none focus:ring-0">
            <FinancialRiskManagement />
          </TabsContent>
        </Tabs>

        <CreateInvoiceModal
          open={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
          onSuccess={handleInvoiceSuccess}
        />

        <CreateExpenseModal
          open={isExpenseModalOpen}
          onOpenChange={setIsExpenseModalOpen}
          onSuccess={handleExpenseSuccess}
        />
      </div>
    </ERPDashboardLayout>
  );
}
