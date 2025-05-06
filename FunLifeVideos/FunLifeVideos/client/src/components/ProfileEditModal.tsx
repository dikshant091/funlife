import { useState, useRef } from "react";
import { useFunLife } from "@/lib/context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Camera } from "lucide-react";

export default function ProfileEditModal() {
  const { showProfileEditModal, setShowProfileEditModal, userToEdit, currentUser } = useFunLife();
  const [username, setUsername] = useState(userToEdit?.username || "");
  const [displayName, setDisplayName] = useState(userToEdit?.displayName || "");
  const [bio, setBio] = useState(userToEdit?.bio || "");
  const [website, setWebsite] = useState(userToEdit?.website || "");
  const [profilePicture, setProfilePicture] = useState(userToEdit?.profilePicture || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateProfile = useMutation({
    mutationFn: async (userData: UpdateUser) => {
      if (!userToEdit || !currentUser) return null;
      
      return apiRequest(
        "PATCH", 
        `/api/users/${userToEdit.id}`, 
        userData
      );
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userToEdit?.id}`] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      setShowProfileEditModal(false);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userToEdit || !currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to edit profile",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure we're only editing our own profile
    if (userToEdit.id !== currentUser) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own profile",
        variant: "destructive",
      });
      return;
    }
    
    const userData: UpdateUser = {
      username,
      displayName: displayName || null,
      bio: bio || null,
      website: website || null,
      profilePicture: profilePicture || null,
    };
    
    updateProfile.mutate(userData);
  };
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would upload the file to a server and get a URL back
    // For this MVP, we'll just use a placeholder
    if (e.target.files && e.target.files[0]) {
      // Replace with actual file upload logic
      setProfilePicture("https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&w=200&h=200");
      
      toast({
        title: "Profile picture updated",
        description: "In a real app, the image would be uploaded to a server",
      });
    }
  };
  
  if (!showProfileEditModal || !userToEdit) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center animate-in fade-in">
      <div className="bg-[#0A0A0A] rounded-2xl w-full max-w-md p-5 mx-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Profile</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowProfileEditModal(false)}
            disabled={isSubmitting}
            className="rounded-full hover:bg-[#2A2A2A]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profilePicture || undefined} alt={username} />
                <AvatarFallback className="bg-[#2A2A2A] text-white text-lg">
                  {username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button 
                variant="ghost"
                size="icon"
                className="absolute bottom-0 right-0 bg-[#8C52FF] p-2 rounded-full text-white hover:bg-[#7642E0]"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                disabled={isSubmitting}
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleProfilePictureChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Name</label>
              <Input
                type="text"
                value={displayName || ""}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Bio</label>
              <Textarea
                rows={3}
                value={bio || ""}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Website</label>
              <Input
                type="text"
                placeholder="Add your website..."
                value={website || ""}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-[#2A2A2A] border-0 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8C52FF]"
                disabled={isSubmitting}
              />
            </div>
            
            <Button 
              className="w-full bg-[#8C52FF] hover:bg-[#7642E0] text-white py-3 rounded-full text-sm font-medium mt-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
