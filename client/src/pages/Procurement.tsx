import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CreatePOModal } from "@/components/Procurement/CreatePOModal";
import { Badge } from "@/components/ui/badge";

export default function Procurement() {
  const [isPOModalOpen, setIsPOModalOpen] = React.useState(false);

  // Real data fetching
  const { data: pos, refetch } = trpc.procurement.listAll.useQuery();

  const pendingCount = pos?.filter((p: any) => p.status === "pending_approval" || p.status === "draft").length || 0;
  const totalSpent = pos?.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || "0"), 0) || 0;

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Procurement
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage purchase orders and suppliers</p>
          </div>
          <Button
            onClick={() => setIsPOModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-all active:scale-95"
          >
            New PO
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total POs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{pos?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wider">Pending/Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pos && pos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">PO Number</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4 text-right">Order Date</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pos.map((po: any) => (
                      <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {po.poNumber}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          Supplier #{po.supplierId}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs text-right">
                          {new Date(po.orderDate!).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ${parseFloat(po.totalAmount || "0").toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={`${po.status === "draft" ? "bg-slate-100 text-slate-600" :
                            po.status === "pending_approval" ? "bg-orange-100 text-orange-700" :
                              po.status === "approved" ? "bg-green-100 text-green-700" :
                                "bg-blue-100 text-blue-700"
                            } border-none`}>
                            {po.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p>No purchase orders found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CreatePOModal
          open={isPOModalOpen}
          onOpenChange={setIsPOModalOpen}
          onSuccess={refetch}
        />
      </div>
    </ERPDashboardLayout>
  );
}
