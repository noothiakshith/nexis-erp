import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Plus, 
  Users, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Briefcase,
  X
} from "lucide-react";

interface ResourceAllocation {
  id: number;
  projectId: number;
  employeeId: number;
  role: string;
  allocatedHours: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "on_hold";
}

interface ResourceAllocationProps {
  projectId: number;
  projectName: string;
}

export function ResourceAllocation({ projectId, projectName }: ResourceAllocationProps) {
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    employeeId: "",
    role: "",
    allocatedHours: "",
    startDate: "",
    endDate: "",
  });

  // Queries
  const { data: allocations, refetch: refetchAllocations } = trpc.project.getResourceAllocations.useQuery({ projectId });
  const { data: employees } = trpc.employee.listAll.useQuery();
  const { data: tasks } = trpc.project.getTasks.useQuery({ projectId });

  // Mutations
  const addResourceMutation = trpc.project.addResourceAllocation.useMutation({
    onSuccess: () => {
      toast.success("Resource allocated successfully");
      setIsAddResourceModalOpen(false);
      resetForm();
      refetchAllocations();
    },
    onError: (error) => {
      toast.error(`Failed to allocate resource: ${error.message}`);
    },
  });

  const removeResourceMutation = trpc.project.removeResourceAllocation.useMutation({
    onSuccess: () => {
      toast.success("Resource removed successfully");
      refetchAllocations();
    },
    onError: (error) => {
      toast.error(`Failed to remove resource: ${error.message}`);
    },
  });

  const updateResourceStatusMutation = trpc.project.updateResourceStatus.useMutation({
    onSuccess: () => {
      toast.success("Resource status updated");
      refetchAllocations();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const resetForm = () => {
    setResourceForm({
      employeeId: "",
      role: "",
      allocatedHours: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleAddResource = () => {
    addResourceMutation.mutate({
      projectId,
      employeeId: parseInt(resourceForm.employeeId),
      role: resourceForm.role,
      allocatedHours: parseInt(resourceForm.allocatedHours),
      startDate: resourceForm.startDate,
      endDate: resourceForm.endDate || undefined,
    });
  };

  const handleRemoveResource = (allocationId: number) => {
    if (confirm("Are you sure you want to remove this resource allocation?")) {
      removeResourceMutation.mutate({ allocationId });
    }
  };

  const handleStatusChange = (allocationId: number, newStatus: ResourceAllocation["status"]) => {
    updateResourceStatusMutation.mutate({
      allocationId,
      status: newStatus,
    });
  };

  const getEmployeeDetails = (employeeId: number) => {
    if (!employees) return null;
    return employees.find((emp: any) => emp.userId === employeeId);
  };

  const getEmployeeInitials = (employee: any) => {
    if (!employee) return "??";
    return `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();
  };

  const getEmployeeWorkload = (employeeId: number) => {
    if (!tasks) return 0;
    const assignedTasks = tasks.filter((task: any) => task.assignedTo === employeeId);
    const completedTasks = assignedTasks.filter((task: any) => task.status === "completed");
    return assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "on_hold":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateTeamUtilization = () => {
    if (!allocations || allocations.length === 0) return 0;
    const activeAllocations = allocations.filter((alloc: any) => alloc.status === "active");
    const totalHours = activeAllocations.reduce((sum: number, alloc: any) => sum + alloc.allocatedHours, 0);
    const standardWorkWeek = 40; // hours per week
    const teamSize = activeAllocations.length;
    const maxCapacity = teamSize * standardWorkWeek;
    return maxCapacity > 0 ? Math.round((totalHours / maxCapacity) * 100) : 0;
  };

  const getAvailableEmployees = () => {
    if (!employees || !allocations) return employees;
    const allocatedEmployeeIds = allocations
      .filter((alloc: any) => alloc.status === "active")
      .map((alloc: any) => alloc.employeeId);
    return employees.filter((emp: any) => !allocatedEmployeeIds.includes(emp.userId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resource Allocation
            </CardTitle>
            <p className="text-sm text-gray-600">Manage team members and their roles for {projectName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Team Utilization</p>
              <p className="text-lg font-semibold">{calculateTeamUtilization()}%</p>
            </div>
            <Button onClick={() => setIsAddResourceModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!allocations?.length ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No resources allocated yet. Add team members to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Team Members</p>
                    <p className="text-xl font-semibold">{allocations.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Allocated Hours</p>
                    <p className="text-xl font-semibold">
                      {allocations.reduce((sum: number, alloc: any) => sum + alloc.allocatedHours, 0)}h
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Resources</p>
                    <p className="text-xl font-semibold">
                      {allocations.filter((alloc: any) => alloc.status === "active").length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Resource List */}
            <div className="space-y-4">
              {allocations.map((allocation: any) => {
                const employee = getEmployeeDetails(allocation.employeeId);
                const workload = getEmployeeWorkload(allocation.employeeId);
                
                return (
                  <div key={allocation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {getEmployeeInitials(employee)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium">
                            {employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee"}
                          </h4>
                          <p className="text-sm text-gray-600">{allocation.role}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {allocation.allocatedHours}h allocated
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Started {new Date(allocation.startDate).toLocaleDateString()}
                            </span>
                            {employee?.department && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {employee.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Workload</p>
                          <div className="flex items-center gap-2">
                            <Progress value={workload} className="w-16 h-2" />
                            <span className="text-sm font-medium">{workload}%</span>
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(allocation.status)}>
                          {getStatusIcon(allocation.status)}
                          <span className="ml-1">{allocation.status.replace("_", " ")}</span>
                        </Badge>
                        
                        <Select
                          value={allocation.status}
                          onValueChange={(value) => handleStatusChange(allocation.id, value as ResourceAllocation["status"])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveResource(allocation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Resource Modal */}
        <Dialog open={isAddResourceModalOpen} onOpenChange={setIsAddResourceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Resource to Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeId">Team Member *</Label>
                <Select
                  value={resourceForm.employeeId}
                  onValueChange={(value) => setResourceForm({ ...resourceForm, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableEmployees()?.map((employee: any) => (
                      <SelectItem key={employee.userId} value={employee.userId.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getEmployeeInitials(employee)}
                            </AvatarFallback>
                          </Avatar>
                          {employee.firstName} {employee.lastName}
                          {employee.department && (
                            <span className="text-gray-500">({employee.department})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Role/Position *</Label>
                <Input
                  id="role"
                  value={resourceForm.role}
                  onChange={(e) => setResourceForm({ ...resourceForm, role: e.target.value })}
                  placeholder="e.g., Frontend Developer, Project Manager"
                />
              </div>
              
              <div>
                <Label htmlFor="allocatedHours">Allocated Hours per Week *</Label>
                <Input
                  id="allocatedHours"
                  type="number"
                  value={resourceForm.allocatedHours}
                  onChange={(e) => setResourceForm({ ...resourceForm, allocatedHours: e.target.value })}
                  placeholder="40"
                  min="1"
                  max="40"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={resourceForm.startDate}
                    onChange={(e) => setResourceForm({ ...resourceForm, startDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={resourceForm.endDate}
                    onChange={(e) => setResourceForm({ ...resourceForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddResource} 
                  disabled={
                    !resourceForm.employeeId || 
                    !resourceForm.role || 
                    !resourceForm.allocatedHours || 
                    !resourceForm.startDate || 
                    addResourceMutation.isPending
                  }
                >
                  {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
                </Button>
                <Button variant="outline" onClick={() => setIsAddResourceModalOpen(false)}>
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