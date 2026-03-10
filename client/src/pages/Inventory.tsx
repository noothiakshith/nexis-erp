import React, { useState } from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CreateProductModal } from "@/components/Inventory/CreateProductModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, TrendingUp, Warehouse, Truck, History, Plus, ArrowUpRight, ArrowDownRight, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function Inventory() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: analytics } = trpc.inventoryAnalytics.overview.useQuery();
  const { data: products, refetch: refetchProducts } = trpc.inventory.getProducts.useQuery();
  const { data: alerts } = trpc.inventoryAnalytics.reorderAlerts.useQuery();
  const { data: warehouses } = trpc.warehouse.list.useQuery();
  const { data: movements } = trpc.stockMovements.list.useQuery({ limit: 100 });
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const handleProductSuccess = () => {
    refetchProducts();
  };

  return (
    <ERPDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Inventory & Supply Chain
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage products, stock levels, warehouses, and suppliers</p>
          </div>
          <Button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/50 border border-slate-200 p-1 rounded-xl shadow-sm inline-flex h-auto w-full overflow-x-auto justify-start">
            <TabsTrigger value="overview" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="w-4 h-4" /> Products & Stock
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
              <AlertTriangle className="w-4 h-4" /> Reorder Alerts
              {alerts && alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Warehouse className="w-4 h-4" /> Warehouses
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Truck className="w-4 h-4" /> Suppliers
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="w-4 h-4" /> Movements
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 focus:outline-none focus:ring-0 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Total Products</p>
                      <h3 className="text-3xl font-bold text-slate-900">{analytics?.totalProducts || 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Total Value</p>
                      <h3 className="text-3xl font-bold text-slate-900">
                        ${(analytics?.totalValue || 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white ring-1 ring-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-amber-600 mb-1">Low Stock Items</p>
                      <h3 className="text-3xl font-bold text-amber-700">{analytics?.lowStockCount || 0}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white ring-1 ring-red-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Out of Stock</p>
                      <h3 className="text-3xl font-bold text-red-700">{analytics?.outOfStockCount || 0}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.categoryBreakdown?.map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                        <div>
                          <p className="font-semibold text-slate-800">{cat.category}</p>
                          <p className="text-xs text-slate-500">{cat.count} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">${cat.value.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Total Value</p>
                        </div>
                      </div>
                    ))}
                    {(!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0) && (
                      <p className="text-slate-500 text-sm py-4 text-center">No category data available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="mt-0 focus:outline-none focus:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Product Directory</CardTitle>
                <CardDescription>All tracked items across the supply chain.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Stock Level</th>
                        <th className="px-6 py-4 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(products || []).map((product: any) => {
                        const isLowStock = product.currentStock <= product.reorderPoint;
                        const isOutOfStock = product.currentStock === 0;
                        return (
                          <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">{product.name}</span>
                                <span className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="bg-slate-50 font-normal">
                                {product.category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-semibold text-sm ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-slate-800"}`}>
                                  {product.currentStock}
                                </span>
                                <span className="text-[10px] text-slate-400">Min: {product.reorderPoint}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-slate-700">
                                ${parseFloat(product.unitPrice).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isOutOfStock ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 text-xs px-2 shadow-none inline-flex items-center gap-1">
                                  Out of Stock
                                </Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 text-xs px-2 shadow-none inline-flex items-center gap-1">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 text-xs px-2 shadow-none inline-flex items-center gap-1">
                                  Healthy
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(!products || products.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No products found. Add a product to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="mt-0 focus:outline-none focus:ring-0">
            <Card className="border-red-200 shadow-sm ring-1 ring-red-100">
              <CardHeader className="bg-red-50/50 rounded-t-xl border-b border-red-100">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Action Required: Reorder Alerts
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  Products that have fallen below their minimum safety thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4 text-right">Current Stock</th>
                        <th className="px-6 py-4 text-right">Reorder Point</th>
                        <th className="px-6 py-4 text-right">Suggested Qty</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(alerts || []).map((alert: any) => (
                        <tr key={alert.id} className="hover:bg-red-50/30">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{alert.name}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{alert.sku}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                              {alert.currentStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-600">
                            {alert.reorderPoint}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-800">
                            {alert.reorderQuantity}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" className="border-slate-300">
                              Create PO
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!alerts || alerts.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No reorder alerts at this time. All stock levels are healthy! 🎉
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WAREHOUSE TAB */}
          <TabsContent value="warehouse" className="mt-0 focus:outline-none focus:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Warehouse Locations</CardTitle>
                <CardDescription>Track inventory distribution across facilities.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider rounded-t-lg">
                      <tr>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4 text-right">Quantity</th>
                        <th className="px-6 py-4 text-right">Last Counted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(warehouses || []).map((wh: any, i) => (
                        <tr key={wh.id || i} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-800">{wh.warehouseLocation}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-900">{wh.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{wh.productSku}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="secondary" className="font-mono text-sm">
                              {wh.quantity}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-500">
                            {wh.lastCountDate ? format(new Date(wh.lastCountDate), 'MMM d, yyyy') : 'Never'}
                          </td>
                        </tr>
                      ))}
                      {(!warehouses || warehouses.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                            No warehouse data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPLIERS TAB */}
          <TabsContent value="suppliers" className="mt-0 focus:outline-none focus:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Supplier Directory</CardTitle>
                  <CardDescription>Manage your vendors and supply chain partners.</CardDescription>
                </div>
                {/* Placeholder for Add Supplier button if we want to expand */}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4 text-center">Rating</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(suppliers || []).map((supplier: any) => (
                        <tr key={supplier.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {supplier.name}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">{supplier.email || '—'}</p>
                            <p className="text-xs text-slate-500">{supplier.phone || '—'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {supplier.city ? `${supplier.city}, ${supplier.country}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {supplier.rating ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                ★ {Number(supplier.rating).toFixed(1)}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {supplier.isActive ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!suppliers || suppliers.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No suppliers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MOVEMENTS TAB */}
          <TabsContent value="movements" className="mt-0 focus:outline-none focus:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>Historical log of inventory coming in and out.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4 text-center">Type</th>
                        <th className="px-6 py-4 text-right">Quantity</th>
                        <th className="px-6 py-4">Reference / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(movements || []).map((mov: any, idx) => (
                        <tr key={mov.id || idx} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {format(new Date(mov.createdAt), "MMM d, yyyy HH:mm")}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">{mov.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{mov.productSku}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {mov.movementType === 'in' && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                                <ArrowDownRight className="w-3 h-3 mr-1" /> In
                              </Badge>
                            )}
                            {mov.movementType === 'out' && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> Out
                              </Badge>
                            )}
                            {mov.movementType === 'adjustment' && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">
                                Adj
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-mono text-sm font-bold ${mov.movementType === 'in' ? 'text-emerald-600' :
                                mov.movementType === 'out' ? 'text-blue-600' : 'text-amber-600'
                              }`}>
                              {mov.movementType === 'in' ? '+' : mov.movementType === 'out' ? '-' : ''}{mov.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {mov.reference && <p className="text-xs font-semibold text-slate-700">Ref: {mov.reference}</p>}
                            {mov.notes && <p className="text-xs text-slate-500 mt-0.5">{mov.notes}</p>}
                            {!mov.reference && !mov.notes && <span className="text-slate-400 text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                      {(!movements || movements.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No stock movement history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateProductModal
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          onSuccess={handleProductSuccess}
        />
      </div>
    </ERPDashboardLayout>
  );
}
