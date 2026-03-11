import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Zap,
  TrendingUp,
  Package,
  ShoppingCart,
  Bell,
  Target
} from "lucide-react";

interface ReorderRule {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplierId?: number;
  supplierName?: string;
  isAutoEnabled: boolean;
  lastTriggered?: Date;
  status: 'active' | 'triggered' | 'pending' | 'completed';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function AutomatedReorderSystem() {
  const [globalAutoReorder, setGlobalAutoReorder] = useState(true);
  const [selectedRules, setSelectedRules] = useState<number[]>([]);

  const { data: alerts } = trpc.inventoryAnalytics.reorderAlerts.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  // Transform alerts into reorder rules
  const reorderRules: ReorderRule[] = (alerts || []).map((alert: any) => ({
    id: alert.id,
    productId: alert.id,
    productName: alert.name,
    productSku: alert.sku,
    currentStock: alert.currentStock,
    reorderPoint: alert.reorderPoint,
    reorderQuantity: alert.reorderQuantity,
    supplierId: alert.supplierId,
    supplierName: suppliers?.find(s => s.id === alert.supplierId)?.name,
    isAutoEnabled: true,
    status: alert.currentStock === 0 ? 'triggered' : alert.currentStock <= alert.reorderPoint * 0.5 ? 'pending' : 'active',
    urgencyLevel: alert.currentStock === 0 ? 'critical' : 
                  alert.currentStock <= alert.reorderPoint * 0.3 ? 'high' :
                  alert.currentStock <= alert.reorderPoint * 0.7 ? 'medium' : 'low',
  }));

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'triggered': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <Target className="w-4 h-4 text-blue-600" />;
    }
  };

  const criticalRules = reorderRules.filter(rule => rule.urgencyLevel === 'critical');
  const highPriorityRules = reorderRules.filter(rule => rule.urgencyLevel === 'high');
  const activeRules = reorderRules.filter(rule => rule.isAutoEnabled);

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Rules</p>
                <h3 className="text-2xl font-bold text-blue-900">{activeRules.length}</h3>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl text-blue-700">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Critical Items</p>
                <h3 className="text-2xl font-bold text-red-900">{criticalRules.length}</h3>
              </div>
              <div className="p-3 bg-red-200 rounded-xl text-red-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">High Priority</p>
                <h3 className="text-2xl font-bold text-amber-900">{highPriorityRules.length}</h3>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl text-amber-700">
                <Bell className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Automation Rate</p>
                <h3 className="text-2xl font-bold text-emerald-900">
                  {reorderRules.length > 0 ? Math.round((activeRules.length / reorderRules.length) * 100) : 0}%
                </h3>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Controls */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Automated Reorder System
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Configure automatic purchase order generation based on stock levels
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Global Auto-Reorder</span>
              <Switch
                checked={globalAutoReorder}
                onCheckedChange={setGlobalAutoReorder}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">System Status</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${globalAutoReorder ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-sm text-slate-600">
                  {globalAutoReorder ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">Next Check</h4>
              <p className="text-sm text-slate-600">In 2 hours</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">Last Run</h4>
              <p className="text-sm text-slate-600">15 minutes ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reorder Rules */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Reorder Rules & Alerts</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure Rules
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Bulk Create POs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRules(reorderRules.map(r => r.id));
                        } else {
                          setSelectedRules([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Stock Status</th>
                  <th className="px-6 py-4 text-center">Urgency</th>
                  <th className="px-6 py-4 text-center">Supplier</th>
                  <th className="px-6 py-4 text-center">Auto-Reorder</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reorderRules.map((rule) => {
                  const stockPercentage = (rule.currentStock / rule.reorderPoint) * 100;
                  
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300"
                          checked={selectedRules.includes(rule.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRules([...selectedRules, rule.id]);
                            } else {
                              setSelectedRules(selectedRules.filter(id => id !== rule.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(rule.status)}
                          <div>
                            <p className="font-semibold text-slate-900">{rule.productName}</p>
                            <p className="text-xs text-slate-500 font-mono">{rule.productSku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Badge variant="outline" className="font-mono">
                              {rule.currentStock} / {rule.reorderPoint}
                            </Badge>
                          </div>
                          <Progress 
                            value={Math.min(stockPercentage, 100)} 
                            className="h-2 w-20 mx-auto"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getUrgencyColor(rule.urgencyLevel)}>
                          {rule.urgencyLevel.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm">
                          {rule.supplierName ? (
                            <span className="text-slate-900 font-medium">{rule.supplierName}</span>
                          ) : (
                            <span className="text-slate-400">No supplier</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch
                          checked={rule.isAutoEnabled && globalAutoReorder}
                          disabled={!globalAutoReorder}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Create PO
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Edit Rule
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {reorderRules.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reorder Rules</h3>
              <p className="text-slate-500">
                All products are currently above their reorder points.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}