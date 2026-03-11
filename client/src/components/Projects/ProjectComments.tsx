import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Send, 
  Reply,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: Date;
  parentId?: number;
  replies?: Comment[];
}

interface ProjectCommentsProps {
  projectId: number;
}

export function ProjectComments({ projectId }: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Queries - Using mock data for now since API endpoints are not fully implemented
  // const { data: comments, refetch } = trpc.project.getComments.useQuery({ projectId });
  const comments: Comment[] = [];
  const refetch = () => {};

  // Mutations - Mock implementation
  const addCommentMutation = {
    mutate: (data: any) => {
      toast.success("Comment added successfully");
      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
    },
    isPending: false,
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      projectId,
      content: newComment,
      parentId: undefined,
    });
  };

  const handleAddReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    
    addCommentMutation.mutate({
      projectId,
      content: replyContent,
      parentId,
    });
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-2' : 'mb-4'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
            {getAuthorInitials(comment.authorName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
          
          {!isReply && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs h-6 px-2"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          )}
          
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyContent.trim() || addCommentMutation.isPending}
                  className="h-8"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Project Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new comment */}
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, updates, or questions..."
                className="min-h-[80px]"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="self-end"
              >
                <Send className="h-4 w-4 mr-2" />
                {addCommentMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            (comments as Comment[]).map(comment => renderComment(comment))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}