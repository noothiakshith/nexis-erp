import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Calendar,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface ApprovalStep {
  id: number;
  stepNumber: number;
  approverRole: string;
  assignedTo?: number | null;
  status: "pending" | "approved" | "rejected";
  comments?: string | null;
  approvedAt?: Date | null;
}

interface ApprovalWorkflowStatusProps {
  approval: {
    id: number;
    requestType: string;
    requestId: number;
    status: "pending" | "approved" | "rejected" | "cancelled";
    currentStep: number;
    totalSteps: number;
    createdAt: Date;
    completedAt?: Date | null;
    rejectionReason?: string | null;
  };
  steps: ApprovalStep[];
  showActions?: boolean;
  onApprove?: (stepId: number) => void;
  onReject?: (stepId: number) => void;
}

export function ApprovalWorkflowStatus({
  approval,
  steps,
  showActions = false,
  onApprove,
  onReject,
}: ApprovalWorkflowStatusProps) {
  const getStepIcon = (step: ApprovalStep) => {
    switch (step.status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return step.stepNumber === approval.currentStep ? (
          <Clock className="h-5 w-5 text-yellow-500" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        );
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepStatus = (step: ApprovalStep) => {
    switch (step.status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
        return step.stepNumber === approval.currentStep ? (
          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
        ) : (
          <Badge variant="outline">Waiting</Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      department_manager: "Department Manager",
      direct_manager: "Direct Manager",
      finance_manager: "Finance Manager",
      hr_manager: "HR Manager",
      executive: "Executive",
      admin: "Administrator",
    };
    return roleMap[role] || role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getOverallStatus = () => {
    switch (approval.status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Fully Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const currentStep = steps.find(s => s.stepNumber === approval.currentStep);
  const canCurrentUserApprove = showActions && currentStep?.status === "pending";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Approval Workflow</CardTitle>
          {getOverallStatus()}
        </div>
        <div className="text-sm text-gray-600">
          Step {approval.currentStep} of {approval.totalSteps} • 
          Started {format(new Date(approval.createdAt), "MMM d, yyyy 'at' h:mm a")}
          {approval.completedAt && (
            <> • Completed {format(new Date(approval.completedAt), "MMM d, yyyy 'at' h:mm a")}</>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Timeline */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step Icon */}
              <div className="flex flex-col items-center">
                {getStepIcon(step)}
                {index < steps.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">
                      Step {step.stepNumber}: {getRoleDisplayName(step.approverRole)}
                    </h4>
                    {step.assignedTo && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assigned to User #{step.assignedTo}
                      </p>
                    )}
                  </div>
                  {getStepStatus(step)}
                </div>

                {/* Step Details */}
                {step.status === "approved" && step.approvedAt && (
                  <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    Approved on {format(new Date(step.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}

                {step.comments && (
                  <div className="text-xs text-gray-600 flex items-start gap-1 bg-gray-50 p-2 rounded">
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{step.comments}</span>
                  </div>
                )}

                {/* Action Buttons for Current Step */}
                {canCurrentUserApprove && step.stepNumber === approval.currentStep && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => onApprove?.(step.id)}
                      className="h-8"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject?.(step.id)}
                      className="h-8"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Rejection Reason */}
        {approval.status === "rejected" && approval.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-red-800 text-sm">Rejection Reason</h5>
                <p className="text-red-700 text-sm mt-1">{approval.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Request Type:</span>
              <p className="capitalize">{approval.requestType.replace(/_/g, " ")}</p>
            </div>
            <div>
              <span className="font-medium">Request ID:</span>
              <p>#{approval.requestId}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}