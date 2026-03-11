import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  User, 
  FileText,
  MessageSquare,
  Upload,
  UserPlus,
  Target,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  performedBy: number;
  performerName: string;
  createdAt: Date;
  metadata?: any;
}

interface ProjectActivityProps {
  projectId: number;
}

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  // Queries - Using mock data for now since API endpoints are not fully implemented
  // const { data: activities } = trpc.project.getActivity.useQuery({ projectId });
  const activities: ActivityItem[] = [
    {
      id: 1,
      type: "task_created",
      description: "created a new task 'Implement user authentication'",
      performedBy: 1,
      performerName: "John Doe",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      metadata: { taskName: "Implement user authentication" }
    },
    {
      id: 2,
      type: "milestone_updated",
      description: "marked milestone 'Phase 1 Complete' as completed",
      performedBy: 2,
      performerName: "Jane Smith",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      metadata: { milestoneName: "Phase 1 Complete" }
    },
    {
      id: 3,
      type: "file_uploaded",
      description: "uploaded a new file 'Design Mockups.figma'",
      performedBy: 1,
      performerName: "John Doe",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      metadata: { fileName: "Design Mockups.figma" }
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'milestone_created':
      case 'milestone_updated':
        return <Target className="h-4 w-4 text-purple-600" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'file_uploaded':
        return <Upload className="h-4 w-4 text-orange-600" />;
      case 'member_added':
        return <UserPlus className="h-4 w-4 text-indigo-600" />;
      case 'project_updated':
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return 'bg-blue-100 text-blue-800';
      case 'milestone_created':
      case 'milestone_updated':
        return 'bg-purple-100 text-purple-800';
      case 'comment_added':
        return 'bg-green-100 text-green-800';
      case 'file_uploaded':
        return 'bg-orange-100 text-orange-800';
      case 'member_added':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatActivityTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: ActivityItem) => (
              <div key={activity.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                    {getAuthorInitials(activity.performerName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getActivityIcon(activity.type)}
                        <span className="font-medium text-sm">{activity.performerName}</span>
                        <Badge className={`${getActivityColor(activity.type)} text-xs`}>
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      
                      {/* Additional metadata */}
                      {activity.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          {activity.metadata.taskName && (
                            <span>Task: {activity.metadata.taskName}</span>
                          )}
                          {activity.metadata.milestoneName && (
                            <span>Milestone: {activity.metadata.milestoneName}</span>
                          )}
                          {activity.metadata.fileName && (
                            <span>File: {activity.metadata.fileName}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                      <Clock className="h-3 w-3" />
                      {formatActivityTime(new Date(activity.createdAt))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity. Start working on the project to see updates here!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}