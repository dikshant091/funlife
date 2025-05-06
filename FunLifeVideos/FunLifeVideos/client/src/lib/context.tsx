import React, { createContext, useContext, useState, ReactNode } from "react";
import { VideoWithUser, CommentWithUser, UserWithStats } from "@shared/schema";

interface FunLifeContextType {
  // User state
  currentUser: number | null;
  setCurrentUser: (userId: number | null) => void;
  
  // Modals state
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  
  showCommentModal: boolean;
  setShowCommentModal: (show: boolean) => void;
  currentVideoForComments: VideoWithUser | null;
  setCurrentVideoForComments: (video: VideoWithUser | null) => void;
  
  showProfileEditModal: boolean;
  setShowProfileEditModal: (show: boolean) => void;
  userToEdit: UserWithStats | null;
  setUserToEdit: (user: UserWithStats | null) => void;
}

const FunLifeContext = createContext<FunLifeContextType | undefined>(undefined);

export function FunLifeProvider({ children }: { children: ReactNode }) {
  // User state
  const [currentUser, setCurrentUser] = useState<number | null>(1); // Using 1 for demo purposes
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentVideoForComments, setCurrentVideoForComments] = useState<VideoWithUser | null>(null);
  
  // Profile edit modal state
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithStats | null>(null);
  
  const value = {
    // User state
    currentUser,
    setCurrentUser,
    
    // Upload modal state
    showUploadModal,
    setShowUploadModal,
    
    // Comment modal state
    showCommentModal,
    setShowCommentModal,
    currentVideoForComments,
    setCurrentVideoForComments,
    
    // Profile edit modal state
    showProfileEditModal,
    setShowProfileEditModal,
    userToEdit,
    setUserToEdit,
  };
  
  return (
    <FunLifeContext.Provider value={value}>
      {children}
    </FunLifeContext.Provider>
  );
}

export function useFunLife() {
  const context = useContext(FunLifeContext);
  if (context === undefined) {
    throw new Error("useFunLife must be used within a FunLifeProvider");
  }
  return context;
}
