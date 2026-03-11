import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  User,
  Calendar,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: number;
  action: string;
  performedBy: number;
  details?: Record<string, any> | unknown;
  ipAddress?: string | null;
  createdAt: Date;
}

interface ApprovalAuditLogProps {
  auditLog: AuditLogEntry[];
  className?: string;
}

export function ApprovalAuditLog({ auditLog, className }: ApprovalAuditLogProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return <Plus className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "updated":
      case "modified":
        return <Edit className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return <Badge className="bg-blue-100 text-blue-800">Created</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "updated":
      case "modified":
        return <Badge className="bg-orange-100 text-orange-800">Updated</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getActionDescription = (entry: AuditLogEntry) => {
    const { action, details } = entry;
    
    // Safely access details properties
    const safeDetails = details as Record<string, any> || {};
    
    switch (action.toLowerCase()) {
      case "created":
        return `Approval workflow created for ${safeDetails.requestType?.replace(/_/g, " ") || "request"} #${safeDetails.requestId || "unknown"}`;
      case "approved":
        return safeDetails.comments 
          ? `Approved with comment: "${safeDetails.comments}"`
          : "Approved the request";
      case "rejected":
        return safeDetails.reason 
          ? `Rejected with reason: "${safeDetails.reason}"`
          : "Rejected the request";
      case "updated":
        return "Updated approval details";
      default:
        return `Performed action: ${action}`;
    }
  };

  if (!auditLog.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No audit log entries found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete history of all actions performed on this approval
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLog.map((entry, index) => (
            <div key={entry.id} className="flex items-start gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                {getActionIcon(entry.action)}
                {index < auditLog.length - 1 && (
                  <div className="w-px h-8 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User #{entry.performedBy}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {getActionDescription(entry)}
                </p>

                {/* Additional Details */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {entry.ipAddress && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {entry.ipAddress}
                    </span>
                  )}
                  
                  {(() => {
                    const hasDetails = entry.details && 
                      typeof entry.details === 'object' && 
                      entry.details !== null && 
                      Object.keys(entry.details as Record<string, any>).length > 0;
                    
                    return hasDetails ? (
                      <details className="cursor-pointer">
                        <summary className="hover:text-gray-700">View Details</summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(entry.details || {}, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Actions:</span>
              <p>{auditLog.length}</p>
            </div>
            <div>
              <span className="font-medium">Last Activity:</span>
              <p>{auditLog[0]?.createdAt ? format(new Date(auditLog[0].createdAt), "MMM d, yyyy 'at' h:mm a") : "No activity"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}