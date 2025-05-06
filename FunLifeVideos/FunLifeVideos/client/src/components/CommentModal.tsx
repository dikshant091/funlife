import { useState } from "react";
import { useFunLife } from "@/lib/context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CommentWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Heart, Send } from "lucide-react";
import { format } from "date-fns";

export default function CommentModal() {
  const [commentText, setCommentText] = useState("");
  const { currentUser, showCommentModal, setShowCommentModal, currentVideoForComments } = useFunLife();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/videos/${currentVideoForComments?.id}/comments`],
    queryFn: async () => {
      if (!currentVideoForComments) return [];
      const response = await fetch(`/api/videos/${currentVideoForComments.id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json() as Promise<CommentWithUser[]>;
    },
    enabled: !!currentVideoForComments,
  });
  
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser || !currentVideoForComments) throw new Error("Missing user or video");
      
      return apiRequest("POST", `/api/videos/${currentVideoForComments.id}/comments`, {
        content
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${currentVideoForComments?.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }
    
    addComment.mutate(commentText);
  };
  
  if (!showCommentModal || !currentVideoForComments) return null;
  
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-70 flex items-end justify-center animate-in fade-in">
      <div className="bg-[#0A0A0A] rounded-t-2xl w-full max-w-md max-h-[80vh] shadow-lg animate-in slide-in-from-bottom">
        <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
          <h3 className="text-lg font-semibold">Comments</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowCommentModal(false)}
            className="rounded-full hover:bg-[#2A2A2A]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <ScrollArea className="comment-section h-[50vh] p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#8C52FF]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-[#A0A0A0]">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.user.profilePicture || undefined} alt={comment.user.username} />
                  <AvatarFallback className="bg-[#2A2A2A] text-white">
                    {comment.user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-baseline space-x-2">
                    <h4 className="font-medium text-sm">@{comment.user.username}</h4>
                    <span className="text-xs text-[#A0A0A0]">
                      {format(new Date(comment.createdAt), 'MMM d')}
                    </span>
                  </div>
                  
                  <p className="text-sm mt-1">{comment.content}</p>
                  
                  <div className="flex items-center mt-2 space-x-4">
                    <button className="flex items-center space-x-1 text-xs text-[#A0A0A0]">
                      <Heart className="h-3 w-3" />
                      <span>{comment.likeCount}</span>
                    </button>
                    <button className="text-xs text-[#A0A0A0]">Reply</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        
        {/* Comment input */}
        <div className="p-4 border-t border-[#2A2A2A]">
          <form onSubmit={handleSubmitComment} className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80" alt="Your profile" />
              <AvatarFallback className="bg-[#2A2A2A] text-white">
                {currentUser ? "ME" : "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Add a comment..."
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF] pr-10"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={addComment.isPending}
              />
              <Button 
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#8C52FF] h-8 w-8 p-0"
                disabled={!commentText.trim() || addComment.isPending}
                type="submit"
              >
                {addComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
