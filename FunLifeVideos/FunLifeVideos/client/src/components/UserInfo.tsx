import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserInfoProps {
  user: User;
  caption?: string | null;
}

export default function UserInfo({ user, caption }: UserInfoProps) {
  const [_, navigate] = useLocation();
  
  const handleProfileClick = () => {
    navigate(`/profile/${user.id}`);
  };
  
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Avatar 
        className="w-10 h-10 border-2 border-[#8C52FF] cursor-pointer"
        onClick={handleProfileClick}
      >
        <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
        <AvatarFallback className="bg-[#2A2A2A] text-white">
          {getInitials(user.username)}
        </AvatarFallback>
      </Avatar>
      
      <div>
        <h4 
          className="font-medium text-sm cursor-pointer"
          onClick={handleProfileClick}
        >
          @{user.username}
        </h4>
        {caption && (
          <p className="text-xs text-[#A0A0A0]">
            {caption.length > 50 ? `${caption.substring(0, 47)}...` : caption}
          </p>
        )}
      </div>
    </div>
  );
}
