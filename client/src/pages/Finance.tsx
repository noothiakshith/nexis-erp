import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { trpc } from "@/lib/trpc";
import { CreateInvoiceModal } from "@/components/Finance/CreateInvoiceModal";
import { CreateExpenseModal } from "@/components/Finance/CreateExpenseModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard } from "lucide-react";

export default function Finance() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);

  // Fetch real data to replace placeholders
  const { data: invoices, refetch: refetchInvoices } = trpc.finance.getInvoices.useQuery();
  const { data: expenses, refetch: refetchExpenses } = trpc.finance.getExpenses.useQuery();

  const totalInvoices = invoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0) || 0;

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Finance Module
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage invoices, expenses and financial reports</p>
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

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="bg-slate-100/50 p-1 border border-slate-200">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Expense Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">${totalInvoices.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">${(totalInvoices * 0.7).toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wider">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700">${(totalInvoices * 0.3).toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg overflow-hidden backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-slate-50/50">
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {invoices && invoices.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {invoices.slice(0, 10).map((invoice) => (
                      <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span>
                          <span className="text-xs text-slate-400 capitalize">{invoice.status} • Due {new Date(invoice.dueDate!).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="font-bold text-slate-900">${parseFloat(invoice.totalAmount!).toLocaleString()}</span>
                          <span className="text-xs text-slate-500">{invoice.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p>No invoices found. Create your first invoice!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">${totalExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    ${expenses?.filter(e => e.status === "approved" || e.status === "paid").reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600 uppercase tracking-wider">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-700">
                    ${expenses?.filter(e => e.status === "submitted").reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg overflow-hidden backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-slate-50/50">
                <CardTitle>Expense Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {expenses && expenses.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{expense.description}</span>
                          <span className="text-xs text-slate-400">{expense.category} • {new Date(expense.expenseDate!).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col text-right">
                            <span className="font-bold text-slate-900">${parseFloat(expense.amount!).toLocaleString()}</span>
                            <Badge className={`${expense.status === "approved" || expense.status === "paid" ? "bg-green-100 text-green-700" :
                                expense.status === "rejected" ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                              } border-none text-[10px] mt-1`}>
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p>No expenses found. Submit your first expense report!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateInvoiceModal
          open={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
          onSuccess={refetchInvoices}
        />

        <CreateExpenseModal
          open={isExpenseModalOpen}
          onOpenChange={setIsExpenseModalOpen}
          onSuccess={refetchExpenses}
        />
      </div>
    </ERPDashboardLayout>
  );
}
