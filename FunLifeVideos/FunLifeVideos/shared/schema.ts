import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  website: text("website"),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  views: integer("views").default(0).notNull(),
  duration: integer("duration").notNull(), // in seconds (max 60)
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followedId: integer("followed_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  likes: many(likes),
  comments: many(comments),
  followedBy: many(follows, { relationName: "followed" }),
  following: many(follows, { relationName: "follower" }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
  likes: many(likes),
  comments: many(comments),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  video: one(videos, { fields: [likes.videoId], references: [videos.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  video: one(videos, { fields: [comments.videoId], references: [videos.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  followed: one(users, { fields: [follows.followedId], references: [users.id], relationName: "followed" }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
  profilePicture: true,
  website: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  userId: true,
  videoUrl: true,
  thumbnailUrl: true,
  caption: true,
  tags: true,
  duration: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  videoId: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  videoId: true,
  content: true,
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followedId: true,
});

export const updateUserSchema = insertUserSchema.omit({ password: true }).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

// Extended types
export type VideoWithUser = Video & {
  user: User;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};

export type CommentWithUser = Comment & {
  user: User;
  likeCount?: number;
};

export type UserWithStats = User & {
  videoCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
};
