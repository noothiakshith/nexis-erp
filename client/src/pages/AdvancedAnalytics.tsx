import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GanttChart } from "@/components/GanttChart";
import { SalesFunnel } from "@/components/SalesFunnel";
import { Loader2 } from "lucide-react";

/**
 * Advanced Analytics Page
 * Gantt charts, sales funnel, and detailed analytics
 */
export default function AdvancedAnalytics() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch Gantt chart data
  const { data: ganttData, isLoading: ganttLoading } =
    trpc.advancedAnalytics.getProjectGanttChart.useQuery();

  // Fetch task timeline for selected project
  const { data: taskTimeline, isLoading: timelineLoading } =
    trpc.advancedAnalytics.getProjectTaskTimeline.useQuery(
      { projectId: selectedProjectId || 0 },
      { enabled: !!selectedProjectId }
    );

  // Fetch sales funnel
  const { data: funnelData, isLoading: funnelLoading } =
    trpc.advancedAnalytics.getSalesFunnel.useQuery();

  // Fetch lead source analysis
  const { data: leadSources, isLoading: leadSourceLoading } =
    trpc.advancedAnalytics.getLeadSourceAnalysis.useQuery();

  // Fetch customer acquisition trend
  const { data: customerTrend, isLoading: customerLoading } =
    trpc.advancedAnalytics.getCustomerAcquisitionTrend.useQuery({
      months: 12,
    });

  const isLoading =
    ganttLoading || funnelLoading || leadSourceLoading || customerLoading || timelineLoading;

  if (isLoading && !ganttData && !funnelData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-gray-600 mt-1">
          Project timelines, sales pipeline, and detailed performance metrics
        </p>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Project Timeline</TabsTrigger>
          <TabsTrigger value="sales">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Gantt Chart */}
          {ganttData && ganttData.length > 0 ? (
            <GanttChart
              tasks={ganttData.map((task) => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate),
              }))}
              title="All Projects Timeline"
              description="Gantt chart showing all active projects and their progress"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">No active projects</p>
              </CardContent>
            </Card>
          )}

          {/* Project Selection */}
          {ganttData && ganttData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Task Timeline</CardTitle>
                <CardDescription>Select a project to view detailed task timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {ganttData.map((project) => (
                    <Button
                      key={project.projectId}
                      onClick={() => setSelectedProjectId(project.projectId)}
                      variant={selectedProjectId === project.projectId ? "default" : "outline"}
                      size="sm"
                    >
                      {project.projectName}
                    </Button>
                  ))}
                </div>

                {selectedProjectId && taskTimeline && taskTimeline.length > 0 && (
                  <GanttChart
                    tasks={taskTimeline.map((task) => ({
                      id: task.id,
                      name: task.name,
                      projectName: "",
                      projectId: selectedProjectId,
                      startDate: new Date(task.startDate),
                      endDate: new Date(task.endDate),
                      progress: task.progress,
                      status: task.status,
                    }))}
                    title="Task Timeline"
                    description="Detailed timeline for selected project tasks"
                  />
                )}

                {selectedProjectId && (!taskTimeline || taskTimeline.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No tasks found for this project
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          {/* Sales Funnel */}
          {funnelData && funnelData.length > 0 ? (
            <SalesFunnel
              data={funnelData}
              title="Sales Pipeline Funnel"
              description="Lead progression through sales stages with conversion metrics"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">No sales funnel data available</p>
              </CardContent>
            </Card>
          )}

          {/* Lead Source Analysis */}
          {leadSources && leadSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Source Analysis</CardTitle>
                <CardDescription>Lead distribution by source channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadSources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{source.source}</p>
                        <p className="text-xs text-gray-600">{source.leads} leads</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(source.value / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-gray-600">Pipeline value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Customer Acquisition Trend */}
          {customerTrend && customerTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition Trend</CardTitle>
                <CardDescription>New customers added per month (last 12 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerTrend.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((month.customers / 50) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">
                          {month.customers}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-sm">Growth Rate</p>
                <p className="text-sm text-gray-600 mt-1">
                  Average of 8-12 new customers per month based on historical data
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-sm">Retention</p>
                <p className="text-sm text-gray-600 mt-1">
                  Focus on customer satisfaction and engagement to maintain high retention rates
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium text-sm">Expansion</p>
                <p className="text-sm text-gray-600 mt-1">
                  Opportunity to increase customer lifetime value through upselling and cross-selling
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Export Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm">
            Export as PDF
          </Button>
          <Button variant="outline" size="sm">
            Export as CSV
          </Button>
          <Button variant="outline" size="sm">
            Schedule Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
