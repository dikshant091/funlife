import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";

// For this MVP, we'll create a UI-only version of the Inbox
// In a real application, this would fetch actual notifications and messages

interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "mention";
  username: string;
  profilePicture?: string;
  content: string;
  time: string;
  isRead: boolean;
}

interface Message {
  id: number;
  username: string;
  profilePicture?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export default function Inbox() {
  const [activeTab, setActiveTab] = useState("notifications");
  
  // Notification examples for UI
  const notifications: Notification[] = [
    {
      id: 1,
      type: "like",
      username: "dancequeen",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100",
      content: "liked your video",
      time: "2h ago",
      isRead: false
    },
    {
      id: 2,
      type: "comment",
      username: "skateguy",
      profilePicture: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100",
      content: "commented: \"Amazing moves! How did you learn that?\"",
      time: "4h ago",
      isRead: false
    },
    {
      id: 3,
      type: "follow",
      username: "chefmaria",
      profilePicture: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=100&h=100",
      content: "started following you",
      time: "1d ago",
      isRead: true
    },
    {
      id: 4,
      type: "mention",
      username: "travelblog",
      content: "mentioned you in a comment",
      time: "2d ago",
      isRead: true
    }
  ];
  
  // Message examples for UI
  const messages: Message[] = [
    {
      id: 1,
      username: "dancequeen",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100",
      lastMessage: "Hey! Love your content. Want to collab on a video?",
      time: "12:42 PM",
      unreadCount: 2
    },
    {
      id: 2,
      username: "skateguy",
      profilePicture: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100",
      lastMessage: "Thanks for the follow back!",
      time: "Yesterday",
      unreadCount: 0
    },
    {
      id: 3,
      username: "chefmaria",
      profilePicture: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=100&h=100",
      lastMessage: "I'll send you the recipe later today",
      time: "2d ago",
      unreadCount: 0
    }
  ];
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-[#FF2D55]" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-[#00F2EA]" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-[#8C52FF]" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-[#00F2EA]" />;
      default:
        return <Bell className="h-5 w-5 text-[#A0A0A0]" />;
    }
  };
  
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="pt-14 pb-16 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">Inbox</h1>
        
        <Tabs defaultValue="notifications" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4 bg-transparent border-b border-[#2A2A2A]">
            <TabsTrigger 
              value="notifications" 
              className={`py-3 px-4 ${activeTab === "notifications" 
                ? "text-white border-b-2 border-[#8C52FF]" 
                : "text-[#A0A0A0]"}`}
            >
              <Bell className="h-4 w-4 mr-1" /> Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className={`py-3 px-4 ${activeTab === "messages" 
                ? "text-white border-b-2 border-[#8C52FF]" 
                : "text-[#A0A0A0]"}`}
            >
              <MessageCircle className="h-4 w-4 mr-1" /> Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="mt-0">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-center p-3 rounded-lg ${notification.isRead ? 'bg-transparent' : 'bg-[#1A1A1A]'}`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 mr-3">
                        <AvatarImage src={notification.profilePicture} />
                        <AvatarFallback className="bg-[#2A2A2A] text-white">
                          {getInitials(notification.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -right-1 bottom-0 p-1 rounded-full bg-[#121212]">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="flex items-baseline">
                        <h4 className="font-medium">@{notification.username}</h4>
                        <span className="text-xs text-[#A0A0A0] ml-2">{notification.time}</span>
                      </div>
                      <p className="text-sm text-[#A0A0A0]">{notification.content}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#8C52FF]"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-[#A0A0A0] mb-3 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No notifications yet</h3>
                <p className="text-sm text-[#A0A0A0]">When you get notifications, they'll show up here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="mt-0">
            {messages.length > 0 ? (
              <div className="space-y-1">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex items-center p-3 rounded-lg ${message.unreadCount > 0 ? 'bg-[#1A1A1A]' : 'bg-transparent'}`}
                  >
                    <Avatar className="w-12 h-12 mr-3 border-2 border-[#8C52FF]">
                      <AvatarImage src={message.profilePicture} />
                      <AvatarFallback className="bg-[#2A2A2A] text-white">
                        {getInitials(message.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <h4 className="font-medium">@{message.username}</h4>
                        <span className="text-xs text-[#A0A0A0]">{message.time}</span>
                      </div>
                      <p className="text-sm text-[#A0A0A0] truncate pr-6">{message.lastMessage}</p>
                    </div>
                    {message.unreadCount > 0 && (
                      <div className="min-w-5 h-5 rounded-full bg-[#8C52FF] flex items-center justify-center text-xs font-semibold">
                        {message.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-[#A0A0A0] mb-3 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                <p className="text-sm text-[#A0A0A0]">When you receive messages, they'll show up here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
