import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit, 
  Trash2, 
  Send, 
  Download,
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface InvoiceManagementProps {
  onCreateInvoice?: () => void;
}

export function InvoiceManagement({ onCreateInvoice }: InvoiceManagementProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  const { data: invoices, refetch } = trpc.finance.getInvoices.useQuery();

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isOverdue = (invoice: any) => {
    return (invoice.status === 'sent' || invoice.status === 'draft') && 
           new Date(invoice.dueDate!) < new Date();
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invoice Management</h2>
          <p className="text-slate-500 text-sm">Create, edit, and track all your invoices</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={onCreateInvoice}>
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Invoices</p>
                <h3 className="text-2xl font-bold text-slate-900">{filteredInvoices.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Amount</p>
                <h3 className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Paid</p>
                <h3 className="text-2xl font-bold text-emerald-700">${paidAmount.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-amber-700">${pendingAmount.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
            {selectedInvoices.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Send Selected ({selectedInvoices.length})
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            )}
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
                          setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Due Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const overdue = isOverdue(invoice);
                  const displayStatus = overdue ? 'overdue' : invoice.status;
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices([...selectedInvoices, invoice.id]);
                            } else {
                              setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(displayStatus)}
                          <div>
                            <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(invoice.issueDate!), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">Customer Name</p>
                          <p className="text-xs text-slate-500">{invoice.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-slate-900">
                            ${parseFloat(invoice.totalAmount!).toLocaleString()}
                          </span>
                          {invoice.tax && parseFloat(invoice.tax) > 0 && (
                            <span className="text-xs text-slate-500">
                              +${parseFloat(invoice.tax).toLocaleString()} tax
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getStatusColor(displayStatus)}>
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                            {format(new Date(invoice.dueDate!), 'MMM d, yyyy')}
                          </span>
                          {overdue && (
                            <span className="text-xs text-red-500">
                              {Math.ceil((new Date().getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <Send className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredInvoices.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm || statusFilter !== "all" ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first invoice to get started with billing.'
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateInvoice}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Invoice
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}