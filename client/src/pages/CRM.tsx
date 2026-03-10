import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CreateCustomerModal } from "@/components/CRM/CreateCustomerModal";
import { Badge } from "@/components/ui/badge";

export default function CRM() {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);

  // Real data fetching
  const { data: customersResult, refetch } = trpc.crm.getCustomers.useQuery();
  const customers = customersResult || [];

  const leadCount = customers.filter(c => (c as any).type === "lead").length;
  const customerCount = customers.filter(c => (c as any).type === "customer").length;

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Customer Relationship
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage leads, customers and sales pipeline</p>
          </div>
          <Button
            onClick={() => setIsCustomerModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform active:scale-95"
          >
            New Lead/Customer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{customers.length}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Active Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{leadCount}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{customerCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {customer.company || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {customer.type === "customer" ? (
                            <Badge className="bg-green-100 text-green-700 border-none">Customer</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">Lead</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p>No contacts found. Add your first lead!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateCustomerModal
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          onSuccess={refetch}
        />
      </div>
    </ERPDashboardLayout>
  );
}
