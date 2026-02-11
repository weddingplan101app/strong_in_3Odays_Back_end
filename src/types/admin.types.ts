// src/types/admin.types.ts
export interface AdminPayload {
  adminId: string;          // UUID from admin.id
  email: string;
  username: string;
  role: string;             // 'super_admin', 'content_manager', etc.
  isSuperAdmin: boolean;
  permissions: string[];    // Array of permission strings
  iat?: number;             // JWT issued at timestamp
  exp?: number;             // JWT expiration timestamp
}

// Optional: Admin session/user type
export interface AdminSession {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
  profileImageUrl?: string;
  department?: string;
}

// Admin permissions enum (for type safety)
export enum AdminPermissions {
  // Content Management
  MANAGE_PROGRAMS = 'manage_programs',
  UPLOAD_CONTENT = 'upload_content',
  UPLOAD_VIDEOS = 'upload_videos',
  MANAGE_VIDEOS = 'manage_videos',
  
  // Admin Management
  MANAGE_ADMINS = 'manage_admins',
  VIEW_ADMIN_LOGS = 'view_admin_logs',
  VIEW_ADMIN_STATS = 'view_admin_stats',
  
  // User Management
  MANAGE_USERS = 'manage_users',
  VIEW_USER_STATS = 'view_user_stats',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_STATS = 'view_stats',
  
  // System
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
}

// Admin roles enum
export enum AdminRoles {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MANAGER = 'content_manager',
  VIDEO_EDITOR = 'video_editor',
  SUPPORT = 'support',
  VIEWER = 'viewer',
}