import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Plus, 
  Target, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Flag
} from "lucide-react";
import { format } from "date-fns";

interface Milestone {
  id: number;
  name: string;
  description?: string;
  targetDate: Date;
  status: "pending" | "in_progress" | "completed";
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MilestoneManagementProps {
  projectId: number;
  projectName: string;
}

export function MilestoneManagement({ projectId, projectName }: MilestoneManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    description: "",
    targetDate: "",
  });

  // Queries
  const { data: milestones, refetch: refetchMilestones } = trpc.project.getMilestones.useQuery({ projectId });
  const { data: tasks } = trpc.project.getTasks.useQuery({ projectId });

  // Mutations
  const createMilestoneMutation = trpc.project.createMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      refetchMilestones();
    },
    onError: (error) => {
      toast.error(`Failed to create milestone: ${error.message}`);
    },
  });

  const updateMilestoneMutation = trpc.project.updateMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone updated successfully");
      setIsEditModalOpen(false);
      setSelectedMilestone(null);
      resetForm();
      refetchMilestones();
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });

  const deleteMilestoneMutation = trpc.project.deleteMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone deleted successfully");
      refetchMilestones();
    },
    onError: (error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });

  const resetForm = () => {
    setMilestoneForm({
      name: "",
      description: "",
      targetDate: "",
    });
  };

  const handleCreateMilestone = () => {
    createMilestoneMutation.mutate({
      projectId,
      name: milestoneForm.name,
      description: milestoneForm.description,
      targetDate: milestoneForm.targetDate,
    });
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description || "",
      targetDate: format(new Date(milestone.targetDate), "yyyy-MM-dd"),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMilestone = () => {
    if (!selectedMilestone) return;
    
    updateMilestoneMutation.mutate({
      milestoneId: selectedMilestone.id,
      name: milestoneForm.name,
      description: milestoneForm.description,
      targetDate: milestoneForm.targetDate,
    });
  };

  const handleDeleteMilestone = (milestoneId: number) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestoneMutation.mutate({ milestoneId });
    }
  };

  const handleStatusChange = (milestoneId: number, newStatus: Milestone["status"]) => {
    updateMilestoneMutation.mutate({
      milestoneId,
      status: newStatus,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = (milestone: Milestone) => {
    if (!tasks) return 0;
    
    // Calculate progress based on related tasks (simplified logic)
    const relatedTasks = tasks.filter((task: any) => 
      task.dueDate && new Date(task.dueDate) <= new Date(milestone.targetDate)
    );
    
    if (relatedTasks.length === 0) return 0;
    
    const completedTasks = relatedTasks.filter((task: any) => task.status === "completed");
    return Math.round((completedTasks.length / relatedTasks.length) * 100);
  };

  const isOverdue = (targetDate: Date) => {
    return new Date() > new Date(targetDate);
  };

  const getDaysUntilTarget = (targetDate: Date) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Milestone Management
            </CardTitle>
            <p className="text-sm text-gray-600">Track key milestones for {projectName}</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!milestones?.length ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No milestones created yet. Add your first milestone to track progress!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((milestone: any) => {
              const progress = calculateProgress(milestone);
              const daysUntil = getDaysUntilTarget(milestone.targetDate);
              const overdue = isOverdue(milestone.targetDate);
              
              return (
                <div key={milestone.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{milestone.name}</h4>
                        <Badge className={getStatusColor(milestone.status)}>
                          {getStatusIcon(milestone.status)}
                          <span className="ml-1">{milestone.status.replace("_", " ")}</span>
                        </Badge>
                        {overdue && milestone.status !== "completed" && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {milestone.description && (
                        <p className="text-gray-600 mb-3">{milestone.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Target: {format(new Date(milestone.targetDate), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Flag className="h-4 w-4" />
                          {overdue ? (
                            <span className="text-red-600 font-medium">
                              {Math.abs(daysUntil)} days overdue
                            </span>
                          ) : daysUntil === 0 ? (
                            <span className="text-orange-600 font-medium">Due today</span>
                          ) : daysUntil > 0 ? (
                            <span>{daysUntil} days remaining</span>
                          ) : (
                            <span className="text-green-600">Completed</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={milestone.status}
                        onValueChange={(value) => handleStatusChange(milestone.id, value as Milestone["status"])}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMilestone(milestone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Milestone Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Milestone Name *</Label>
                <Input
                  id="name"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  placeholder="Enter milestone name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="Enter milestone description"
                />
              </div>
              
              <div>
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateMilestone} 
                  disabled={!milestoneForm.name || !milestoneForm.targetDate || createMilestoneMutation.isPending}
                >
                  {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Milestone Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Milestone Name *</Label>
                <Input
                  id="edit-name"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  placeholder="Enter milestone name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="Enter milestone description"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-targetDate">Target Date *</Label>
                <Input
                  id="edit-targetDate"
                  type="date"
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateMilestone} 
                  disabled={!milestoneForm.name || !milestoneForm.targetDate || updateMilestoneMutation.isPending}
                >
                  {updateMilestoneMutation.isPending ? "Updating..." : "Update Milestone"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}