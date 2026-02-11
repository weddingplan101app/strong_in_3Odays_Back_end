// src/modules/admin/admin-auth.service.ts
import { Service } from 'typedi';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Admin } from '../../models/Admin.model';
import { AdminActivityLog } from '../../models/AdminActivityLog.model';
import { logger } from '../../utils/logger';

interface LoginCredentials {
  username: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResponse {
  admin: any;
  token: string;
  refreshToken?: string;
  requiresPasswordChange?: boolean;
  permissions: string[];
}

@Service()
export class AdminAuthService {
  private readonly JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'admin-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '8h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Log admin activity using your existing model
   */
  private async logAdminActivity(
    adminId: string,
    actionType: AdminActivityLog['actionType'],
    description: string,
    options?: {
      entityType?: string | null;
      entityId?: string | null;
      oldValues?: Record<string, any> | null;
      newValues?: Record<string, any> | null;
      metadata?: Record<string, any> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      wasSuccessful?: boolean;
      errorMessage?: string | null;
    }
  ): Promise<AdminActivityLog> {
    try {
      return await AdminActivityLog.logAction(
        adminId,
        actionType,
        description,
        options?.entityType || null,
        options?.entityId || null,
        options?.oldValues || null,
        options?.newValues || null,
        options?.ipAddress || null,
        options?.userAgent || null,
        options?.wasSuccessful !== undefined ? options.wasSuccessful : true,
        options?.errorMessage || null,
        options?.metadata || null
      );
    } catch (error) {
      logger.error('Failed to log admin activity', {
        error: (error as Error).message,
        adminId,
        actionType,
        description
      });
      throw error;
    }
  }

  /**
   * Admin login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { username, password, ipAddress = '0.0.0.0', userAgent = '' } = credentials;

      logger.info('Admin login attempt', { username, ipAddress });

      // Find admin by username or email
      const admin = await Admin.findOne({
        where: {
          [Op.or]: [
            { username },
            { email: username }
          ],
          isActive: true
        }
      });

      if (!admin) {
        // Log failed login attempt
        await this.logAdminActivity(
          'system', // system ID for non-admin actions
          'login',
          `Failed login attempt for username: ${username}`,
          {
            ipAddress,
            userAgent,
            wasSuccessful: false,
            errorMessage: 'Admin not found or inactive',
            metadata: { username }
          }
        );
        
        logger.warn('Admin login failed: Admin not found or inactive', { username });
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (admin.isLocked()) {
        await this.logAdminActivity(
          admin.id,
          'login',
          'Login failed - Account locked',
          {
            ipAddress,
            userAgent,
            entityType: 'admin',
            entityId: admin.id,
            wasSuccessful: false,
            errorMessage: 'Account locked',
            metadata: {
              lockedUntil: admin.lockedUntil,
              failedAttempts: admin.failedLoginAttempts
            }
          }
        );
        
        logger.warn('Admin login failed: Account locked', { 
          adminId: admin.id, 
          lockedUntil: admin.lockedUntil 
        });
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Verify password
      const isValidPassword = await admin.verifyPassword(password);
      if (!isValidPassword) {
        // Record failed attempt
        admin.recordFailedLoginAttempt();
        await admin.save();

        // Log failed attempt
        await this.logAdminActivity(
          admin.id,
          'login',
          'Login failed - Invalid password',
          {
            ipAddress,
            userAgent,
            entityType: 'admin',
            entityId: admin.id,
            wasSuccessful: false,
            errorMessage: 'Invalid password',
            metadata: {
              failedAttempts: admin.failedLoginAttempts
            }
          }
        );

        logger.warn('Admin login failed: Invalid password', { 
          adminId: admin.id, 
          failedAttempts: admin.failedLoginAttempts 
        });

        throw new Error('Invalid credentials');
      }

      // Record successful login
      admin.recordSuccessfulLogin(ipAddress);
      await admin.save();

      // Generate tokens
      const token = this.generateToken(admin);
      const refreshToken = this.generateRefreshToken(admin);

      // Log successful login
      await this.logAdminActivity(
        admin.id,
        'login',
        'Successfully logged into admin dashboard',
        {
          ipAddress,
          userAgent,
          entityType: 'admin',
          entityId: admin.id,
          wasSuccessful: true,
          metadata: {
            loginMethod: 'password',
            role: admin.role,
            permissions: admin.permissions
          }
        }
      );

      logger.info('Admin login successful', { 
        adminId: admin.id, 
        role: admin.role,
        permissions: admin.permissions.length 
      });

      // Return safe admin data
      const safeAdmin = admin.toJSON();
      
      return {
        admin: safeAdmin,
        token,
        refreshToken,
        requiresPasswordChange: admin.forcePasswordChange,
        permissions: admin.permissions
      };

    } catch (error: any) {
      logger.error('Admin login failed', {
        error: error.message,
        username: credentials.username
      });
      throw error;
    }
  }

  /**
   * Create super admin (for initial setup)
   */
  async createSuperAdmin(data: {
    name: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
  }): Promise<Admin> {
    try {
      logger.info('Creating super admin', { email: data.email });

      // Check if super admin already exists
      const existingSuperAdmin = await Admin.findOne({
        where: { isSuperAdmin: true }
      });

      if (existingSuperAdmin) {
        throw new Error('Super admin already exists');
      }

      // Check if username or email already exists
      const existingAdmin = await Admin.findOne({
        where: {
          [Op.or]: [
            { email: data.email },
            { username: data.username }
          ]
        }
      });

      if (existingAdmin) {
        throw new Error('Admin with this email or username already exists');
      }

      // Create super admin
      const admin = await Admin.create({
        ...data,
        role: 'super_admin',
        isSuperAdmin: true,
        permissions: [
          'manage_admins',
          'manage_programs',
          'upload_videos',
          'edit_content',
          'view_analytics',
          'manage_subscriptions',
          'manage_users'
        ],
        isActive: true
      });

      // Log activity - using the new admin's ID
      await this.logAdminActivity(
        admin.id, // Use new admin's ID
        'create',
        'Super admin account created during initial setup',
        {
          entityType: 'admin',
          entityId: admin.id,
          wasSuccessful: true,
          metadata: {
            type: 'super_admin',
            permissions: admin.permissions,
            createdBy: 'system'
          }
        }
      );

      logger.info('Super admin created successfully', { 
        adminId: admin.id,
        email: admin.email 
      });

      return admin;

    } catch (error: any) {
      logger.error('Failed to create super admin', {
        error: error.message,
        email: data.email
      });
      throw error;
    }
  }

