// modules/user/user-dashboard.controller.ts
import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import { UserDashboardService } from './user-dashboard.service';
import { logger } from '../../utils/logger';

// Extend the existing AuthRequest interface
export interface AuthRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    phone: string;
    email?: string;
    name?: string;
    phoneFormatted: string;
    subscriptionStatus: string;
    subscriptionPlan?: string;
    subscriptionEndDate?: Date | null;
    dailyStreak: number;
    lastWorkoutDate?: Date | null;
    totalWorkouts: number;
    totalMinutes: number;
    genderPreference: 'male' | 'female' | 'both';
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    equipmentAvailable: boolean;
    hasCompletedWelcomeVideo: boolean;
    timezone: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
  };
   body: ReqBody;
  
  query: ReqQuery;
}

@Service()
export class UserDashboardController {
  constructor(
    @Inject() private dashboardService: UserDashboardService
  ) {}

  /**
   * GET /dashboard/overview
   * Get complete user dashboard overview (main dashboard)
   */
  async getDashboardOverview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching user dashboard overview', { userId });

      const dashboardData = await this.dashboardService.getUserDashboard(userId);
      
      return res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get dashboard overview', {
        error: error.message,
        userId: req.user?.id
      });
      
      const statusCode = error.message === 'User not found' ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch dashboard data'
      });
    }
  }

  /**
   * GET /dashboard/progress/weekly
   * Get user's weekly progress chart data
   */
  async getWeeklyProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching weekly progress', { userId });

      const progressData = await this.dashboardService.getWeeklyProgress(userId);
      
      return res.status(200).json({
        success: true,
        data: progressData
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get weekly progress', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch weekly progress'
      });
    }
  }

  /**
   * GET /dashboard/achievements
   * Get user achievements and badges
   */
  async getUserAchievements(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching user achievements', { userId });

      const achievements = await this.dashboardService.getUserAchievements(userId);
      
      return res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get user achievements', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch achievements'
      });
    }
  }

  /**
   * POST /dashboard/streak/update
   * Update user's streak (called when workout is completed)
   */
  async updateUserStreak(req: AuthRequest<{}, {}, { timeSpent?: number }>, res: Response) {
    try {
      const userId = req.user?.id;
      const { timeSpent = 0 } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Updating user streak', { userId, timeSpent });

      await this.dashboardService.updateUserStreak(userId, timeSpent);
      
      return res.status(200).json({
        success: true,
        message: 'Streak updated successfully'
      });
    } catch (error: any) {
      logger.error('Controller: Failed to update user streak', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update streak'
      });
    }
  }

  /**
   * GET /dashboard/subscription/status
   * Get user's subscription status
   */
  async getSubscriptionStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching subscription status', { userId });

      const subscriptionStatus = await this.dashboardService.checkSubscriptionStatus(userId);
      
      return res.status(200).json({
        success: true,
        data: subscriptionStatus
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get subscription status', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch subscription status'
      });
    }
  }

  /**
   * GET /dashboard/stats/summary
   * Get user stats summary (quick stats without full dashboard)
   */
  async getUserStatsSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching user stats summary', { userId });

      const dashboardData = await this.dashboardService.getUserDashboard(userId);
      
      // Extract just the stats for a lighter response
      const statsSummary = {
        user: dashboardData.user,
        stats: dashboardData.stats,
        currentProgram: dashboardData.currentProgram,
        subscription: dashboardData.subscription
      };
      
      return res.status(200).json({
        success: true,
        data: statsSummary
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get user stats summary', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stats summary'
      });
    }
  }

  /**
   * GET /dashboard/continue-watching
   * Get the next video the user should watch
   */
  async getContinueWatchingVideo(req: AuthRequest, res: Response) { 
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching continue watching video', { userId });

      const continueWatching = await this.dashboardService.getContinueWatchingForUser(userId);
      
      return res.status(200).json({
        success: true,
        data: continueWatching
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get continue watching video', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch continue watching video'
      });
    }
  }

  /**
   * GET /dashboard/recommended-workouts
   * Get recommended workouts for the user
   */
  async getUserRecommendedWorkouts(req: AuthRequest, res: Response) { 
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching recommended workouts', { userId });

      const recommendedWorkouts = await this.dashboardService.getRecommendedWorkouts(userId);
      
      return res.status(200).json({
        success: true,
        data: recommendedWorkouts
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get recommended workouts', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch recommended workouts'
      });
    }
  }

  /**
   * GET /dashboard/programs/completed
   * Get user's completed programs
   */
  async getUserCompletedPrograms(req: AuthRequest, res: Response) {  
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching completed programs', { userId });

      const completedPrograms = await this.dashboardService.getCompletedPrograms(userId);
      
      return res.status(200).json({
        success: true,
        data: completedPrograms
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get completed programs', {
        error: error.message,
        userId: req.user?.id
      });
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch completed programs'
      });
    }
  }
}