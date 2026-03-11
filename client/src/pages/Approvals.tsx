import React, { useState } from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ApprovalWorkflowStatus } from "@/components/ApprovalWorkflowStatus";
import { ApprovalAuditLog } from "@/components/ApprovalAuditLog";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  DollarSign, 
  Calendar,
  User,
  AlertCircle,
  Eye,
  TrendingUp,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface ApprovalItem {
  approvalId?: number;
  stepId: number;
  requestType?: string;
  requestId?: number;
  stepNumber: number;
  totalSteps?: number;
  createdAt?: Date;
}

export default function Approvals() {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Queries
  const { data: pendingApprovals, refetch: refetchPending } = trpc.approvals.getPendingApprovals.useQuery();
  const { data: approvalStats } = trpc.approvals.getApprovalStats.useQuery();
  const { data: approvalDetails } = trpc.approvals.getApprovalDetails.useQuery(
    { approvalId: selectedApproval?.approvalId || 0 },
    { enabled: !!selectedApproval }
  );

  // Mutations
  const approveStepMutation = trpc.approvals.approveStep.useMutation({
    onSuccess: () => {
      refetchPending();
      setShowApprovalDialog(false);
      setComments("");
      setSelectedApproval(null);
    },
  });

  const rejectApprovalMutation = trpc.approvals.rejectApproval.useMutation({
    onSuccess: () => {
      refetchPending();
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedApproval(null);
    },
  });

  const handleApprove = () => {
    if (!selectedApproval || !selectedApproval.approvalId) return;
    
    approveStepMutation.mutate({
      approvalId: selectedApproval.approvalId,
      stepId: selectedApproval.stepId,
      comments,
    });
  };

  const handleReject = () => {
    if (!selectedApproval || !selectedApproval.approvalId) return;
    
    rejectApprovalMutation.mutate({
      approvalId: selectedApproval.approvalId,
      stepId: selectedApproval.stepId,
      rejectionReason,
    });
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "purchase_order":
        return <DollarSign className="h-4 w-4" />;
      case "leave_request":
        return <Calendar className="h-4 w-4" />;
      case "expense_report":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "purchase_order":
        return "Purchase Order";
      case "leave_request":
        return "Leave Request";
      case "expense_report":
        return "Expense Report";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (type: string, daysOld: number) => {
    if (daysOld > 7) return "border-l-4 border-red-500";
    if (daysOld > 3) return "border-l-4 border-yellow-500";
    return "border-l-4 border-green-500";
  };

  const filteredApprovals = pendingApprovals?.filter(approval => 
    filterType === "all" || approval.requestType === filterType
  ) || [];

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Approval Dashboard</h1>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="leave_request">Leave Requests</option>
              <option value="expense_report">Expense Reports</option>
            </select>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalStats?.totalPending || 0}</div>
              <p className="text-xs text-slate-600">Require your action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Purchase Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalStats?.breakdown?.purchase_orders || 0}</div>
              <p className="text-xs text-slate-600">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalStats?.breakdown?.leave_requests || 0}</div>
              <p className="text-xs text-slate-600">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Expense Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalStats?.breakdown?.expense_reports || 0}</div>
              <p className="text-xs text-slate-600">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Approved Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalStats?.history || 0}</div>
              <p className="text-xs text-green-600">Great progress!</p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals ({filteredApprovals.length})</TabsTrigger>
            <TabsTrigger value="history">Approval History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Items Requiring Your Approval</CardTitle>
                <p className="text-sm text-gray-600">
                  Review and approve pending requests. Items are prioritized by age and importance.
                </p>
              </CardHeader>
              <CardContent>
                {!filteredApprovals.length ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No pending approvals. Great job staying on top of things!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApprovals.map((approval) => {
                      const daysOld = approval.createdAt ? Math.floor(
                        (Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                      ) : 0;
                      
                      return (
                        <div
                          key={`${approval.approvalId}-${approval.stepId}`}
                          className={`border rounded-lg p-4 hover:bg-slate-50 transition-colors ${getPriorityColor(approval.requestType || "", daysOld)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRequestTypeIcon(approval.requestType || "")}
                              <div>
                                <h3 className="font-medium">
                                  {getRequestTypeLabel(approval.requestType || "")} #{approval.requestId || "unknown"}
                                </h3>
                                <p className="text-sm text-slate-600">
                                  Step {approval.stepNumber} of {approval.totalSteps} • 
                                  Submitted {approval.createdAt ? format(new Date(approval.createdAt), "MMM d, yyyy") : "Unknown date"}
                                  {daysOld > 0 && (
                                    <span className={`ml-2 ${daysOld > 7 ? 'text-red-600' : daysOld > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      ({daysOld} day{daysOld !== 1 ? 's' : ''} old)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedApproval(approval)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Approval Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Approval history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Performance analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>Efficiency metrics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Approval Details Dialog */}
        {selectedApproval && (
          <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getRequestTypeIcon(selectedApproval.requestType || "")}
                  {getRequestTypeLabel(selectedApproval.requestType || "")} #{selectedApproval.requestId || "unknown"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Approval Workflow Status */}
                {approvalDetails && (
                  <ApprovalWorkflowStatus
                    approval={approvalDetails.approval}
                    steps={approvalDetails.steps}
                    showActions={true}
                    onApprove={() => setShowApprovalDialog(true)}
                    onReject={() => setShowRejectDialog(true)}
                  />
                )}

                {/* Audit Log */}
                {approvalDetails?.audit && (
                  <ApprovalAuditLog auditLog={approvalDetails.audit} />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments about this approval..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={approveStepMutation.isPending}>
                  {approveStepMutation.isPending ? "Approving..." : "Approve"}
                </Button>
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please provide a reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || rejectApprovalMutation.isPending}
                >
                  {rejectApprovalMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ERPDashboardLayout>
  );
}