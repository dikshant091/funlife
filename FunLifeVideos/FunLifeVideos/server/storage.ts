import {
  users, videos, likes, comments, follows,
  type User, type InsertUser, type UpdateUser,
  type Video, type InsertVideo,
  type Like, type InsertLike,
  type Comment, type InsertComment,
  type Follow, type InsertFollow,
  type VideoWithUser, type CommentWithUser, type UserWithStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql, count, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Videos
  getVideo(id: number): Promise<Video | undefined>;
  getVideoWithDetails(id: number, userId?: number): Promise<VideoWithUser | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  getFeedVideos(limit: number, offset: number, userId?: number): Promise<VideoWithUser[]>;
  getUserVideos(userId: number): Promise<VideoWithUser[]>;
  searchVideos(query: string, userId?: number): Promise<VideoWithUser[]>;
  incrementVideoViews(id: number): Promise<void>;
  
  // Likes
  likeVideo(like: InsertLike): Promise<Like>;
  unlikeVideo(userId: number, videoId: number): Promise<void>;
  isVideoLikedByUser(userId: number, videoId: number): Promise<boolean>;
  getVideoLikes(videoId: number): Promise<number>;
  
  // Comments
  getComments(videoId: number): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<CommentWithUser>;
  
  // Follows
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: number, followedId: number): Promise<void>;
  isUserFollowing(followerId: number, followedId: number): Promise<boolean>;
  getUserWithStats(userId: number, currentUserId?: number): Promise<UserWithStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  
  private userId: number;
  private videoId: number;
  private likeId: number;
  private commentId: number;
  private followId: number;
  
  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    
    this.userId = 1;
    this.videoId = 1;
    this.likeId = 1;
    this.commentId = 1;
    this.followId = 1;
    
    // Create sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create sample users
    const user1 = this.createUser({
      username: "dancequeen",
      password: "password123",
      displayName: "Dance Queen",
      bio: "Creating fun dance videos and lifestyle content ✨ DM for collaborations!",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100",
    });
    
    const user2 = this.createUser({
      username: "skateguy",
      password: "password123",
      displayName: "Skate Guy",
      bio: "Skate or Die 🛹 Living life one trick at a time",
      profilePicture: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100",
    });
    
    const user3 = this.createUser({
      username: "chefmaria",
      password: "password123",
      displayName: "Chef Maria",
      bio: "Quick recipes for busy people 🍳 Food blogger",
      profilePicture: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=100&h=100",
    });
  }
  
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        user.username.toLowerCase().includes(lowerQuery) ||
        (user.displayName && user.displayName.toLowerCase().includes(lowerQuery))
    );
  }
  
  // Video Methods
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoId++;
    const now = new Date();
    const video: Video = { 
      ...insertVideo, 
      id, 
      createdAt: now, 
      views: 0 
    };
    this.videos.set(id, video);
    return video;
  }
  
  async getVideoWithDetails(id: number, userId?: number): Promise<VideoWithUser | undefined> {
    const video = await this.getVideo(id);
    if (!video) return undefined;
    
    const user = await this.getUser(video.userId);
    if (!user) return undefined;
    
    const likeCount = await this.getVideoLikes(id);
    const commentCount = (await this.getComments(id)).length;
    
    const isLiked = userId ? await this.isVideoLikedByUser(userId, id) : undefined;
    
    return {
      ...video,
      user,
      likeCount,
      commentCount,
      isLiked
    };
  }
  
  async getFeedVideos(limit: number, offset: number, userId?: number): Promise<VideoWithUser[]> {
    const videos = Array.from(this.videos.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    
    return Promise.all(
      videos.map(async (video) => {
        const videoWithDetails = await this.getVideoWithDetails(video.id, userId);
        return videoWithDetails!;
      })
    );
  }
  
  async getUserVideos(userId: number): Promise<VideoWithUser[]> {
    const videos = Array.from(this.videos.values())
      .filter((video) => video.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(
      videos.map(async (video) => {
        const videoWithDetails = await this.getVideoWithDetails(video.id, userId);
        return videoWithDetails!;
      })
    );
  }
  
  async searchVideos(query: string, userId?: number): Promise<VideoWithUser[]> {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    const videos = Array.from(this.videos.values())
      .filter((video) => 
        (video.caption && video.caption.toLowerCase().includes(lowerQuery)) ||
        (video.tags && video.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(
      videos.map(async (video) => {
        const videoWithDetails = await this.getVideoWithDetails(video.id, userId);
        return videoWithDetails!;
      })
    );
  }
  
  async incrementVideoViews(id: number): Promise<void> {
    const video = await this.getVideo(id);
    if (!video) return;
    
    video.views += 1;
    this.videos.set(id, video);
  }
  
  // Like Methods
  async likeVideo(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const existingLike = Array.from(this.likes.values()).find(
      (like) => like.userId === insertLike.userId && like.videoId === insertLike.videoId
    );
    
    if (existingLike) {
      return existingLike;
    }
    
    const id = this.likeId++;
    const now = new Date();
    const like: Like = { ...insertLike, id, createdAt: now };
    this.likes.set(id, like);
    return like;
  }
  
  async unlikeVideo(userId: number, videoId: number): Promise<void> {
    const likeToRemove = Array.from(this.likes.values()).find(
      (like) => like.userId === userId && like.videoId === videoId
    );
    
    if (likeToRemove) {
      this.likes.delete(likeToRemove.id);
    }
  }
  
  async isVideoLikedByUser(userId: number, videoId: number): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      (like) => like.userId === userId && like.videoId === videoId
    );
  }
  
  async getVideoLikes(videoId: number): Promise<number> {
    return Array.from(this.likes.values()).filter(
      (like) => like.videoId === videoId
    ).length;
  }
  
  // Comment Methods
  async getComments(videoId: number): Promise<CommentWithUser[]> {
    const videoComments = Array.from(this.comments.values())
      .filter((comment) => comment.videoId === videoId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(
      videoComments.map(async (comment) => {
        const user = await this.getUser(comment.userId);
        return {
          ...comment,
          user: user!,
          likeCount: 0 // For simplicity, not implementing comment likes in this MVP
        };
      })
    );
  }
  
  async createComment(insertComment: InsertComment): Promise<CommentWithUser> {
    const id = this.commentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    
    const user = await this.getUser(comment.userId);
    
    return {
      ...comment,
      user: user!,
      likeCount: 0
    };
  }
  
  // Follow Methods
  async followUser(insertFollow: InsertFollow): Promise<Follow> {
    // Check if follow already exists
    const existingFollow = Array.from(this.follows.values()).find(
      (follow) => 
        follow.followerId === insertFollow.followerId && 
        follow.followedId === insertFollow.followedId
    );
    
    if (existingFollow) {
      return existingFollow;
    }
    
    const id = this.followId++;
    const now = new Date();
    const follow: Follow = { ...insertFollow, id, createdAt: now };
    this.follows.set(id, follow);
    return follow;
  }
  
  async unfollowUser(followerId: number, followedId: number): Promise<void> {
    const followToRemove = Array.from(this.follows.values()).find(
      (follow) => follow.followerId === followerId && follow.followedId === followedId
    );
    
    if (followToRemove) {
      this.follows.delete(followToRemove.id);
    }
  }
  
  async isUserFollowing(followerId: number, followedId: number): Promise<boolean> {
    return Array.from(this.follows.values()).some(
      (follow) => follow.followerId === followerId && follow.followedId === followedId
    );
  }
  
  async getUserWithStats(userId: number, currentUserId?: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const videoCount = Array.from(this.videos.values()).filter(
      (video) => video.userId === userId
    ).length;
    
    const followerCount = Array.from(this.follows.values()).filter(
      (follow) => follow.followedId === userId
    ).length;
    
    const followingCount = Array.from(this.follows.values()).filter(
      (follow) => follow.followerId === userId
    ).length;
    
    const isFollowing = currentUserId 
      ? await this.isUserFollowing(currentUserId, userId)
      : undefined;
    
    return {
      ...user,
      videoCount,
      followerCount,
      followingCount,
      isFollowing
    };
  }
}

export class DatabaseStorage implements IStorage {
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        displayName: insertUser.displayName ?? null,
        bio: insertUser.bio ?? null,
        profilePicture: insertUser.profilePicture ?? null,
        website: insertUser.website ?? null
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        displayName: updates.displayName === undefined ? undefined : updates.displayName,
        bio: updates.bio === undefined ? undefined : updates.bio,
        profilePicture: updates.profilePicture === undefined ? undefined : updates.profilePicture,
        website: updates.website === undefined ? undefined : updates.website
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }
  
  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    
    const lowerQuery = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(users)
      .where(
        or(
          like(sql`lower(${users.username})`, lowerQuery),
          like(sql`lower(${users.displayName})`, lowerQuery)
        )
      );
  }
  
  // Video Methods
  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values({
        ...insertVideo,
        thumbnailUrl: insertVideo.thumbnailUrl ?? null,
        caption: insertVideo.caption ?? null,
        tags: insertVideo.tags ?? null
      })
      .returning();
    return video;
  }
  
  async getVideoWithDetails(id: number, userId?: number): Promise<VideoWithUser | undefined> {
    const video = await this.getVideo(id);
    if (!video) return undefined;
    
    const [user] = await db.select().from(users).where(eq(users.id, video.userId));
    if (!user) return undefined;
    
    const likeCount = await this.getVideoLikes(id);
    
    // Get comment count
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.videoId, id));
    const commentCount = commentCountResult?.count || 0;
    
    // Check if current user liked the video
    let isLiked = undefined;
    if (userId) {
      isLiked = await this.isVideoLikedByUser(userId, id);
    }
    
    return {
      ...video,
      user,
      likeCount,
      commentCount: Number(commentCount),
      isLiked
    };
  }
  
  async getFeedVideos(limit: number, offset: number, userId?: number): Promise<VideoWithUser[]> {
    const videoList = await db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);
    
    return Promise.all(
      videoList.map(video => this.getVideoWithDetails(video.id, userId))
    ).then(videos => videos.filter((v): v is VideoWithUser => v !== undefined));
  }
  
  async getUserVideos(userId: number): Promise<VideoWithUser[]> {
    const videoList = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
    
    return Promise.all(
      videoList.map(video => this.getVideoWithDetails(video.id, userId))
    ).then(videos => videos.filter((v): v is VideoWithUser => v !== undefined));
  }
  
  async searchVideos(query: string, userId?: number): Promise<VideoWithUser[]> {
    if (!query) return [];
    
    const lowerQuery = `%${query.toLowerCase()}%`;
    const videoList = await db
      .select()
      .from(videos)
      .where(like(sql`lower(${videos.caption})`, lowerQuery))
      .orderBy(desc(videos.createdAt));
    
    return Promise.all(
      videoList.map(video => this.getVideoWithDetails(video.id, userId))
    ).then(videos => videos.filter((v): v is VideoWithUser => v !== undefined));
  }
  
  async incrementVideoViews(id: number): Promise<void> {
    await db
      .update(videos)
      .set({ views: sql`${videos.views} + 1` })
      .where(eq(videos.id, id));
  }
  
  // Like Methods
  async likeVideo(insertLike: InsertLike): Promise<Like> {
    try {
      const [like] = await db
        .insert(likes)
        .values(insertLike)
        .returning();
      return like;
    } catch (error) {
      // If the like already exists, just return it
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, insertLike.userId),
            eq(likes.videoId, insertLike.videoId)
          )
        );
      
      if (existingLike) {
        return existingLike;
      }
      
      throw error;
    }
  }
  
  async unlikeVideo(userId: number, videoId: number): Promise<void> {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.videoId, videoId)
        )
      );
  }
  
  async isVideoLikedByUser(userId: number, videoId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.videoId, videoId)
        )
      );
    
    return !!like;
  }
  
  async getVideoLikes(videoId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.videoId, videoId));
    
    return Number(result?.count || 0);
  }
  
  // Comment Methods
  async getComments(videoId: number): Promise<CommentWithUser[]> {
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));
    
    return Promise.all(
      commentsList.map(async comment => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, comment.userId));
        
        return {
          ...comment,
          user: user!,
          likeCount: 0 // For simplicity, not implementing comment likes
        };
      })
    );
  }
  
  async createComment(insertComment: InsertComment): Promise<CommentWithUser> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, comment.userId));
    
    return {
      ...comment,
      user: user!,
      likeCount: 0
    };
  }
  
  // Follow Methods
  async followUser(insertFollow: InsertFollow): Promise<Follow> {
    try {
      const [follow] = await db
        .insert(follows)
        .values(insertFollow)
        .returning();
      return follow;
    } catch (error) {
      // If the follow already exists, just return it
      const [existingFollow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, insertFollow.followerId),
            eq(follows.followedId, insertFollow.followedId)
          )
        );
      
      if (existingFollow) {
        return existingFollow;
      }
      
      throw error;
    }
  }
  
  async unfollowUser(followerId: number, followedId: number): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followedId, followedId)
        )
      );
  }
  
  async isUserFollowing(followerId: number, followedId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followedId, followedId)
        )
      );
    
    return !!follow;
  }
  
  async getUserWithStats(userId: number, currentUserId?: number): Promise<UserWithStats | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Get video count
    const [videoCountResult] = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.userId, userId));
    
    // Get follower count
    const [followerCountResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followedId, userId));
    
    // Get following count
    const [followingCountResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    // Check if current user is following this user
    let isFollowing = undefined;
    if (currentUserId) {
      isFollowing = await this.isUserFollowing(currentUserId, userId);
    }
    
    return {
      ...user,
      videoCount: Number(videoCountResult?.count || 0),
      followerCount: Number(followerCountResult?.count || 0),
      followingCount: Number(followingCountResult?.count || 0),
      isFollowing
    };
  }
}

export const storage = new DatabaseStorage();
