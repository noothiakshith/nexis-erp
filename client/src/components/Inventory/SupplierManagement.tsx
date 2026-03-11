import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Clock
} from "lucide-react";

export function SupplierManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  const { data: suppliers, refetch } = trpc.suppliers.list.useQuery();

  const filteredSuppliers = (suppliers || []).filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPerformanceScore = (supplier: any) => {
    // Mock performance calculation - in real app would be based on actual data
    const rating = parseFloat(supplier.rating || "4.0");
    const onTimeDelivery = 0.95; // 95%
    const qualityScore = 0.98; // 98%
    
    return ((rating / 5) * 0.4 + onTimeDelivery * 0.35 + qualityScore * 0.25) * 100;
  };

  const getSupplierStats = (supplierId: number) => {
    // Mock stats - in real app would query actual data
    return {
      totalOrders: Math.floor(Math.random() * 50) + 10,
      totalValue: Math.floor(Math.random() * 500000) + 50000,
      avgDeliveryTime: Math.floor(Math.random() * 10) + 3,
      lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      productsSupplied: Math.floor(Math.random() * 20) + 5,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Supplier Management</h2>
          <p className="text-slate-500 text-sm">Manage vendor relationships and performance</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier: any) => {
          const performanceScore = getPerformanceScore(supplier);
          const stats = getSupplierStats(supplier.id);
          
          return (
            <Card 
              key={supplier.id} 
              className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                selectedSupplier === supplier.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedSupplier(selectedSupplier === supplier.id ? null : supplier.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                      {supplier.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {supplier.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span className="text-sm font-medium text-slate-700">
                            {Number(supplier.rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                      <Badge 
                        className={`text-xs ${
                          performanceScore >= 90 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : performanceScore >= 75 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {performanceScore.toFixed(0)}% Performance
                      </Badge>
                    </div>
                  </div>
                  <Badge 
                    className={supplier.isActive 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                    }
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{supplier.city}, {supplier.country}</span>
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Package className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Products</span>
                    </div>
                    <p className="font-semibold text-slate-900">{stats.productsSupplied}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Total Value</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${(stats.totalValue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Avg Delivery</span>
                    </div>
                    <p className="font-semibold text-slate-900">{stats.avgDeliveryTime} days</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Last Order</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {stats.lastOrderDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSupplier === supplier.id && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Total Orders:</span>
                        <span className="font-medium text-slate-900 ml-2">{stats.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Terms:</span>
                        <span className="font-medium text-slate-900 ml-2">
                          {supplier.paymentTerms || 'Net 30'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Create PO
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm 
                ? `No suppliers match "${searchTerm}". Try a different search term.`
                : 'Add your first supplier to start managing your supply chain.'
              }
            </p>
            {!searchTerm && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Supplier
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}