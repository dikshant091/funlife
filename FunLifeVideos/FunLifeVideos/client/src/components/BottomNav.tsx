import { useLocation, Link } from "wouter";
import { Home, Compass, Bell, User, PlusCircle } from "lucide-react";
import { useFunLife } from "@/lib/context";

export default function BottomNav() {
  const [location] = useLocation();
  const { setShowUploadModal } = useFunLife();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A] border-t border-[#2A2A2A]">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto relative">
        {/* Home */}
        <div className="flex justify-center">
          <Link href="/">
            <div className={`flex flex-col items-center py-1 cursor-pointer ${isActive("/") ? "text-white" : "text-[#A0A0A0]"}`}>
              <Home className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
        </div>
        
        {/* Discover */}
        <div className="flex justify-center">
          <Link href="/discover">
            <div className={`flex flex-col items-center py-1 cursor-pointer ${isActive("/discover") ? "text-white" : "text-[#A0A0A0]"}`}>
              <Compass className="h-6 w-6" />
              <span className="text-xs mt-1">Discover</span>
            </div>
          </Link>
        </div>
        
        {/* Upload Button */}
        <div className="flex justify-center relative">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center justify-center absolute -top-4"
          >
            <div className="bg-[#8C52FF] p-3 rounded-full shadow-lg">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs mt-1 text-white">Upload</span>
          </button>
        </div>
        
        {/* Inbox */}
        <div className="flex justify-center">
          <Link href="/inbox">
            <div className={`flex flex-col items-center py-1 cursor-pointer ${isActive("/inbox") ? "text-white" : "text-[#A0A0A0]"}`}>
              <Bell className="h-6 w-6" />
              <span className="text-xs mt-1">Inbox</span>
            </div>
          </Link>
        </div>
        
        {/* Profile */}
        <div className="flex justify-center">
          <Link href="/profile">
            <div className={`flex flex-col items-center py-1 cursor-pointer ${isActive("/profile") ? "text-white" : "text-[#A0A0A0]"}`}>
              <User className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}


