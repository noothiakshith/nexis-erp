import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  MessageCircle, 
  Video, 
  Share2, 
  Eye,
  Edit,
  Send,
  Pin,
  Bell,
  Activity,
  Zap,
  Monitor,
  UserPlus,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface CollaborationSession {
  id: string;
  name: string;
  type: 'budget_planning' | 'financial_review' | 'expense_approval' | 'report_analysis';
  participants: Participant[];
  status: 'active' | 'scheduled' | 'completed';
  startTime: Date;
  endTime?: Date;
  documentId?: string;
  isLive: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  permissions: string[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'annotation' | 'suggestion';
  resolved: boolean;
  replies?: Comment[];
  attachedTo?: string; // Element ID for annotations
}

interface LiveUpdate {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  type: 'edit' | 'comment' | 'approval' | 'view';
}

export function RealTimeCollaboration() {
  const [activeSession, setActiveSession] = useState<string | null>("session-1");
  const [newComment, setNewComment] = useState("");

  // Mock data - in real implementation would come from WebSocket/real-time service
  const collaborationSessions: CollaborationSession[] = [
    {
      id: "session-1",
      name: "Q4 Budget Planning Review",
      type: "budget_planning",
      participants: [
        {
          id: "user-1",
          name: "Sarah Johnson",
          role: "CFO",
          status: "online",
          lastSeen: new Date(),
          permissions: ["edit", "approve", "comment"]
        },
        {
          id: "user-2", 
          name: "Mike Chen",
          role: "Finance Manager",
          status: "online",
          lastSeen: new Date(),
          permissions: ["edit", "comment"]
        },
        {
          id: "user-3",
          name: "Lisa Rodriguez",
          role: "Budget Analyst",
          status: "away",
          lastSeen: new Date(Date.now() - 5 * 60 * 1000),
          permissions: ["comment", "view"]
        }
      ],
      status: "active",
      startTime: new Date(Date.now() - 45 * 60 * 1000),
      isLive: true
    },
    {
      id: "session-2",
      name: "Monthly Financial Review",
      type: "financial_review",
      participants: [
        {
          id: "user-4",
          name: "David Park",
          role: "Controller",
          status: "offline",
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          permissions: ["edit", "approve"]
        }
      ],
      status: "scheduled",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      isLive: false
    }
  ];

  const comments: Comment[] = [
    {
      id: "comment-1",
      userId: "user-1",
      userName: "Sarah Johnson",
      content: "The marketing budget seems high for Q4. Can we reallocate 15% to R&D?",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      type: "comment",
      resolved: false,
      attachedTo: "marketing-budget"
    },
    {
      id: "comment-2",
      userId: "user-2",
      userName: "Mike Chen",
      content: "I've updated the travel expenses projection based on the new remote work policy.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: "annotation",
      resolved: false,
      attachedTo: "travel-expenses"
    },
    {
      id: "comment-3",
      userId: "user-3",
      userName: "Lisa Rodriguez",
      content: "The Q3 actuals are now available. Should we update the variance analysis?",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: "suggestion",
      resolved: false
    }
  ];

  const liveUpdates: LiveUpdate[] = [
    {
      id: "update-1",
      userId: "user-2",
      userName: "Mike Chen",
      action: "Updated budget allocation",
      details: "Marketing budget reduced by $15,000",
      timestamp: new Date(Date.now() - 30 * 1000),
      type: "edit"
    },
    {
      id: "update-2",
      userId: "user-1",
      userName: "Sarah Johnson",
      action: "Added comment",
      details: "On Q4 marketing strategy alignment",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: "comment"
    },
    {
      id: "update-3",
      userId: "user-3",
      userName: "Lisa Rodriguez",
      action: "Approved expense",
      details: "Travel expense EXP-2024-156",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: "approval"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-amber-500';
      case 'offline': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_planning': return '📊';
      case 'financial_review': return '📈';
      case 'expense_approval': return '💳';
      case 'report_analysis': return '📋';
      default: return '💼';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'approval': return <Badge className="w-4 h-4 text-purple-600" />;
      case 'view': return <Eye className="w-4 h-4 text-slate-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    // In real implementation, would send via WebSocket
    console.log("Adding comment:", newComment);
    setNewComment("");
  };

  const currentSession = collaborationSessions.find(s => s.id === activeSession);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            Real-Time Financial Collaboration
          </h2>
          <p className="text-slate-500 text-sm">Collaborate on financial planning and analysis in real-time</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Collaborators
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Active Sessions
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {collaborationSessions.filter(s => s.status === 'active').length} Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborationSessions.map((session) => (
                  <div 
                    key={session.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      activeSession === session.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveSession(session.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSessionTypeIcon(session.type)}</span>
                        <div>
                          <h4 className="font-semibold text-slate-900">{session.name}</h4>
                          <p className="text-sm text-slate-500">
                            Started {format(session.startTime, 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isLive && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-600 font-medium">LIVE</span>
                          </div>
                        )}
                        <Badge className={
                          session.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {session.participants.slice(0, 4).map((participant) => (
                          <div key={participant.id} className="relative">
                            <Avatar className="w-8 h-8 border-2 border-white">
                              <AvatarFallback className="text-xs">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(participant.status)}`}></div>
                          </div>
                        ))}
                        {session.participants.length > 4 && (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                            +{session.participants.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Share2 className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Join
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveUpdates.map((update) => (
                <div key={update.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-1 bg-white rounded-full">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{update.userName}</p>
                    <p className="text-xs text-slate-600">{update.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{update.details}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(update.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Tools */}
      {currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comments & Annotations */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments & Annotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {comment.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-900">{comment.userName}</span>
                        <Badge className={
                          comment.type === 'comment' ? 'bg-blue-100 text-blue-700' :
                          comment.type === 'annotation' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {comment.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(comment.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
                    {comment.attachedTo && (
                      <p className="text-xs text-slate-500 mb-2">
                        📎 Attached to: {comment.attachedTo}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        Reply
                      </Button>
                      {!comment.resolved && (
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          <Pin className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment or annotation..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[60px]"
                />
                <Button 
                  onClick={addComment}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Participants */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentSession.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {participant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(participant.status)}`}></div>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{participant.name}</p>
                        <p className="text-sm text-slate-500">{participant.role}</p>
                        <p className="text-xs text-slate-400">
                          {participant.status === 'online' ? 'Active now' : 
                           `Last seen ${format(participant.lastSeen, 'HH:mm')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${getStatusColor(participant.status)} text-white text-xs`}>
                        {participant.status}
                      </Badge>
                      <div className="flex gap-1">
                        {participant.permissions.includes('edit') && (
                          <Badge variant="outline" className="text-xs">Edit</Badge>
                        )}
                        {participant.permissions.includes('approve') && (
                          <Badge variant="outline" className="text-xs">Approve</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Start Video Call
                  </Button>
                  <Button variant="outline" className="flex-1 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Screen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Collaboration Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Schedule Review</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Share2 className="w-6 h-6 text-emerald-600" />
              <span className="text-sm">Share Dashboard</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Bell className="w-6 h-6 text-amber-600" />
              <span className="text-sm">Set Alerts</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Create Team</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}