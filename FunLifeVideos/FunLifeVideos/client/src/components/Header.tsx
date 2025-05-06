import { useLocation } from "wouter";
import BackButton from "./BackButton";

export default function Header() {
  const [location, navigate] = useLocation();
  const showBackButton = location !== "/";
  
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-[#121212] bg-opacity-90 backdrop-blur-md border-b border-[#2A2A2A]">
      <div className="flex w-full items-center justify-between max-w-md mx-auto">
        <div className="w-10">
          {showBackButton && <BackButton />}
        </div>
        
        <h1 
          className="text-xl font-bold font-poppins cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="text-white">Fun</span>
          <span className="text-[#8C52FF]">Life</span>
        </h1>
        
        {/* Empty div to balance the header */}
        <div className="w-10"></div>
      </div>
    </header>
  );
}
