import { useFunLife } from "@/lib/context";
import { VideoWithUser } from "@shared/schema";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoActionsProps {
  video: VideoWithUser;
  onLike: () => void;
}

export default function VideoActions({ video, onLike }: VideoActionsProps) {
  const { setShowCommentModal, setCurrentVideoForComments } = useFunLife();
  const { toast } = useToast();
  
  const handleLike = () => {
    onLike();
  };
  
  const handleComment = () => {
    setCurrentVideoForComments(video);
    setShowCommentModal(true);
  };
  
  const handleShare = async () => {
    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this FunLife video!',
          text: video.caption || 'Watch this awesome video on FunLife',
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Video link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        variant="ghost"
        size="icon"
        className="heart-animation flex flex-col items-center p-0 bg-transparent hover:bg-transparent"
        onClick={handleLike}
      >
        <Heart 
          className={`h-8 w-8 ${video.isLiked ? 'text-[#FF2D55] fill-[#FF2D55]' : 'text-white'}`} 
        />
        <span className="text-xs mt-1">{formatCount(video.likeCount)}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col items-center p-0 bg-transparent hover:bg-transparent"
        onClick={handleComment}
      >
        <MessageCircle className="h-8 w-8" />
        <span className="text-xs mt-1">{formatCount(video.commentCount)}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col items-center p-0 bg-transparent hover:bg-transparent"
        onClick={handleShare}
      >
        <Share2 className="h-8 w-8" />
        <span className="text-xs mt-1">Share</span>
      </Button>
    </div>
  );
}
