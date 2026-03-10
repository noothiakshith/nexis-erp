import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CreateProjectModal } from "@/components/Projects/CreateProjectModal";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);

  // Real data fetching
  const { data: projects, refetch } = trpc.project.getProjects.useQuery();

  const activeCount = projects?.filter((p: any) => p.status === "active").length || 0;
  const totalBudget = projects?.reduce((sum: number, p: any) => sum + parseFloat(p.budget || "0"), 0) || 0;

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Projects Module
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track goals, budgets and timelines</p>
          </div>
          <Button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all active:scale-95"
          >
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">{activeCount}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Project Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {projects && projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Manager</th>
                      <th className="px-6 py-4">Timeline</th>
                      <th className="px-6 py-4 text-right">Budget</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((project: any) => (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{project.name}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[200px]">{project.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {project.projectManager || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(project.startDate!).toLocaleDateString()} to {new Date(project.endDate!).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ${parseFloat(project.budget || "0").toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={`${project.status === "active" ? "bg-green-100 text-green-700" :
                            project.status === "at_risk" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                            } border-none`}>
                            {project.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p>No projects found. Launch your first project!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateProjectModal
          open={isProjectModalOpen}
          onOpenChange={setIsProjectModalOpen}
          onSuccess={refetch}
        />
      </div>
    </ERPDashboardLayout>
  );
}
