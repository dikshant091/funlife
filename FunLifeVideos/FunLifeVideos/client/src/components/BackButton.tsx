import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className = "" }: BackButtonProps) {
  const [_, navigate] = useLocation();
  
  const handleBack = () => {
    // Go back to the previous page in history
    window.history.back();
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleBack}
      className={`rounded-full hover:bg-[#2A2A2A] ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
