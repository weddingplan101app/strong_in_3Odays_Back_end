// src/modules/admin/admin-auth.controller.ts
import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthRequest } from '../../middleware/admin-auth.middleware';
import { logger } from '../../utils/logger';

@Service()
export class AdminAuthController {
  constructor(
    @Inject() private adminAuthService: AdminAuthService
  ) {}

  /**
   * Admin login
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const result = await this.adminAuthService.login({
        username,
        password,
        ipAddress: ipAddress as string,
        userAgent
      });

      // Set refresh token as HTTP-only cookie
      if (result.refreshToken) {
        res.cookie('adminRefreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.status(200).json({
        success: true,
        data: {
          admin: result.admin,
          token: result.token,
          requiresPasswordChange: result.requiresPasswordChange,
          permissions: result.permissions
        }
      });

    } catch (error: any) {
      logger.error('Admin login failed in controller', {
        error: error.message,
        username: req.body.username
      });

      const status = error.message === 'Invalid credentials' ? 401 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  }

  /**
   * Create super admin (initial setup only)
   */
  async createSuperAdmin(req: Request, res: Response) {
    try {
      // Add environment check for extra security
      if (process.env.NODE_ENV === 'production') {
        // In production, you might want to disable this or add extra security
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${process.env.SETUP_TOKEN}`) {
          return res.status(403).json({
            success: false,
            error: 'Setup token required in production'
          });
        }
      }

      const { name, email, username, password, phone } = req.body;

      if (!name || !email || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, username, and password are required'
        });
      }

      const admin = await this.adminAuthService.createSuperAdmin({
        name,
        email,
        username,
        password,
        phone
      });

      res.status(201).json({
        success: true,
        data: admin.toJSON(),
        message: 'Super admin created successfully'
      });

    } catch (error: any) {
      logger.error('Failed to create super admin in controller', {
        error: error.message
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create super admin'
      });
    }
  }

  /**
   * Create admin (requires manage_admins permission)
   */
  async createAdmin(req: AdminAuthRequest, res: Response) {
    try {
      const creatorId = req.admin?.adminId;
      if (!creatorId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { name, email, username, password, role, permissions, department, phone } = req.body;

      if (!name || !email || !username || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, username, password, and role are required'
        });
      }

      const admin = await this.adminAuthService.createAdmin(creatorId, {
        name,
        email,
        username,
        password,
        role,
        permissions,
        department,
        phone
      });

      res.status(201).json({
        success: true,
        data: admin.toJSON(),
        message: 'Admin created successfully'
      });

    } catch (error: any) {
      logger.error('Failed to create admin in controller', {
        error: error.message,
        creatorId: req.admin?.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create admin'
      });
    }
  }

  /**
   * Get profile
   */
  async getProfile(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const profile = await this.adminAuthService.getProfile(adminId);

      res.status(200).json({
        success: true,
        data: profile
      });

    } catch (error: any) {
      logger.error('Failed to get admin profile in controller', {
        error: error.message,
        adminId: req.admin?.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get profile'
      });
    }
  }

  /**
   * Update profile
   */
  async updateProfile(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { name, phone, department, preferences } = req.body;

      const admin = await this.adminAuthService.updateProfile(adminId, {
        name,
        phone,
        department,
        preferences
      });

      res.status(200).json({
        success: true,
        data: admin.toJSON(),
        message: 'Profile updated successfully'
      });

    } catch (error: any) {
      logger.error('Failed to update admin profile in controller', {
        error: error.message,
        adminId: req.admin?.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      await this.adminAuthService.changePassword(adminId, {
        currentPassword,
        newPassword
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error: any) {
      logger.error('Failed to change password in controller', {
        error: error.message,
        adminId: req.admin?.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Reset password (super admin or self)
   */
  async resetPassword(req: AdminAuthRequest, res: Response) {
    try {
      const resetterId = req.admin?.adminId;
      const { adminId } = req.params;

      if (!resetterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await this.adminAuthService.resetPassword(resetterId, adminId);

      res.status(200).json({
        success: true,
        data: {
          temporaryPassword: result.temporaryPassword
        },
        message: 'Password reset successfully. Save this temporary password securely.'
      });

    } catch (error: any) {
      logger.error('Failed to reset password in controller', {
        error: error.message,
        resetterId: req.admin?.adminId,
        adminId: req.params.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reset password'
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.adminRefreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      const result = await this.adminAuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          token: result.token
        }
      });

    } catch (error: any) {
      logger.error('Failed to refresh token in controller', {
        error: error.message
      });

      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout
   */
  async logout(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      const token = req.headers.authorization?.replace('Bearer ', '');
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      if (adminId && token) {
        await this.adminAuthService.logout(adminId, ipAddress as string, userAgent);
      }

      // Clear refresh token cookie
      res.clearCookie('adminRefreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error: any) {
      logger.error('Failed to logout in controller', {
        error: error.message
      });

      res.status(200).json({
        success: true,
        message: 'Logged out'
      });
    }
  }

  /**
   * Verify token (check if token is valid)
   */
  async verifyToken(req: AdminAuthRequest, res: Response) {
    try {
      const admin = req.admin;

      if (!admin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          authenticated: true,
          admin: {
            adminId: admin.adminId,
            email: admin.email,
            role: admin.role,
            isSuperAdmin: admin.isSuperAdmin,
            permissions: admin.permissions
          }
        }
      });

    } catch (error: any) {
      logger.error('Failed to verify token in controller', {
        error: error.message
      });

      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }
}