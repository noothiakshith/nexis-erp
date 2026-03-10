import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GanttTask {
  id: number;
  name: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  title?: string;
  description?: string;
}

/**
 * Gantt Chart Component
 * Visualizes project timelines and task schedules
 */
export function GanttChart({ tasks, title = "Project Timeline", description }: GanttChartProps) {
  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    // Find min and max dates
    const dates = tasks.flatMap((t) => [new Date(t.startDate), new Date(t.endDate)]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Calculate total days
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    return tasks.map((task) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      const startOffset = Math.ceil(
        (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const duration = Math.ceil(
        (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...task,
        startOffset: Math.max(0, (startOffset / totalDays) * 100),
        width: Math.max(2, (duration / totalDays) * 100),
      };
    });
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-400";
      case "on_hold":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tasks to display</div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            {/* Timeline header */}
            <div className="flex items-center gap-4">
              <div className="w-48 flex-shrink-0">
                <p className="text-sm font-semibold">Task Name</p>
              </div>
              <div className="flex-1 min-w-96">
                <div className="flex justify-between text-xs text-gray-600 px-2">
                  <span>Start</span>
                  <span>Progress</span>
                  <span>End</span>
                </div>
              </div>
            </div>

            {/* Tasks */}
            {chartData.map((task) => (
              <div key={task.id} className="flex items-center gap-4 py-2 border-b pb-2">
                <div className="w-48 flex-shrink-0">
                  <div>
                    <p className="text-sm font-medium truncate">{task.name}</p>
                    <p className="text-xs text-gray-600">{task.projectName}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-96">
                  <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
                    {/* Task bar */}
                    <div
                      className={`absolute h-full ${getStatusColor(task.status)} opacity-80 rounded-md transition-all`}
                      style={{
                        left: `${task.startOffset}%`,
                        width: `${task.width}%`,
                        minWidth: "4px",
                      }}
                    >
                      {/* Progress indicator */}
                      <div
                        className="h-full bg-gradient-to-r from-transparent to-white opacity-30"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {/* Progress text */}
                    {task.width > 15 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white pointer-events-none">
                        {task.progress}%
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-gray-600 mt-1 px-2">
                    <span>{new Date(task.startDate).toLocaleDateString()}</span>
                    <span>{new Date(task.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="w-24 flex-shrink-0">
                  <Badge className={getStatusBadgeColor(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Status Legend</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span>On Hold</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
