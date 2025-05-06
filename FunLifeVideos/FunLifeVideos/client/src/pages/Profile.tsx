import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { useFunLife } from "@/lib/context";
import { UserWithStats, VideoWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Grid, Heart, Bookmark, Edit, MessageSquare } from "lucide-react";

export default function Profile() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const userId = params.id ? parseInt(params.id) : undefined;
  const { currentUser, setUserToEdit, setShowProfileEditModal } = useFunLife();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("videos");
  
  // Fetch user profile
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: [`/api/users/${userId || currentUser}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId || currentUser}`);
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json() as Promise<UserWithStats>;
    },
    enabled: !!(userId || currentUser),
  });
  
  // Fetch user videos
  const {
    data: userVideos,
    isLoading: isLoadingVideos,
    error: videosError
  } = useQuery({
    queryKey: [`/api/users/${userId || currentUser}/videos`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId || currentUser}/videos`);
      if (!response.ok) throw new Error("Failed to fetch user videos");
      return response.json() as Promise<VideoWithUser[]>;
    },
    enabled: !!(userId || currentUser),
  });
  
  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile || !currentUser) return;
      
      if (userProfile.isFollowing) {
        return apiRequest("DELETE", `/api/users/${userProfile.id}/follow`);
      } else {
        return apiRequest("POST", `/api/users/${userProfile.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId || currentUser}`] });
      
      toast({
        title: userProfile?.isFollowing 
          ? "Unfollowed successfully" 
          : "Followed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Could not process follow/unfollow action",
        variant: "destructive",
      });
    }
  });
  
  const handleFollowToggle = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    followMutation.mutate();
  };
  
  const handleEditProfile = () => {
    if (!userProfile || userProfile.id !== currentUser) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own profile",
        variant: "destructive",
      });
      return;
    }
    
    setUserToEdit(userProfile);
    setShowProfileEditModal(true);
  };
  
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  if (isLoadingProfile || (!userProfile && !profileError)) {
    return (
      <div className="pt-14 pb-16 flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8C52FF]" />
      </div>
    );
  }
  
  if (profileError || !userProfile) {
    return (
      <div className="pt-14 pb-16 flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">User Not Found</h3>
          <p className="text-[#A0A0A0]">The user you're looking for doesn't exist or has been removed</p>
          <Button 
            className="mt-4 bg-[#2A2A2A] hover:bg-[#3A3A3A]"
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = userProfile.id === currentUser;
  
  return (
    <div className="fixed inset-0 z-20 bg-[#121212] pt-14 pb-16 overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 border-4 border-[#8C52FF] mb-4">
            <AvatarImage src={userProfile.profilePicture || undefined} alt={userProfile.username} />
            <AvatarFallback className="bg-[#2A2A2A] text-white text-xl">
              {userProfile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold">@{userProfile.username}</h2>
          <p className="text-[#A0A0A0] text-sm mb-3">
            {userProfile.displayName && `${userProfile.displayName} • `}
            Content Creator
          </p>
          
          <div className="profile-stats flex space-x-6 text-center mb-4">
            <span className="px-3">
              <div className="text-lg font-bold">{formatCount(userProfile.videoCount)}</div>
              <div className="text-xs text-[#A0A0A0]">Videos</div>
            </span>
            <span className="px-3">
              <div className="text-lg font-bold">{formatCount(userProfile.followerCount)}</div>
              <div className="text-xs text-[#A0A0A0]">Followers</div>
            </span>
            <span className="px-3">
              <div className="text-lg font-bold">{formatCount(userProfile.followingCount)}</div>
              <div className="text-xs text-[#A0A0A0]">Following</div>
            </span>
          </div>
          
          {userProfile.bio && (
            <p className="text-sm text-center mb-4">{userProfile.bio}</p>
          )}
          
          <div className="flex space-x-3">
            {isOwnProfile ? (
              <Button 
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-6 py-2 rounded-full text-sm font-medium"
                onClick={handleEditProfile}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  className={userProfile.isFollowing 
                    ? "bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white" 
                    : "bg-[#8C52FF] hover:bg-[#7642E0] text-white"
                  }
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {userProfile.isFollowing ? "Following" : "Follow"}
                </Button>
                <Button 
                  className="bg-[#2A2A2A] text-white px-4 py-2 rounded-full text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Profile tabs */}
        <Tabs defaultValue="videos" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4 bg-transparent border-b border-[#2A2A2A]">
            <TabsTrigger 
              value="videos" 
              className={`py-3 px-4 ${activeTab === "videos" 
                ? "text-white border-b-2 border-[#8C52FF]" 
                : "text-[#A0A0A0]"}`}
            >
              <Grid className="h-4 w-4 mr-1" /> Videos
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className={`py-3 px-4 ${activeTab === "liked" 
                ? "text-white border-b-2 border-[#8C52FF]" 
                : "text-[#A0A0A0]"}`}
            >
              <Heart className="h-4 w-4 mr-1" /> Liked
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className={`py-3 px-4 ${activeTab === "saved" 
                ? "text-white border-b-2 border-[#8C52FF]" 
                : "text-[#A0A0A0]"}`}
            >
              <Bookmark className="h-4 w-4 mr-1" /> Saved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-0">
            {isLoadingVideos ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#8C52FF] mx-auto" />
              </div>
            ) : userVideos && userVideos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {userVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="aspect-[9/16] relative"
                    onClick={() => navigate(`/?video=${video.id}`)}
                  >
                    <img 
                      src={video.thumbnailUrl || "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=300&h=533"} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute bottom-1 left-1 flex items-center text-xs">
                      <Play className="h-3 w-3 mr-0.5 fill-white" />
                      <span>{formatCount(video.views)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[#A0A0A0]">
                <p>No videos uploaded yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="liked" className="mt-0">
            <div className="py-8 text-center text-[#A0A0A0]">
              <p>Liked videos will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-0">
            <div className="py-8 text-center text-[#A0A0A0]">
              <p>Saved videos will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
