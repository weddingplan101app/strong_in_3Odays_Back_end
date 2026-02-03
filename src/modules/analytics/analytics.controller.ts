// controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import { AnalyticsService } from './analytics.service';
import { logger } from '../../utils/logger';
import { ActivityHistory } from '../../models/ActivityHistory.model';

// Use your existing AuthRequest interface
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
    subscriptionStatus: 'active' | 'inactive' | 'expired' | 'pending' | 'failed' | 'cancelled';
    subscriptionPlan?: 'daily' | 'weekly' | 'monthly';
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
    createdAt: Date;
    updatedAt: Date;
  };

  params: Params;
  body: ReqBody;
  query: ReqQuery;
}

@Service()
export class AnalyticsController {
  constructor(@Inject() private analyticsService: AnalyticsService) {}

  /**
   * GET DASHBOARD ANALYTICS - Main endpoint for the phone screenshots
   */
  async getDashboardAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      // Check authentication
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { period = 'month' } = req.query;

      // Validate period parameter
      if (period && !['week', 'month'].includes(period as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid period. Must be: week or month'
        });
      }

      logger.info('Analytics Controller: Fetching dashboard analytics', {
        userId,
        period
      });

      // Get all dashboard analytics data
      const data = await this.analyticsService.getDashboardAnalytics(
        userId, 
        period as 'week' | 'month'
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get dashboard analytics', {
        error: error.message,
        userId: req.user?.id,
        period: req.query.period
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch dashboard analytics'
      });
    }
  }

  /**
   * GET ACTIVITY HISTORY - Get user's workout history with filtering
   */
  async getActivityHistory(req: AuthRequest<any, any, any, { 
    limit?: string; 
    offset?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    programId?: string;
  }>, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { 
        limit = '20', 
        offset = '0',
        startDate,
        endDate,
        category,
        programId
      } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // Validate parameters
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100'
        });
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number'
        });
      }

      logger.info('Analytics Controller: Fetching activity history', {
        userId,
        limit: limitNum,
        offset: offsetNum,
        startDate,
        endDate,
        category,
        programId
      });

      // Build where clause for filtering
      const where: any = {
        userId,
        isCompleted: true
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.$gte = new Date(startDate);
        if (endDate) where.completedAt.$lte = new Date(endDate);
      }

      if (programId) {
        where.programId = programId;
      }

      // Fetch activities with pagination
      const activities = await ActivityHistory.findAll({
        where,
        order: [['completedAt', 'DESC']],
        limit: limitNum,
        offset: offsetNum
      });

      const total = await ActivityHistory.count({ where });

      // Format activities for response
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        day: activity.day,
        completedAt: activity.completedAt,
        durationMinutes: Math.round(activity.watchedDuration / 60),
        rating: activity.rating,
        details: activity.details
      }));

      res.status(200).json({
        success: true,
        data: {
          activities: formattedActivities,
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: (offsetNum + activities.length) < total
        }
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get activity history', {
        error: error.message,
        userId: req.user?.id,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch activity history'
      });
    }
  }

  /**
   * GET ACTIVITY STATISTICS - For more detailed analytics
   */
  async getActivityStatistics(req: AuthRequest<any, any, any, {
    startDate?: string;
    endDate?: string;
  }>, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { startDate, endDate } = req.query;

      logger.info('Analytics Controller: Fetching activity statistics', {
        userId,
        startDate,
        endDate
      });

      // Build where clause
      const where: any = {
        userId,
        isCompleted: true
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.$gte = new Date(startDate);
        if (endDate) where.completedAt.$lte = new Date(endDate);
      }

      // Get all activities for the period
      const activities = await ActivityHistory.findAll({
        where,
        order: [['completedAt', 'DESC']]
      });

      // Calculate statistics
      const totalWorkouts = activities.length;
      const totalMinutes = activities.reduce((total, activity) => 
        total + Math.round(activity.watchedDuration / 60), 0
      );
      const totalCalories = activities.reduce((total, activity) => 
        total + ((activity.details as any)?.caloriesBurned || 0), 0
      );

      // Group by week for trend analysis
      const weeklyStats: Record<string, { workouts: number, minutes: number }> = {};
      activities.forEach(activity => {
        if (activity.completedAt) {
          const date = new Date(activity.completedAt);
          const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
          
          if (!weeklyStats[weekKey]) {
            weeklyStats[weekKey] = { workouts: 0, minutes: 0 };
          }
          
          weeklyStats[weekKey].workouts += 1;
          weeklyStats[weekKey].minutes += Math.round(activity.watchedDuration / 60);
        }
      });

      // Calculate averages
      const averageWorkoutDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
      const averageCaloriesPerWorkout = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

      // Get completion streak
      const streak = await this.calculateStreak(userId);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalWorkouts,
            totalMinutes,
            totalCalories: Math.round(totalCalories),
            currentStreak: streak,
            averageWorkoutDuration,
            averageCaloriesPerWorkout
          },
          weeklyTrends: Object.entries(weeklyStats).map(([week, stats]) => ({
            week,
            workouts: stats.workouts,
            minutes: stats.minutes
          })),
          period: {
            startDate: startDate || 'all time',
            endDate: endDate || 'now'
          }
        }
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get activity statistics', {
        error: error.message,
        userId: req.user?.id,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch activity statistics'
      });
    }
  }

  /**
   * GET WEEKLY SUMMARIES - Get weekly breakdowns
   */
  async getWeeklySummaries(req: AuthRequest<any, any, any, {
    weeks?: string;
  }>, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const weeks = parseInt(req.query.weeks as string) || 4;

      if (weeks < 1 || weeks > 12) {
        return res.status(400).json({
          success: false,
          error: 'Weeks must be between 1 and 12'
        });
      }

      logger.info('Analytics Controller: Fetching weekly summaries', {
        userId,
        weeks
      });

      const summaries = [];
      const now = new Date();

      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Get activities for this week
        const activities = await ActivityHistory.findAll({
          where: {
            userId,
            isCompleted: true,
            completedAt: {
              $gte: weekStart,
              $lte: weekEnd
            }
          }
        });

        const totalMinutes = activities.reduce((total, activity) => 
          total + Math.round(activity.watchedDuration / 60), 0
        );

        const totalWorkouts = activities.length;

        // Calculate unique workout days
        const uniqueDays = new Set(
          activities
            .filter(a => a.completedAt)
            .map(a => new Date(a.completedAt!).toDateString())
        ).size;

        summaries.push({
          weekNumber: i + 1,
          period: `Week ${i + 1}`,
          dateRange: {
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0]
          },
          stats: {
            totalWorkouts,
            totalMinutes,
            averagePerDay: Math.round(totalMinutes / 7),
            workoutDays: uniqueDays,
            completionRate: Math.round((uniqueDays / 7) * 100)
          }
        });
      }

      // Reverse to show most recent first
      summaries.reverse();

      res.status(200).json({
        success: true,
        data: {
          summaries,
          totalWeeks: weeks
        }
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get weekly summaries', {
        error: error.message,
        userId: req.user?.id,
        weeks: req.query.weeks
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch weekly summaries'
      });
    }
  }

  /**
   * GET CATEGORY BREAKDOWN - Detailed breakdown by category
   */
  async getCategoryBreakdown(req: AuthRequest<any, any, any, {
    startDate?: string;
    endDate?: string;
  }>, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { startDate, endDate } = req.query;

      logger.info('Analytics Controller: Fetching category breakdown', {
        userId,
        startDate,
        endDate
      });

      // Build where clause
      const where: any = {
        userId,
        isCompleted: true
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.$gte = new Date(startDate);
        if (endDate) where.completedAt.$lte = new Date(endDate);
      }

      // Get activities
      const activities = await ActivityHistory.findAll({
        where,
        include: [
          {
            model: require('../../models/WorkoutVideo.model').default,
            as: 'workoutVideo',
            attributes: ['title', 'muscleGroups']
          }
        ]
      });

      // Define categories
      const categories = ['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Full Body', 'Other'];
      const categoryStats = categories.map(category => ({
        category,
        workouts: 0,
        totalMinutes: 0,
        averageMinutes: 0
      }));

      // Categorize each activity
      activities.forEach(activity => {
        let category = 'Other';
        
        if (activity.workoutVideo && activity.workoutVideo.muscleGroups) {
          const muscles = activity.workoutVideo.muscleGroups.map(mg => mg.toLowerCase());
          
          // Category mapping logic
          const upperBodyKeywords = ['chest', 'arms', 'shoulders', 'back', 'biceps', 'triceps'];
          const lowerBodyKeywords = ['legs', 'glutes', 'thighs', 'quads', 'hamstrings', 'calves'];
          const coreKeywords = ['abs', 'core', 'abdominal', 'obliques'];
          const cardioKeywords = ['cardio', 'hiit', 'heart', 'endurance'];
          
          if (upperBodyKeywords.some(keyword => 
            muscles.some(muscle => muscle.includes(keyword))
          )) category = 'Upper Body';
          else if (lowerBodyKeywords.some(keyword => 
            muscles.some(muscle => muscle.includes(keyword))
          )) category = 'Lower Body';
          else if (coreKeywords.some(keyword => 
            muscles.some(muscle => muscle.includes(keyword))
          )) category = 'Core';
          else if (cardioKeywords.some(keyword => 
            muscles.some(muscle => muscle.includes(keyword))
          )) category = 'Cardio';
          else if (muscles.length >= 3) category = 'Full Body';
        }

        const categoryStat = categoryStats.find(c => c.category === category);
        if (categoryStat) {
          categoryStat.workouts += 1;
          categoryStat.totalMinutes += Math.round(activity.watchedDuration / 60);
        }
      });

      // Calculate averages and percentages
      const totalWorkouts = activities.length;
      categoryStats.forEach(cat => {
        cat.averageMinutes = cat.workouts > 0 ? Math.round(cat.totalMinutes / cat.workouts) : 0;
      });

      // Add percentages
      const categoryBreakdown = categoryStats
        .filter(cat => cat.workouts > 0)
        .map(cat => ({
          ...cat,
          percentage: totalWorkouts > 0 ? Math.round((cat.workouts / totalWorkouts) * 100) : 0
        }))
        .sort((a, b) => b.workouts - a.workouts);

      res.status(200).json({
        success: true,
        data: {
          categories: categoryBreakdown,
          totalWorkouts,
          period: {
            startDate: startDate || 'all time',
            endDate: endDate || 'now'
          }
        }
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get category breakdown', {
        error: error.message,
        userId: req.user?.id,
        query: req.query
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch category breakdown'
      });
    }
  }

  /**
   * GET USER INSIGHTS - Personalized insights based on workout patterns
   */
  async getUserInsights(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Analytics Controller: Fetching user insights', { userId });

      // Get last 30 days of activities
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true,
          completedAt: { $gte: thirtyDaysAgo }
        },
        order: [['completedAt', 'ASC']]
      });

      // Calculate insights
      const totalWorkouts = activities.length;
      const totalMinutes = activities.reduce((total, activity) => 
        total + Math.round(activity.watchedDuration / 60), 0
      );
      
      const averageWorkoutsPerWeek = Math.round((totalWorkouts / 4) * 10) / 10;
      const averageMinutesPerWorkout = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

      // Find most active day
      const dayCounts: Record<string, number> = {};
      activities.forEach(activity => {
        if (activity.completedAt) {
          const day = new Date(activity.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      });

      const mostActiveDay = Object.entries(dayCounts)
        .sort(([, a], [, b]) => b - a)[0] || ['No data', 0];

      // Generate personalized insights
      const insights = [];

      if (totalWorkouts === 0) {
        insights.push({
          type: 'motivational',
          title: 'Start Your Journey',
          message: 'Ready to begin? Start with a beginner program to build consistency.',
          priority: 'high'
        });
      } else if (averageWorkoutsPerWeek < 3) {
        insights.push({
          type: 'frequency',
          title: 'Increase Frequency',
          message: `You're averaging ${averageWorkoutsPerWeek} workouts per week. Try aiming for 3-5 workouts weekly for better results.`,
          priority: 'medium'
        });
      } else if (averageMinutesPerWorkout < 20) {
        insights.push({
          type: 'duration',
          title: 'Extend Your Sessions',
          message: `Your average workout is ${averageMinutesPerWorkout} minutes. Consider adding 5-10 more minutes for greater benefits.`,
          priority: 'low'
        });
      } else {
        insights.push({
          type: 'achievement',
          title: 'Great Consistency!',
          message: `You've completed ${totalWorkouts} workouts in the last 30 days. Keep up the great work!`,
          priority: 'low'
        });
      }

      // Add day-based insight
      insights.push({
        type: 'pattern',
        title: 'Your Active Day',
        message: `${mostActiveDay[0]} is your most active day with ${mostActiveDay[1]} workouts.`,
        priority: 'low'
      });

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalWorkouts,
            totalMinutes,
            averageWorkoutsPerWeek,
            averageMinutesPerWorkout,
            mostActiveDay: mostActiveDay[0],
            streak: await this.calculateStreak(userId)
          },
          insights: insights.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
          }),
          period: 'last 30 days'
        }
      });
    } catch (error: any) {
      logger.error('Analytics Controller: Failed to get user insights', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user insights'
      });
    }
  }

  /**
   * Helper: Calculate user streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    try {
      const activities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true
        },
        order: [['completedAt', 'DESC']],
        limit: 30
      });

      if (activities.length === 0) return 0;

      // Get unique completion dates
      const completionDates = activities
        .filter(a => a.completedAt)
        .map(a => new Date(a.completedAt!).toDateString())
        .filter((date, index, self) => self.indexOf(date) === index);

      let streak = 0;
      const today = new Date();

      // Check consecutive days starting from today
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        if (completionDates.includes(checkDate.toDateString())) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Failed to calculate streak', {
        error: (error as Error).message,
        userId
      });
      return 0;
    }
  }
}