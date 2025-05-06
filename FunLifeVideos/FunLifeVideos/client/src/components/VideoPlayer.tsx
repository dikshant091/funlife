import { useRef, useState, useEffect } from "react";
import { VideoWithUser } from "@shared/schema";
import { useFunLife } from "@/lib/context";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VideoActions from "./VideoActions";
import UserInfo from "./UserInfo";

interface VideoPlayerProps {
  video: VideoWithUser;
  isActive: boolean;
}

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState("00:00");
  const { currentUser } = useFunLife();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);
  
  useEffect(() => {
    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        const seconds = Math.floor(videoRef.current!.duration);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        setVideoDuration(
          `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
        );
      };
      
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
        }
      };
    }
  }, []);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };
  
  const incrementView = async () => {
    if (isActive && videoRef.current) {
      try {
        await apiRequest("GET", `/api/videos/${video.id}`);
      } catch (error) {
        console.error("Error incrementing view:", error);
      }
    }
  };
  
  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to like videos",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (video.isLiked) {
        await apiRequest("DELETE", `/api/videos/${video.id}/like`);
      } else {
        await apiRequest("POST", `/api/videos/${video.id}/like`);
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${video.id}`] });
      
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Could not process like action",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="video-container relative">
      <video
        ref={videoRef}
        className="video-player w-full h-full object-cover"
        loop
        playsInline
        onClick={togglePlayPause}
        onPlay={() => incrementView()}
        poster={video.thumbnailUrl || undefined}
      >
        <source src={video.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video Overlay */}
      <div className="video-overlay absolute inset-0 flex flex-col justify-between p-4">
        {/* Top video info */}
        <div className="flex items-start justify-between">
          <div className="bg-black bg-opacity-30 px-2 py-1 rounded-md">
            <span className="text-xs font-medium">FunLife</span>
          </div>
          <span className="text-xs bg-black bg-opacity-30 px-2 py-1 rounded-md">
            {videoDuration}
          </span>
        </div>
        
        {/* Bottom video info */}
        <div className="flex items-end justify-between">
          <UserInfo user={video.user} caption={video.caption} />
          <VideoActions 
            video={video} 
            onLike={handleLike}
          />
        </div>
      </div>
    </div>
  );
}
