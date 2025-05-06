import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, updateUserSchema, 
  insertVideoSchema, insertCommentSchema, 
  insertLikeSchema, insertFollowSchema 
} from "@shared/schema";

// Setup multer for file uploads
const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Extract current user for authenticated routes
const getCurrentUser = async (req: Request) => {
  // For this MVP, we're using a simplified auth approach
  const userId = req.headers['x-user-id'];
  if (!userId) return null;
  
  try {
    const id = parseInt(userId as string);
    return await storage.getUser(id);
  } catch (error) {
    return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // === AUTH ROUTES ===
  
  // Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // === USER ROUTES ===
  
  // Get user profile with stats
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      const currentUser = await getCurrentUser(req);
      const currentUserId = currentUser?.id;
      
      const user = await storage.getUserWithStats(userId, currentUserId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user profile
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || currentUser.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const updates = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Search users
  app.get('/api/users/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const users = await storage.searchUsers(query);
      
      // Don't return passwords
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user videos
  app.get('/api/users/:id/videos', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const videos = await storage.getUserVideos(userId);
      
      res.status(200).json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Follow user
  app.post('/api/users/:id/follow', async (req: Request, res: Response) => {
    try {
      const followedId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      if (currentUser.id === followedId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }
      
      const followData = insertFollowSchema.parse({
        followerId: currentUser.id,
        followedId: followedId
      });
      
      await storage.followUser(followData);
      res.status(200).json({ message: 'Successfully followed user' });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Unfollow user
  app.delete('/api/users/:id/follow', async (req: Request, res: Response) => {
    try {
      const followedId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      await storage.unfollowUser(currentUser.id, followedId);
      res.status(200).json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // === VIDEO ROUTES ===
  
  // Upload video
  app.post('/api/videos', upload.single('video'), async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }
      
      // For simplicity, we're using a basic approach to get video duration
      // In a real app, you'd use ffprobe or a similar tool to get the duration
      const duration = parseInt(req.body.duration || "0");
      
      if (duration > 60) {
        return res.status(400).json({ message: 'Videos must be 60 seconds or less' });
      }
      
      const videoUrl = `/uploads/${req.file.filename}`;
      const thumbnailUrl = req.body.thumbnailUrl || null;
      
      // Process tags - extract hashtags from input
      let tags: string[] = [];
      if (req.body.tags) {
        if (typeof req.body.tags === 'string') {
          // Extract hashtags using regex or just split by spaces
          const tagsText = req.body.tags.trim();
          // First try to extract hashtags
          const hashtagMatches = tagsText.match(/#[\w\u0590-\u05ff]+/g);
          
          if (hashtagMatches && hashtagMatches.length > 0) {
            // If hashtags were found, use them
            tags = hashtagMatches;
          } else {
            // Otherwise, just split by spaces, commas or semicolons
            tags = tagsText.split(/[\s,;]+/).filter(Boolean).map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`);
          }
        } else if (Array.isArray(req.body.tags)) {
          tags = req.body.tags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`);
        }
      }
      
      console.log('Processing tags:', req.body.tags, 'Result:', tags);
      
      const videoData = insertVideoSchema.parse({
        userId: currentUser.id,
        videoUrl,
        thumbnailUrl,
        caption: req.body.caption || null,
        tags,
        duration
      });
      
      const video = await storage.createVideo(videoData);
      const videoWithDetails = await storage.getVideoWithDetails(video.id, currentUser.id);
      
      res.status(201).json(videoWithDetails);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get video feed
  app.get('/api/videos/feed', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '10');
      const offset = parseInt(req.query.offset as string || '0');
      
      const currentUser = await getCurrentUser(req);
      const currentUserId = currentUser?.id;
      
      const videos = await storage.getFeedVideos(limit, offset, currentUserId);
      
      res.status(200).json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get single video
  app.get('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      
      const currentUser = await getCurrentUser(req);
      const currentUserId = currentUser?.id;
      
      const video = await storage.getVideoWithDetails(videoId, currentUserId);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      // Increment view count
      await storage.incrementVideoViews(videoId);
      
      res.status(200).json(video);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Search videos
  app.get('/api/videos/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      
      const currentUser = await getCurrentUser(req);
      const currentUserId = currentUser?.id;
      
      const videos = await storage.searchVideos(query, currentUserId);
      
      res.status(200).json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Like video
  app.post('/api/videos/:id/like', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const likeData = insertLikeSchema.parse({
        userId: currentUser.id,
        videoId
      });
      
      await storage.likeVideo(likeData);
      
      const likeCount = await storage.getVideoLikes(videoId);
      
      res.status(200).json({ 
        message: 'Successfully liked video',
        likeCount
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Unlike video
  app.delete('/api/videos/:id/like', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      await storage.unlikeVideo(currentUser.id, videoId);
      
      const likeCount = await storage.getVideoLikes(videoId);
      
      res.status(200).json({ 
        message: 'Successfully unliked video',
        likeCount
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get video comments
  app.get('/api/videos/:id/comments', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const comments = await storage.getComments(videoId);
      
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add comment to video
  app.post('/api/videos/:id/comments', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const commentData = insertCommentSchema.parse({
        userId: currentUser.id,
        videoId,
        content: req.body.content
      });
      
      const comment = await storage.createComment(commentData);
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
