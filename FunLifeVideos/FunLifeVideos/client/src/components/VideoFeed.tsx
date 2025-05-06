import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideoWithUser } from "@shared/schema";
import VideoPlayer from "./VideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from 'react-intersection-observer';

export default function VideoFeed() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState<VideoWithUser[]>([]);
  const [offset, setOffset] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreRef, inView } = useInView();
  
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["/api/videos/feed", offset],
    queryFn: async () => {
      const response = await fetch(`/api/videos/feed?limit=5&offset=${offset}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json() as Promise<VideoWithUser[]>;
    }
  });
  
  useEffect(() => {
    if (data && data.length > 0) {
      // Append new videos to the existing list
      setVideos(prev => [...prev, ...data]);
    }
  }, [data]);
  
  useEffect(() => {
    if (inView && !isLoading && !isFetching && data && data.length > 0) {
      // Load more when scrolling to the bottom
      setOffset(prev => prev + 5);
    }
  }, [inView, isLoading, isFetching, data]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current) return;
      
      const feedHeight = feedRef.current.clientHeight;
      const scrollTop = feedRef.current.scrollTop;
      const videoHeight = feedHeight;
      
      // Calculate which video should be active based on scroll position
      const index = Math.round(scrollTop / videoHeight);
      if (index !== activeVideoIndex && index >= 0 && index < videos.length) {
        setActiveVideoIndex(index);
      }
    };
    
    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener("scroll", handleScroll);
    }
    
    return () => {
      if (feedElement) {
        feedElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [activeVideoIndex, videos.length]);
  
  if (isLoading && videos.length === 0) {
    return (
      <div className="pt-14 pb-16">
        <div className="feed-container">
          <VideoSkeleton />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="pt-14 pb-16 flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Error Loading Videos</h3>
          <p className="text-[#A0A0A0]">Please try again later</p>
        </div>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="pt-14 pb-16 flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">No Videos Found</h3>
          <p className="text-[#A0A0A0]">Be the first to upload a video!</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="pt-14 pb-16">
      <div ref={feedRef} className="feed-container relative">
        {videos.map((video, index) => (
          <VideoPlayer 
            key={video.id} 
            video={video} 
            isActive={index === activeVideoIndex}
          />
        ))}
        
        {/* Load more indicator */}
        {(isLoading || isFetching) && videos.length > 0 && (
          <VideoSkeleton />
        )}
        
        {/* Invisible element to trigger loading more videos */}
        <div ref={loadMoreRef} className="h-10" />
      </div>
    </main>
  );
}

function VideoSkeleton() {
  return (
    <div className="video-container relative">
      <Skeleton className="w-full h-full bg-[#1A1A1A]" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-16 bg-[#2A2A2A]" />
          <Skeleton className="h-5 w-12 bg-[#2A2A2A]" />
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-10 h-10 rounded-full bg-[#2A2A2A]" />
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-[#2A2A2A]" />
              <Skeleton className="h-3 w-40 bg-[#2A2A2A]" />
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="w-10 h-14 bg-[#2A2A2A]" />
            <Skeleton className="w-10 h-14 bg-[#2A2A2A]" />
            <Skeleton className="w-10 h-14 bg-[#2A2A2A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
