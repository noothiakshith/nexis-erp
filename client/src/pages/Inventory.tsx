import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CreateProductModal } from "@/components/Inventory/CreateProductModal";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);

  // Real data fetching
  const { data: productsResult, refetch } = trpc.inventory.getProducts.useQuery();
  const products = (productsResult || []) as any[];

  const lowStockCount = products.filter((p: any) => (p.currentStock || 0) <= (p.reorderPoint || 0)).length;
  const totalValue = products.reduce((sum: number, p: any) => sum + (parseFloat(p.unitPrice || "0") * (p.currentStock || 0)), 0);

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Inventory Module
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage products, stock levels and reorder rules</p>
          </div>
          <Button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-transform active:scale-95"
          >
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-white to-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 uppercase tracking-wider">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{lowStockCount}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg overflow-hidden backdrop-blur-sm bg-white/80">
          <CardHeader className="bg-slate-50/50">
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Stock</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-400">{product.sku}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-medium ${(product.currentStock || 0) <= (product.reorderPoint || 0)
                              ? "text-red-600"
                              : "text-slate-900"
                            }`}>
                            {product.currentStock} / {product.reorderPoint}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-900">${parseFloat(product.unitPrice!).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(product.currentStock || 0) <= (product.reorderPoint || 0) ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-none">Healthy</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p>No products found in inventory.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateProductModal
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          onSuccess={refetch}
        />
      </div>
    </ERPDashboardLayout>
  );
}
