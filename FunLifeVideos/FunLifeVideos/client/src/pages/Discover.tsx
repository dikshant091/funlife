import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { VideoWithUser, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User as UserIcon, Play, Video } from "lucide-react";

export default function Discover() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
  
  // Extract query parameter if it exists
  const [location] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [location]);
  
  // Video search query
  const { 
    data: videos = [], 
    isLoading: isLoadingVideos,
    refetch: refetchVideos
  } = useQuery({
    queryKey: ["/api/videos/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json() as Promise<VideoWithUser[]>;
    },
    enabled: !!searchQuery.trim(),
  });
  
  // User search query
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
    enabled: !!searchQuery.trim(),
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetchVideos();
      refetchUsers();
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
    <div className="pt-14 pb-16 px-4">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSearch} className="relative mb-4">
          <Input
            type="text"
            placeholder="Search videos or profiles"
            className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF] pr-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            size="icon" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-[#A0A0A0] hover:text-white bg-transparent hover:bg-transparent"
            type="submit"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        {!searchQuery.trim() && (
          <div className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-[#A0A0A0] mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Discover videos and creators</h3>
            <p className="text-sm text-[#A0A0A0]">Search for videos, hashtags, or users</p>
          </div>
        )}
        
        {searchQuery.trim() && (
          <Tabs defaultValue="videos" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 mb-4 bg-transparent border-b border-[#2A2A2A]">
              <TabsTrigger 
                value="videos" 
                className={`py-3 px-4 ${activeTab === "videos" 
                  ? "text-white border-b-2 border-[#8C52FF]" 
                  : "text-[#A0A0A0]"}`}
              >
                <Video className="h-4 w-4 mr-1" /> Videos
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className={`py-3 px-4 ${activeTab === "users" 
                  ? "text-white border-b-2 border-[#8C52FF]" 
                  : "text-[#A0A0A0]"}`}
              >
                <UserIcon className="h-4 w-4 mr-1" /> Users
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="mt-0">
              {isLoadingVideos ? (
                <div className="space-y-4 py-2">
                  <VideoSearchSkeleton />
                  <VideoSearchSkeleton />
                  <VideoSearchSkeleton />
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((video) => (
                    <div 
                      key={video.id} 
                      className="aspect-[9/16] relative rounded-lg overflow-hidden"
                      onClick={() => navigate(`/?video=${video.id}`)}
                    >
                      <img 
                        src={video.thumbnailUrl || "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=300&h=533"} 
                        alt="Video thumbnail" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white line-clamp-1">
                          {video.caption || `Video by @${video.user.username}`}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center">
                            <Avatar className="w-5 h-5 mr-1">
                              <AvatarImage src={video.user.profilePicture || undefined} />
                              <AvatarFallback className="text-[0.5rem]">
                                {video.user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[0.6rem] text-white/80">@{video.user.username}</span>
                          </div>
                          <div className="flex items-center text-[0.6rem]">
                            <Play className="h-2.5 w-2.5 mr-0.5 fill-white" />
                            <span>{formatCount(video.views)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#A0A0A0]">
                  <p>No videos found matching "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
              {isLoadingUsers ? (
                <div className="space-y-4 py-2">
                  <UserSearchSkeleton />
                  <UserSearchSkeleton />
                  <UserSearchSkeleton />
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center p-3 bg-[#1A1A1A] rounded-lg"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      <Avatar className="w-12 h-12 mr-3 border-2 border-[#8C52FF]">
                        <AvatarImage src={user.profilePicture || undefined} />
                        <AvatarFallback className="bg-[#2A2A2A] text-white">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">@{user.username}</h4>
                        <p className="text-sm text-[#A0A0A0]">
                          {user.displayName || "FunLife Creator"}
                        </p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] rounded-full"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#A0A0A0]">
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function VideoSearchSkeleton() {
  return (
    <div className="flex items-start space-x-3">
      <Skeleton className="w-24 h-32 rounded-md bg-[#2A2A2A]" />
      <div className="flex-1 pt-1">
        <Skeleton className="h-4 w-full mb-2 bg-[#2A2A2A]" />
        <Skeleton className="h-3 w-3/4 mb-3 bg-[#2A2A2A]" />
        <div className="flex items-center">
          <Skeleton className="w-6 h-6 rounded-full bg-[#2A2A2A] mr-2" />
          <Skeleton className="h-3 w-24 bg-[#2A2A2A]" />
        </div>
      </div>
    </div>
  );
}

function UserSearchSkeleton() {
  return (
    <div className="flex items-center p-3 bg-[#1A1A1A] rounded-lg">
      <Skeleton className="w-12 h-12 rounded-full bg-[#2A2A2A] mr-3" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2 bg-[#2A2A2A]" />
        <Skeleton className="h-3 w-24 bg-[#2A2A2A]" />
      </div>
      <Skeleton className="h-8 w-16 rounded-full bg-[#2A2A2A]" />
    </div>
  );
}
