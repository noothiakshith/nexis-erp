import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CreateCustomerModal } from "@/components/CRM/CreateCustomerModal";
import { SalesPipeline } from "@/components/CRM/SalesPipeline";
import { SalesAnalytics } from "@/components/CRM/SalesAnalytics";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Eye } from "lucide-react";

export default function CRM() {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);
  const [, setLocation] = useLocation();

  // Real data fetching
  const { data: customersResult, refetch } = trpc.crm.getCustomers.useQuery();
  const customers = customersResult || [];
  const { data: leadsResult } = trpc.crm.getLeads.useQuery();
  const leads = leadsResult || [];

  const leadCount = leads.length;
  const customerCount = customers.length;

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{customers.length + leads.length}</div>
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
              <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{customerCount}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 uppercase tracking-wider">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {leads.length > 0 ? Math.round((leads.filter((l: any) => l.status === "won").length / leads.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CRM Tabs */}
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="contacts">All Contacts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <SalesPipeline />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle>All Contacts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(customers.length > 0 || leads.length > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4 text-center">Type</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Render Leads */}
                        {leads.map((lead: any) => (
                          <tr key={`lead-${lead.id}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {lead.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {lead.company || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {lead.email}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">
                                Lead
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className={
                                lead.status === "won" ? "bg-green-100 text-green-700" :
                                lead.status === "lost" ? "bg-red-100 text-red-700" :
                                lead.status === "proposal" ? "bg-orange-100 text-orange-700" :
                                lead.status === "qualified" ? "bg-purple-100 text-purple-700" :
                                lead.status === "contacted" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              }>
                                {lead.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/crm/leads/${lead.id}`)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {/* Render Customers */}
                        {customers.map((customer: any) => (
                          <tr key={`customer-${customer.id}`} className="hover:bg-slate-50/50 transition-colors">
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
                              <Badge className="bg-green-100 text-green-700 border-none">
                                Customer
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className={
                                customer.status === "active" ? "bg-green-100 text-green-700" :
                                customer.status === "inactive" ? "bg-gray-100 text-gray-700" :
                                "bg-yellow-100 text-yellow-700"
                              }>
                                {customer.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/crm/customers/${customer.id}`)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p>No contacts found. Add your first lead or customer!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Sales reports and custom analytics coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateCustomerModal
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          onSuccess={refetch}
        />
      </div>
    </ERPDashboardLayout>
  );
}
