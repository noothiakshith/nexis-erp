import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare,
  Video,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";

interface Interaction {
  id: number;
  type: string;
  subject: string;
  notes: string;
  createdBy: number;
  createdByName: string;
  createdAt: Date;
}

interface InteractionHistoryProps {
  customerId?: number;
  leadId?: number;
}

export function InteractionHistory({ customerId, leadId }: InteractionHistoryProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: "call",
    subject: "",
    notes: "",
  });

  // Mock data for now - in real implementation, fetch from API
  const interactions: Interaction[] = [
    {
      id: 1,
      type: "call",
      subject: "Initial discovery call",
      notes: "Discussed project requirements and budget. Customer interested in enterprise plan.",
      createdBy: 1,
      createdByName: "John Doe",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: "email",
      subject: "Sent proposal document",
      notes: "Shared detailed proposal with pricing breakdown and timeline.",
      createdBy: 1,
      createdByName: "John Doe",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: "meeting",
      subject: "Product demo session",
      notes: "Demonstrated key features. Customer impressed with analytics dashboard.",
      createdBy: 2,
      createdByName: "Jane Smith",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  const handleAddInteraction = () => {
    toast.success("Interaction logged successfully");
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setInteractionForm({
      type: "call",
      subject: "",
      notes: "",
    });
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-green-600" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case "video":
        return <Video className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-100 text-blue-800";
      case "email":
        return "bg-green-100 text-green-800";
      case "meeting":
        return "bg-purple-100 text-purple-800";
      case "note":
        return "bg-orange-100 text-orange-800";
      case "video":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication History
          </CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log Interaction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="flex gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                    {getAuthorInitials(interaction.createdByName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInteractionIcon(interaction.type)}
                      <h4 className="font-medium text-sm">{interaction.subject}</h4>
                      <Badge className={`${getInteractionColor(interaction.type)} text-xs`}>
                        {interaction.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {format(interaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{interaction.notes}</p>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    by {interaction.createdByName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No interactions recorded yet. Log your first interaction!</p>
          </div>
        )}

        {/* Add Interaction Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Interaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Interaction Type</Label>
                <Select
                  value={interactionForm.type}
                  onValueChange={(value) => setInteractionForm({ ...interactionForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={interactionForm.subject}
                  onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                  placeholder="Brief description of the interaction"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={interactionForm.notes}
                  onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                  placeholder="Detailed notes about the interaction..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddInteraction} 
                  disabled={!interactionForm.subject || !interactionForm.notes}
                >
                  Log Interaction
                </Button>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
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
