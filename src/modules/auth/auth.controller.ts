// src/services/auth.controller.ts
import { Request, Response } from 'express';
import { Service } from 'typedi';
import { AuthService } from './auth.service';
import { logger } from '../../utils/logger';

@Service()
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login with phone number
   */
  async login(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.login(phone, ipAddress as string, userAgent);

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      
      if (error.name === 'NotFoundException') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.name === 'ForbiddenException') {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Login failed ' + error.message
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const profile = await this.authService.getProfile(userId);

      return res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);
      
      if (error.name === 'NotFoundException') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const updateData = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const updatedProfile = await this.authService.updateProfile(
        userId, 
        updateData, 
        ipAddress as string, 
        userAgent
      );

      return res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      
      if (error.name === 'NotFoundException') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await this.authService.logout(userId, ipAddress as string, userAgent);

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const tokens = await this.authService.refreshToken(refreshToken, ipAddress as string, userAgent);

      return res.json({
        success: true,
        data: tokens
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      
      if (error.name === 'UnauthorizedException') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh token ' + error.message
      });
    }
  }

  /**
   * Check if phone number exists
   */
  async checkPhoneExists(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const result = await this.authService.checkPhoneExists(phone);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Check phone exists error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check phone number'
      });
    }
  }

  /**
   * Record user workout
   */
  async recordWorkout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { minutes } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid minutes are required'
        });
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.recordWorkout(userId, minutes, ipAddress as string, userAgent);

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Record workout error:', error);
      
      if (error.name === 'NotFoundException') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to record workout'
      });
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { limit = 50, offset = 0 } = req.query;

      const logs = await this.authService.getUserActivityLogs(
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      return res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      logger.error('Get activity logs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get activity logs'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response) {
    return res.json({
      success: true,
      message: 'Auth service is running',
      timestamp: new Date().toISOString()
    });
  }
}