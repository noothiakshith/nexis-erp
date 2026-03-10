import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

/**
 * Approvals Dashboard - Multi-step approval workflow management
 * Displays pending approvals, approval history, and workflow status
 */
export default function Approvals() {
  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: loadingPending } =
    trpc.approvals.getPendingApprovals.useQuery();

  // Fetch approval stats
  const { data: stats } = trpc.approvals.getApprovalStats.useQuery();

  // Fetch approval details
  const { data: approvalDetails } = trpc.approvals.getApprovalDetails.useQuery(
    { approvalId: selectedApproval || 0 },
    { enabled: !!selectedApproval }
  );

  // Mutations
  const approveMutation = trpc.approvals.approveStep.useMutation({
    onSuccess: () => {
      toast.success("Step approved successfully");
      setComments("");
      setSelectedApproval(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const rejectMutation = trpc.approvals.rejectApproval.useMutation({
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectionReason("");
      setSelectedApproval(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase_order: "Purchase Order",
      leave_request: "Leave Request",
      expense_report: "Expense Report",
    };
    return labels[type] || type;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Approval Workflows</h1>
        <p className="text-gray-600 mt-2">
          Manage multi-step approvals for purchase orders, leave requests, and expense reports
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-gray-600">Awaiting your action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.breakdown.purchase_orders}</div>
              <p className="text-xs text-gray-600">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.breakdown.leave_requests}</div>
              <p className="text-xs text-gray-600">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expense Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.breakdown.expense_reports}</div>
              <p className="text-xs text-gray-600">Pending approval</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">Approval History</TabsTrigger>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">Loading approvals...</p>
              </CardContent>
            </Card>
          ) : pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.stepId} className="cursor-pointer hover:shadow-md transition">
                  <CardHeader
                    onClick={() => setSelectedApproval(approval.approvalId || 0)}
                    className="pb-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {getRequestTypeLabel(approval.requestType || "")}
                          </CardTitle>
                          <Badge className={getStatusColor("pending")}>
                            {getStatusIcon("pending")}
                            <span className="ml-1">Pending</span>
                          </Badge>
                        </div>
                        <CardDescription>
                          Request #{approval.requestId} • Step {approval.stepNumber} of{" "}
                          {approval.totalSteps}
                        </CardDescription>
                      </div>
                      <div className="text-sm text-gray-600">
                        {approval.createdAt &&
                          new Date(approval.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>

                  {selectedApproval === approval.approvalId && approvalDetails && (
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Approval Steps</h4>
                        <div className="space-y-2">
                          {approvalDetails.steps.map((step) => (
                            <div
                              key={step.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                Step {step.stepNumber}: {step.approverRole}
                              </span>
                              <Badge
                                variant={
                                  step.status === "approved"
                                    ? "default"
                                    : step.status === "rejected"
                                      ? "destructive"
                                      : "outline"
                                }
                              >
                                {step.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          placeholder="Add comments (optional)"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              approveMutation.mutate({
                                approvalId: approval.approvalId || 0,
                                stepId: approval.stepId || 0,
                                comments: comments || undefined,
                              });
                            }}
                            disabled={approveMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {approveMutation.isPending ? "Approving..." : "Approve"}
                          </Button>

                          <Button
                            onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason) {
                                rejectMutation.mutate({
                                  approvalId: approval.approvalId || 0,
                                  stepId: approval.stepId || 0,
                                  rejectionReason: reason,
                                });
                              }
                            }}
                            disabled={rejectMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">No pending approvals</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approval History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>View completed and rejected approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Approval history will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Monitor all active approval workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Active workflows will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
