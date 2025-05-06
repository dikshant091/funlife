import { useState, useRef, ChangeEvent } from "react";
import { useFunLife } from "@/lib/context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { X, Upload, CloudOff } from "lucide-react";

export default function UploadModal() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { showUploadModal, setShowUploadModal, currentUser } = useFunLife();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const uploadVideo = useMutation({
    mutationFn: async () => {
      if (!file || !currentUser) return;
      
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption);
      formData.append("tags", tags);
      
      // For simplicity, using a fixed duration or getting it from the file name
      // In a real app, you'd use the HTML5 Video API to get the duration
      const duration = 30; // Assume 30 seconds
      formData.append("duration", duration.toString());
      
      // Track upload progress
      const xhr = new XMLHttpRequest();
      
      // Create a promise that resolves when the upload is complete
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("POST", "/api/videos");
        
        // Set the user ID header for authentication
        xhr.setRequestHeader("x-user-id", currentUser.toString());
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            console.error("Upload error:", xhr.responseText);
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };
        
        xhr.send(formData);
      });
      
      return uploadPromise;
    },
    onMutate: () => {
      setIsUploading(true);
      setUploadProgress(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser}/videos`] });
      
      toast({
        title: "Upload complete!",
        description: "Your video has been uploaded successfully",
      });
      
      resetForm();
      setShowUploadModal(false);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error 
          ? error.message
          : "There was a problem uploading your video. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Check if file is a video
    if (!selectedFile.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a video file under 50MB",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Create a preview URL for the video
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if file is a video
      if (!droppedFile.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please drop a video file",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (50MB limit)
      if (droppedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file under 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
      
      // Create a preview URL for the video
      const previewUrl = URL.createObjectURL(droppedFile);
      setPreview(previewUrl);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setTags("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No video selected",
        description: "Please select a video to upload",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive",
      });
      return;
    }
    
    uploadVideo.mutate();
  };
  
  if (!showUploadModal) return null;
  
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center animate-in fade-in">
      <div className="bg-[#0A0A0A] rounded-2xl w-full max-w-md p-5 mx-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Video</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowUploadModal(false)}
            disabled={isUploading}
            className="rounded-full hover:bg-[#2A2A2A]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {!file ? (
            <div 
              className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 mb-4 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-12 w-12 text-[#8C52FF] mx-auto mb-2" />
              <h4 className="text-lg font-medium mb-2">Drag and drop your video</h4>
              <p className="text-sm text-[#A0A0A0] mb-4">Or click to select a file (max 60 seconds)</p>
              <Button 
                className="bg-[#8C52FF] hover:bg-[#7642E0] text-white px-6 py-2 rounded-full text-sm font-medium"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Select File
              </Button>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="relative aspect-[9/16] bg-[#1A1A1A] rounded-lg overflow-hidden mb-4">
                {preview && (
                  <video 
                    src={preview} 
                    className="w-full h-full object-contain" 
                    controls
                  />
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  type="button"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-[#A0A0A0] mb-2 truncate">
                {file.name}
              </p>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#A0A0A0] mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 bg-[#2A2A2A]" />
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Caption</label>
              <Textarea
                placeholder="Add a caption to your video..."
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isUploading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Tags</label>
              <Input
                type="text"
                placeholder="#funlife #trending"
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isUploading}
              />
            </div>
            
            <Button 
              className="w-full bg-[#8C52FF] hover:bg-[#7642E0] text-white py-3 rounded-full text-sm font-medium mt-2"
              type="submit"
              disabled={!file || isUploading}
            >
              {isUploading ? "Uploading..." : "Post Video"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
