import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Upload, 
  File, 
  Download, 
  Trash2,
  Plus,
  FileText,
  Image,
  Archive,
  Video,
  Music,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface ProjectFile {
  id: number;
  name: string;
  type: string;
  category: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: number;
  uploaderName: string;
  createdAt: Date;
}

interface ProjectFilesProps {
  projectId: number;
}

export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState("document");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries - Using mock data for now since API endpoints are not fully implemented
  // const { data: files, refetch } = trpc.project.getFiles.useQuery({ projectId });
  const files: ProjectFile[] = [];
  const refetch = () => {};

  // Mutations - Mock implementation
  const uploadFileMutation = {
    mutate: (data: any) => {
      toast.success("File uploaded successfully");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setFileCategory("document");
    },
    isPending: false,
  };

  const deleteFileMutation = {
    mutate: (data: any) => {
      toast.success("File deleted successfully");
    },
    isPending: false,
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    // In a real implementation, you would upload to a file storage service
    // For now, we'll simulate the upload
    const mockFileUrl = `https://storage.example.com/projects/${projectId}/${uploadFile.name}`;
    const mockFileKey = `projects/${projectId}/${Date.now()}-${uploadFile.name}`;

    uploadFileMutation.mutate({
      projectId,
      name: uploadFile.name,
      type: uploadFile.type,
      category: fileCategory,
      fileSize: uploadFile.size,
      fileKey: mockFileKey,
      fileUrl: mockFileUrl,
    });
  };

  const handleDelete = (fileId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate({ fileId });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-600" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-600" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-green-600" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5 text-orange-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Project Files
          </CardTitle>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {files && files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <h4 className="font-medium text-sm">{file.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </span>
                      <span>•</span>
                      <span>by {file.uploaderName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(file.category)}>
                    {file.category}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files uploaded yet. Share documents, images, and resources!</p>
          </div>
        )}

        {/* Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="*/*"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
              </div>
              
              {uploadFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getFileIcon(uploadFile.type)}
                    <div>
                      <p className="font-medium text-sm">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uploadFile.size)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={!uploadFile || uploadFileMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadFileMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
                <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
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