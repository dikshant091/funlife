import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Discover from "@/pages/Discover";
import Inbox from "@/pages/Inbox";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { useFunLife } from "@/lib/context";
import UploadModal from "@/components/UploadModal";
import CommentModal from "@/components/CommentModal";
import ProfileEditModal from "@/components/ProfileEditModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile/:id?" component={Profile} />
      <Route path="/discover" component={Discover} />
      <Route path="/inbox" component={Inbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { 
    showUploadModal, 
    showCommentModal, 
    showProfileEditModal 
  } = useFunLife();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative h-screen overflow-hidden">
          <Header />
          <Router />
          <BottomNav />
          
          {/* Modals */}
          {showUploadModal && <UploadModal />}
          {showCommentModal && <CommentModal />}
          {showProfileEditModal && <ProfileEditModal />}
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
