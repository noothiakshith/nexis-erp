import React from "react";
import { useParams, useLocation } from "wouter";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskManagement } from "@/components/Projects/TaskManagement";
import { MilestoneManagement } from "@/components/Projects/MilestoneManagement";
import { ResourceAllocation } from "@/components/Projects/ResourceAllocation";
import { ProjectComments } from "@/components/Projects/ProjectComments";
import { ProjectFiles } from "@/components/Projects/ProjectFiles";
import { ProjectActivity } from "@/components/Projects/ProjectActivity";
import { GanttChart } from "@/components/GanttChart";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  // Queries
  const { data: project } = trpc.project.getProject.useQuery({ projectId });
  const { data: tasks } = trpc.project.getTasks.useQuery({ projectId });
  const { data: milestones } = trpc.project.getMilestones.useQuery({ projectId });
  const { data: allocations } = trpc.project.getResourceAllocations.useQuery({ projectId });

  if (!project) {
    return (
      <ERPDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Project not found</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/projects")}
              className="mt-4"
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </ERPDashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProjectProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter((task: any) => task.status === "completed");
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  const getProjectStats = () => {
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((task: any) => task.status === "completed").length || 0;
    const overdueTasks = tasks?.filter((task: any) => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"
    ).length || 0;
    const totalMilestones = milestones?.length || 0;
    const completedMilestones = milestones?.filter((milestone: any) => milestone.status === "completed").length || 0;
    const teamSize = allocations?.filter((alloc: any) => alloc.status === "active").length || 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalMilestones,
      completedMilestones,
      teamSize,
      progress: calculateProjectProgress(),
    };
  };

  const stats = getProjectStats();

  // Prepare Gantt chart data
  const ganttTasks = tasks?.map((task: any) => ({
    id: task.id,
    name: task.title,
    projectName: project.name,
    startDate: task.createdAt ? new Date(task.createdAt) : new Date(),
    endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: task.status === "completed" ? 100 : task.status === "in_progress" ? 50 : 0,
    status: task.status,
  })) || [];

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/projects")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.progress}%</div>
              <p className="text-xs text-gray-600">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamSize}</div>
              <p className="text-xs text-gray-600">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedMilestones}/{stats.totalMilestones}
              </div>
              <p className="text-xs text-gray-600">Completed milestones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(project.budget || "0").toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Total allocated</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start: {format(new Date(project.startDate), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End: {format(new Date(project.endDate), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status Overview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tasks:</span>
                    <span>{stats.totalTasks} total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="text-green-600">{stats.completedTasks}</span>
                  </div>
                  {stats.overdueTasks > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Overdue:</span>
                      <span className="text-red-600">{stats.overdueTasks}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Project Manager</h4>
                <div className="text-sm text-gray-600">
                  <p>User #{project.projectManager}</p>
                  <p className="text-xs">Created {format(new Date(project.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <TaskManagement projectId={projectId} projectName={project.name} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <MilestoneManagement projectId={projectId} projectName={project.name} />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceAllocation projectId={projectId} projectName={project.name} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <GanttChart 
              tasks={ganttTasks}
              title={`${project.name} Timeline`}
              description="Visual timeline of all project tasks and milestones"
            />
          </TabsContent>

          <TabsContent value="discussion" className="space-y-4">
            <ProjectComments projectId={projectId} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <ProjectFiles projectId={projectId} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ProjectActivity projectId={projectId} />
          </TabsContent>

        </Tabs>
      </div>
    </ERPDashboardLayout>
  );
}