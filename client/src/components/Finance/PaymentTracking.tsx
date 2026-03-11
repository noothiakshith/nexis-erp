import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Receipt,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface PaymentTrackingProps {
  onRecordPayment?: () => void;
}

export function PaymentTracking({ onRecordPayment }: PaymentTrackingProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: payments = [], refetch: refetchPayments } = trpc.finance.getPayments.useQuery();
  const reconcilePayment = trpc.finance.reconcilePayment.useMutation({
    onSuccess: () => {
      toast.success("Payment reconciled successfully!");
      refetchPayments();
    },
    onError: (error) => {
      toast.error(`Failed to reconcile: ${error.message}`);
    },
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || payment.type === typeFilter;
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesType && matchesStatus && matchesMethod;
  });

  const getPaymentIcon = (type: string) => {
    return type === 'incoming' ? 
      <ArrowDownRight className="w-4 h-4 text-emerald-600" /> : 
      <ArrowUpRight className="w-4 h-4 text-blue-600" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-slate-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return '🏦';
      case 'credit_card': return '💳';
      case 'cash': return '💵';
      case 'check': return '📝';
      case 'online': return '🌐';
      default: return '💰';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'credit_card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'check': return 'Check';
      case 'online': return 'Online Payment';
      default: return method;
    }
  };

  // Calculate metrics
  const totalIncoming = filteredPayments
    .filter(p => p.type === 'incoming' && p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
  
  const totalOutgoing = filteredPayments
    .filter(p => p.type === 'outgoing' && p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
  
  const pendingIncoming = filteredPayments
    .filter(p => p.type === 'incoming' && p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
  
  const pendingOutgoing = filteredPayments
    .filter(p => p.type === 'outgoing' && p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);

  const unreconciledCount = filteredPayments.filter(p => !p.reconciled && p.status === 'completed').length;

  const handleReconcile = (paymentId: number, reference: string) => {
    reconcilePayment.mutate({ paymentId });
  };

  const handlePaymentSuccess = () => {
    refetchPayments();
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Tracking</h2>
          <p className="text-slate-500 text-sm">Monitor and reconcile all incoming and outgoing payments</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => toast.info("Bulk reconciliation coming soon!")}
          >
            <Receipt className="w-4 h-4" />
            Reconcile
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Incoming Payments</p>
                <h3 className="text-2xl font-bold text-emerald-700">${totalIncoming.toLocaleString()}</h3>
                <p className="text-xs text-emerald-600 mt-1">
                  {filteredPayments.filter(p => p.type === 'incoming' && p.status === 'completed').length} completed
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Outgoing Payments</p>
                <h3 className="text-2xl font-bold text-blue-700">${totalOutgoing.toLocaleString()}</h3>
                <p className="text-xs text-blue-600 mt-1">
                  {filteredPayments.filter(p => p.type === 'outgoing' && p.status === 'completed').length} completed
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Pending Payments</p>
                <h3 className="text-2xl font-bold text-amber-700">
                  ${(pendingIncoming + pendingOutgoing).toLocaleString()}
                </h3>
                <p className="text-xs text-amber-600 mt-1">
                  {filteredPayments.filter(p => p.status === 'pending').length} pending
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Unreconciled</p>
                <h3 className="text-2xl font-bold text-red-700">{unreconciledCount}</h3>
                <p className="text-xs text-red-600 mt-1">Need reconciliation</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['bank_transfer', 'credit_card', 'online', 'check', 'cash'].map(method => {
                const methodPayments = filteredPayments.filter(p => p.method === method && p.status === 'completed');
                const methodTotal = methodPayments.reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
                const percentage = totalIncoming + totalOutgoing > 0 ? 
                  (methodTotal / (totalIncoming + totalOutgoing)) * 100 : 0;

                return (
                  <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getMethodIcon(method)}</span>
                      <div>
                        <p className="font-medium text-slate-900">{getMethodLabel(method)}</p>
                        <p className="text-xs text-slate-500">{methodPayments.length} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${methodTotal.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(payment.type)}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{payment.reference}</p>
                      <p className="text-xs text-slate-500">
                        {getMethodLabel(payment.method)} • {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${payment.type === 'incoming' ? 'text-emerald-700' : 'text-blue-700'}`}>
                      {payment.type === 'incoming' ? '+' : '-'}${parseFloat(payment.amount?.toString() || "0").toLocaleString()}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Method</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Reconciled</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-semibold text-slate-900">{payment.reference}</p>
                          <p className="text-xs text-slate-500">{payment.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(payment.type)}
                        <Badge className={`${
                          payment.type === 'incoming' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {payment.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${
                        payment.type === 'incoming' ? 'text-emerald-700' : 'text-blue-700'
                      }`}>
                        {payment.type === 'incoming' ? '+' : '-'}${parseFloat(payment.amount?.toString() || "0").toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">{getMethodIcon(payment.method)}</span>
                        <span className="text-sm text-slate-700">{getMethodLabel(payment.method)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-700">
                        {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {payment.reconciled ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => toast.info(`Viewing payment ${payment.reference}`)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {!payment.reconciled && payment.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs"
                            onClick={() => handleReconcile(payment.id, payment.reference)}
                            disabled={reconcilePayment.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Reconcile
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <Banknote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No payments found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all" || methodFilter !== "all"
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Record your first payment to start tracking transactions.'
                }
              </p>
              {!searchTerm && typeFilter === "all" && statusFilter === "all" && methodFilter === "all" && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Payment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}