  /**
   * Create admin directly
   */
  async createAdmin(creatorId: string, data: {
    name: string;
    email: string;
    username: string;
    password: string;
    role: string;
    permissions?: string[];
    department?: string;
    phone?: string;
  }): Promise<Admin> {
    try {
      const creator = await Admin.findByPk(creatorId);
      if (!creator) {
        throw new Error('Creator admin not found');
      }

      // Check permissions
      if (!creator.hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions to create admins');
      }

      // Check if username or email already exists
      const existingAdmin = await Admin.findOne({
        where: {
          [Op.or]: [
            { email: data.email },
            { username: data.username }
          ]
        }
      });

      if (existingAdmin) {
        throw new Error('Admin with this email or username already exists');
      }

      // Validate role
      const validRoles = ['super_admin', 'content_manager', 'video_editor', 'support', 'viewer'];
      if (!validRoles.includes(data.role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Only super admin can create super admin
      if (data.role === 'super_admin' && !creator.isSuperAdmin) {
        throw new Error('Only super admin can create super admin');
      }

      // Create admin
      const admin = await Admin.create({
        ...data,
        isActive: true
      });

      // Log activity - creator is performing the action
      await this.logAdminActivity(
        creatorId,
        'create',
        `Created new admin account: ${data.email}`,
        {
          entityType: 'admin',
          entityId: admin.id,
          wasSuccessful: true,
          metadata: {
            createdAdminId: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            creatorId: creatorId,
            creatorEmail: creator.email
          }
        }
      );

      logger.info('Admin created', {
        creatorId,
        adminId: admin.id,
        role: admin.role
      });

      return admin;

    } catch (error: any) {
      logger.error('Failed to create admin', {
        error: error.message,
        creatorId,
        email: data.email
      });
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(adminId: string, data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    try {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current password
      const isValid = await admin.verifyPassword(data.currentPassword);
      if (!isValid) {
        await this.logAdminActivity(
          adminId,
          'update',
          'Password change failed - Incorrect current password',
          {
            entityType: 'admin',
            entityId: adminId,
            wasSuccessful: false,
            errorMessage: 'Current password incorrect'
          }
        );
        
        throw new Error('Current password is incorrect');
      }

      // Update password
      admin.password = data.newPassword;
      await admin.save();

      // Log activity
      await this.logAdminActivity(
        adminId,
        'update',
        'Password changed successfully',
        {
          entityType: 'admin',
          entityId: adminId,
          wasSuccessful: true,
          metadata: {
            changedAt: new Date().toISOString(),
            forcePasswordChange: admin.forcePasswordChange
          }
        }
      );

      logger.info('Admin password changed', { adminId });

    } catch (error: any) {
      logger.error('Failed to change password', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  /**
   * Reset password (manual, returns temporary password)
   */
  async resetPassword(resetterId: string, adminId: string): Promise<{ temporaryPassword: string }> {
    try {
      const resetter = await Admin.findByPk(resetterId);
      const admin = await Admin.findByPk(adminId);

      if (!resetter || !admin) {
        throw new Error('Admin not found');
      }

      // Only super admin can reset other admin passwords
      if (!resetter.isSuperAdmin && resetterId !== adminId) {
        throw new Error('Only super admin can reset other admin passwords');
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      admin.password = temporaryPassword;
      admin.forcePasswordChange = true;
      await admin.save();

      // Log activity
      await this.logAdminActivity(
        resetterId,
        'update',
        `Reset password for admin: ${admin.email}`,
        {
          entityType: 'admin',
          entityId: admin.id,
          wasSuccessful: true,
          metadata: {
            resetAdminId: admin.id,
            resetAdminEmail: admin.email,
            forcedChange: true,
            resetBy: resetterId,
            resetByEmail: resetter.email
          }
        }
      );

      logger.info('Admin password reset', {
        resetterId,
        adminId
      });

      return { temporaryPassword };

    } catch (error: any) {
      logger.error('Failed to reset password', {
        error: error.message,
        resetterId,
        adminId
      });
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      const admin = await Admin.findByPk(decoded.adminId);
      if (!admin || !admin.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const token = this.generateToken(admin);

      // Log activity
      await this.logAdminActivity(
        admin.id,
        'system_action',
        'Authentication token refreshed',
        {
          entityType: 'admin',
          entityId: admin.id,
          wasSuccessful: true,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      );

      logger.info('Token refreshed', { adminId: admin.id });

      return { token };

    } catch (error: any) {
      logger.error('Failed to refresh token', { error: error.message });
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout
   */
  async logout(adminId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Log the activity
      await this.logAdminActivity(
        adminId,
        'logout',
        'Logged out of admin dashboard',
        {
          ipAddress,
          userAgent,
          entityType: 'admin',
          entityId: adminId,
          wasSuccessful: true,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      );

      logger.info('Admin logged out', { adminId });

    } catch (error: any) {
      logger.error('Failed to log logout', {
        error: error.message,
        adminId
      });
      // Don't throw - logout should always succeed
    }
  }

  /**
   * Get admin profile
   */
  async getProfile(adminId: string): Promise<any> {
    try {
      const admin = await Admin.findByPk(adminId, {
        attributes: { 
          exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] 
        }
      });

      if (!admin) {
        throw new Error('Admin not found');
      }

      // Log profile view (optional - you can comment this out if you don't want to log profile views)
      await this.logAdminActivity(
        adminId,
        'system_action',
        'Viewed admin profile',
        {
          entityType: 'admin',
          entityId: adminId,
          wasSuccessful: true,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      );

      return admin;

    } catch (error: any) {
      logger.error('Failed to get admin profile', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  /**
   * Update admin profile
   */
  async updateProfile(adminId: string, data: {
    name?: string;
    phone?: string;
    department?: string;
    preferences?: Record<string, any>;
  }): Promise<Admin> {
    try {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Get old values for logging
      const oldValues = {
        name: admin.name,
        phone: admin.phone,
        department: admin.department,
        preferences: admin.preferences
      };

      // Update fields
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.phone) updateData.phone = data.phone;
      if (data.department) updateData.department = data.department;
      if (data.preferences) updateData.preferences = data.preferences;

      await admin.update(updateData);

      // Get new values
      await admin.reload();
      const newValues = {
        name: admin.name,
        phone: admin.phone,
        department: admin.department,
        preferences: admin.preferences
      };

      // Log activity
      await this.logAdminActivity(
        adminId,
        'update',
        'Updated admin profile information',
        {
          entityType: 'admin',
          entityId: adminId,
          oldValues,
          newValues,
          wasSuccessful: true,
          metadata: {
            updatedFields: Object.keys(data),
            timestamp: new Date().toISOString()
          }
        }
      );

      logger.info('Admin profile updated', { adminId });

      return admin;

    } catch (error: any) {
      logger.error('Failed to update admin profile', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  /**
   * Helper: Generate JWT token
   */
  private generateToken(admin: Admin): string {
    return jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        isSuperAdmin: admin.isSuperAdmin,
        permissions: admin.permissions
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Helper: Generate refresh token
   */
  private generateRefreshToken(admin: Admin): string {
    return jwt.sign(
      {
        adminId: admin.id,
        type: 'refresh'
      },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  /**
   * Helper: Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

    async getAdminProfile(adminId: string): Promise<Admin> {
    try {
      const admin = await Admin.findByPk(adminId, {
        attributes: { 
          exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] 
        }
      });

      if (!admin) {
        throw new Error('Admin not found');
      }

      return admin;
    } catch (error: any) {
      logger.error('Failed to get admin profile', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

   /**
   * Get admin by ID (for admin management)
   */
  async getAdminById(requesterId: string, adminId: string): Promise<Admin> {
    try {
      const requester = await Admin.findByPk(requesterId);
      if (!requester) {
        throw new Error('Requester admin not found');
      }

      // Check permissions
      if (!requester.hasPermission('manage_admins') && requesterId !== adminId) {
        throw new Error('Insufficient permissions to view other admins');
      }

      const admin = await Admin.findByPk(adminId, {
        attributes: { 
          exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] 
        }
      });

      if (!admin) {
        throw new Error('Admin not found');
      }

      return admin;
    } catch (error: any) {
      logger.error('Failed to get admin by ID', {
        error: error.message,
        requesterId,
        adminId
      });
      throw error;
    }
  }


}