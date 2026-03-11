import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  ArrowRight,
  Eye,
  GripVertical
} from "lucide-react";
import { useLocation } from "wouter";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leads: any[];
}

interface DraggedLead {
  lead: any;
  sourceStage: string;
}

export function SalesPipeline() {
  const [, setLocation] = useLocation();
  const [draggedItem, setDraggedItem] = useState<DraggedLead | null>(null);
  const { data: leads, refetch } = trpc.crm.getLeads.useQuery();

  const stages: PipelineStage[] = [
    {
      id: "new",
      name: "New Leads",
      color: "bg-gray-100 text-gray-800",
      leads: leads?.filter((l: any) => l.status === "new") || []
    },
    {
      id: "contacted",
      name: "Contacted",
      color: "bg-blue-100 text-blue-800",
      leads: leads?.filter((l: any) => l.status === "contacted") || []
    },
    {
      id: "qualified",
      name: "Qualified",
      color: "bg-purple-100 text-purple-800",
      leads: leads?.filter((l: any) => l.status === "qualified") || []
    },
    {
      id: "proposal",
      name: "Proposal",
      color: "bg-orange-100 text-orange-800",
      leads: leads?.filter((l: any) => l.status === "proposal") || []
    },
    {
      id: "won",
      name: "Won",
      color: "bg-green-100 text-green-800",
      leads: leads?.filter((l: any) => l.status === "won") || []
    }
  ];

  const updateLeadStatusMutation = trpc.crm.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update lead status: ${error.message}`);
    },
  });

  const totalValue = leads?.reduce((sum: number, lead: any) => 
    sum + parseFloat(lead.value || "0"), 0
  ) || 0;

  const conversionRate = leads && leads.length > 0
    ? Math.round((leads.filter((l: any) => l.status === "won").length / leads.length) * 100)
    : 0;

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, lead: any, sourceStage: string) => {
    const dragData: DraggedLead = { lead, sourceStage };
    setDraggedItem(dragData);
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
    
    // Add visual feedback
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-blue-50", "border-blue-300", "border-2", "border-dashed");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-blue-50", "border-blue-300", "border-2", "border-dashed");
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-blue-50", "border-blue-300", "border-2", "border-dashed");
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain")) as DraggedLead;
      
      if (dragData.sourceStage !== targetStage) {
        // Update lead status
        updateLeadStatusMutation.mutate({
          leadId: dragData.lead.id,
          status: targetStage as any,
        });
      }
    } catch (error) {
      console.error("Error handling drop:", error);
      toast.error("Failed to move lead");
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Drag and Drop Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Drag and drop leads between stages to update their status. 
          Click the grip icon and drag to move leads through your sales pipeline.
        </p>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            <Card 
              className="h-full min-h-[400px] transition-all duration-200"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  <Badge className={stage.color}>
                    {stage.leads.length}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  ${stage.leads.reduce((sum, lead) => sum + parseFloat(lead.value || "0"), 0).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {stage.leads.length > 0 ? (
                  stage.leads.map((lead: any) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, stage.id)}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-white border rounded-lg hover:bg-gray-50 transition-all cursor-move shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                          </div>
                          <p className="text-xs text-gray-600 truncate ml-6">{lead.company}</p>
                          {lead.value && (
                            <p className="text-xs font-semibold text-green-600 mt-1 ml-6">
                              ${parseFloat(lead.value).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/crm/leads/${lead.id}`);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-lg">
                    <p>Drop leads here</p>
                    <p className="mt-1">or</p>
                    <p>No leads in this stage</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Arrow between stages */}
            {index < stages.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drag Feedback */}
      {draggedItem && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50">
          <p className="text-sm">
            Moving <strong>{draggedItem.lead.name}</strong> from <strong>{draggedItem.sourceStage}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
