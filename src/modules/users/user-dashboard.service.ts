// modules/user/user-dashboard.service.ts
import { Service, Inject } from 'typedi';
import { Op, fn, col, literal, where, QueryTypes } from 'sequelize';
import { User } from '../../models/User.model';
import { ActivityHistory } from '../../models/ActivityHistory.model';
import { Program } from '../../models/Program.model';
import { WorkoutVideo } from '../../models/WorkoutVideo.model';
import { Subscription } from '../../models/Subscription.model';
import { logger } from '../../utils/logger';
import { VideoStreamService } from '../video/video-stream.service';

@Service()
export class UserDashboardService {
  constructor(
    @Inject() private videoStreamService: VideoStreamService
  ) {}

  /**
 * Helper: Safely parse muscleGroups from various formats
 */
private _parseMuscleGroups(muscleGroups: any): string[] {
  if (!muscleGroups) return [];
  
  // If already an array of strings
  if (Array.isArray(muscleGroups)) {
    return muscleGroups.map(g => g?.toString().trim()).filter(g => g);
  }
  
  // If it's a string
  if (typeof muscleGroups === 'string') {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(muscleGroups);
      if (Array.isArray(parsed)) {
        return parsed.map(g => g?.toString().trim()).filter(g => g);
      }
    } catch {
      // Not valid JSON, try comma-separated
    }
    
    // Try comma-separated string
    return muscleGroups
      .split(',')
      .map(g => g?.toString().trim())
      .filter(g => g);
  }
  
  // If it's an object (JSONB from PostgreSQL)
  if (typeof muscleGroups === 'object' && muscleGroups !== null) {
    try {
      return Object.values(muscleGroups)
        .map(g => g?.toString().trim())
        .filter(g => g);
    } catch {
      return [];
    }
  }
  
  return [];
}

  /**
   * Get comprehensive user dashboard data
   */
async getUserDashboard(userId: string) {
  try {
    logger.info('Fetching user dashboard', { userId });

    // Get user details
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'phone', 'email', 'dailyStreak', 'totalWorkouts', 'totalMinutes', 'lastWorkoutDate']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get current date boundaries for calculations
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    // Execute all queries in parallel for performance
    const [
      activityHistory,
      currentProgram,
      recentActivity,
      subscription,
      targetedWorkouts,
      weeklyProgress
    ] = await Promise.all([
      // Get all completed activities with program details
      ActivityHistory.findAll({
        where: { 
          userId, 
          // isCompleted: true 
        },
        include: [
          {
            model: WorkoutVideo,
            as: 'workoutVideo',
            attributes: ['id', 'title', 'duration', 'muscleGroups']
          },
          {
            model: Program,
            as: 'program',
            attributes: ['id', 'name', 'slug', 'duration', 'coverImageUrl']
          }
        ],
        order: [['completedAt', 'DESC']]
      }),

      // ✅ Use the updated getCurrentProgram (make sure this is updated too!)
      this.getCurrentProgram(userId),

      // Get recent activity for "this week" calculations
      ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            [Op.gte]: startOfWeek
          }
        },
        attributes: ['id', 'completedAt', 'watchedDuration']
      }),

      // Get user subscription status - CORRECTED to match your model
      this.getActiveSubscription(userId),

      // Get recommended targeted workouts
      this.getRecommendedWorkouts(userId),

      // Get weekly progress data
      this.getWeeklyProgressData(userId, startOfWeek)
    ]);

    console.log("activity history", activityHistory);

    // Calculate metrics
    const metrics = this.calculateDashboardMetrics(
      user,
      activityHistory,
      recentActivity,
      weeklyProgress
    );

    // ✅ Calculate progress based on current program
    let progressPercentage = 0;
    let currentDayText = "Day 1";
    
    if (currentProgram) {
      // ✅ Use totalDays instead of program.duration
      const totalDays = currentProgram.totalDays || currentProgram.program.duration;
      
      progressPercentage = Math.round(
        (currentProgram.completedDays / totalDays) * 100
      );
      
      // Determine current day text
      if (currentProgram.activityType === 'started') {
        currentDayText = `Day ${currentProgram.lastActivityDay} (Started)`;
      } else if (currentProgram.completedDays > 0) {
        const nextDay = currentProgram.lastCompletedDay + 1;
        currentDayText = `Day ${nextDay} of ${totalDays}`;
      } else {
        currentDayText = `Day 1 of ${totalDays}`;
      }
    }

    // Format response
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name || 'Fitness Enthusiast',
        greeting: this.getGreeting() + (user.name ? `, ${user.name.split(' ')[0]}` : ''),
        dailyStreak: user.dailyStreak || 0,
        totalWorkouts: user.totalWorkouts || 0,
        totalMinutes: user.totalMinutes || 0
      },
      stats: {
              daysCompleted: {
    current: metrics.completedDays,  // Changed from completedDays
    total: 30,
    change: metrics.weeklyChangeDays,
    label: 'Days Completed',
    description: `${metrics.completedDays} of 30 program days completed`,
    trend: metrics.weeklyChangeDays >= 0 ? 'up' : 'down'
  },

            minutesTrained: {
              current: metrics.minutesThisMonth,
              change: metrics.weeklyChangeMinutes,
              label: 'Minutes Trained',
              description: `${metrics.minutesThisMonth} minutes this month`,
              trend: metrics.weeklyChangeMinutes >= 0 ? 'up' : 'down'
            },
            videosWatched: {
              current: metrics.totalVideos,
              started: metrics.totalStarted,
              completed: metrics.totalCompleted,
              completionRate: metrics.completionRate,
              label: 'Workouts',
              description: `${metrics.totalCompleted} completed of ${metrics.totalStarted} started`,
              trend: 'neutral'
            },
            currentStreak: {
              current: user.dailyStreak || 0,
              label: 'Current Streak',
              description: `${user.dailyStreak || 0} days in a row`,
              encouragement: this.getStreakEncouragement(user.dailyStreak || 0)
            }
          },
      currentProgram: currentProgram ? {
        id: currentProgram.program.id,
        name: currentProgram.program.name,
        slug: currentProgram.program.slug,
        coverImageUrl: currentProgram.program.coverImageUrl 
          ? this.videoStreamService.getPublicCoverUrl(currentProgram.program.coverImageUrl)
          : null,
        
        formattedTitle: this.formatProgramTitle(currentProgram.program),
        progress: {
          completed: currentProgram.completedDays,
          total: currentProgram.totalDays || currentProgram.program.duration,
          percentage: progressPercentage,
          
          currentDay: currentProgram.activityType === 'started' 
            ? currentProgram.lastActivityDay 
            : currentProgram.lastCompletedDay + 1 || 1,
          description: currentDayText, 
          status: currentProgram.activityType || 'not_started' // 'started' or 'completed'
        }
      } : null,
      // ✅ Use getContinueWatchingForUser instead of direct call
      continueWatching: await this.getContinueWatchingForUser(userId),
      recommendedWorkouts: targetedWorkouts,
      weeklyProgress: weeklyProgress,
      subscription: subscription ? this.formatSubscriptionForDashboard(subscription) : null,
      achievements: await this.getUserAchievements(userId)
    };

    logger.info('Dashboard data fetched successfully', {
      userId,
      metrics: {
        completedDays: metrics.completedDays,
        minutesTrained: metrics.minutesThisMonth,
        videosWatched: metrics.totalVideos,
        streak: user.dailyStreak,
        subscriptionActive: !!subscription,
        // Add new debugging info
        currentProgram: currentProgram ? {
          name: currentProgram.program.name,
          activityType: currentProgram.activityType,
          completedDays: currentProgram.completedDays,
          lastActivityDay: currentProgram.lastActivityDay
        } : 'No current program'
      }
    });

    return dashboardData;
  } catch (error: any) {
    logger.error('Failed to fetch user dashboard', {
      error: error.message,
      userId
    });
    throw error;
  }
}

/**
 * Helper: Format program title like "Beginner Program - Men"
 */
private formatProgramTitle(program: Program): string {
  const difficulty = program.difficulty 
    ? program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1)
    : 'Fitness';
  
  const genderMap = {
    'male': 'Men',
    'female': 'Women',
    'both': 'All'
  };
  
  const gender = genderMap[program.genderTarget as keyof typeof genderMap] || 'All';
  
  return `${difficulty} Program - ${gender}`;
}

  /**
   * Get active subscription for user
   */
  private async getActiveSubscription(userId: string) {
    try {
      // Get the most recent active subscription
      const subscription = await Subscription.findOne({
        where: { 
          userId, 
          status: 'active',
          endDate: {
            [Op.gt]: new Date() // Subscription hasn't expired
          }
        },
        order: [['created_at', 'DESC']]
      });

      if (!subscription) {
        // Check for any subscription (even if expired)
        return await Subscription.findOne({
          where: { userId },
          order: [['created_at', 'DESC']]
        });
      }

      return subscription;
    } catch (error) {
      logger.warn('Failed to get user subscription', {
        userId,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Format subscription for dashboard response
   */
  private formatSubscriptionForDashboard(subscription: Subscription) {
    const isActive = subscription.status === 'active' && 
                     subscription.endDate !== null && 
                     subscription.endDate > new Date();

    // Format amount from kobo to naira
    const amountInNaira = subscription.amount / 100;
    
    // Format plan name
    const planNames = {
      'daily': 'Daily Plan',
      'weekly': 'Weekly Plan', 
      'monthly': 'Monthly Plan'
    };

    return {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.planType, // Using planType from your model
      planName: planNames[subscription.planType as keyof typeof planNames] || subscription.planType,
      amount: amountInNaira,
      amountFormatted: `₦${amountInNaira.toLocaleString()}`,
      telco: subscription.telco,
      phone: subscription.phone,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenewal: subscription.autoRenewal,
      isActive,
      daysRemaining: subscription.daysRemaining, // Using virtual field
      renewalCount: subscription.renewalCount || 0
    };
  }

  /**
 * Get the program user has made the most progress in (most completed days)
 */

private async getProgramWithMostProgress(userId: string) {
  try {
    // Get all completed activities across all programs
    const allCompletedActivities = await ActivityHistory.findAll({
      where: { 
        userId, 
        isCompleted: true 
      },
      include: [
        {
          model: Program,
          as: 'program',
          attributes: ['id', 'name', 'slug', 'duration', 'coverImageUrl']
        }
      ]
    });

    if (allCompletedActivities.length === 0) {
      return null;
    }

    // Group activities by program
    const programMap = new Map();
    
    allCompletedActivities.forEach(activity => {
      if (activity.program) {
        const programId = activity.programId;
        
        if (!programMap.has(programId)) {
          programMap.set(programId, {
            program: activity.program,
            completedDays: [], // Store as array first
            activities: [],
            lastActivityDate: activity.completedAt || activity.createdAt
          });
        }
        
        const programData = programMap.get(programId);
        
        // Add day if not already in the array
        if (!programData.completedDays.includes(activity.day)) {
          programData.completedDays.push(activity.day);
        }
        
        programData.activities.push(activity);
        
        // Update last activity date
        const activityDate = activity.completedAt || activity.createdAt;
        if (new Date(activityDate) > new Date(programData.lastActivityDate)) {
          programData.lastActivityDate = activityDate;
        }
      }
    });

    // Find program with most completed days
    let bestProgram = null;
    let maxCompletedDays = 0;
    
    for (const [programId, data] of programMap.entries()) {
      const completedCount = data.completedDays.length;
      
      if (completedCount > maxCompletedDays) {
        maxCompletedDays = completedCount;
        bestProgram = data;
      } else if (completedCount === maxCompletedDays && maxCompletedDays > 0) {
        // Tie breaker: use most recent activity
        if (new Date(data.lastActivityDate) > new Date(bestProgram.lastActivityDate)) {
          bestProgram = data;
        }
      }
    }

    if (!bestProgram) {
      return null;
    }

    const completedDays = bestProgram.completedDays.length;
    const lastCompletedDay = completedDays > 0 
      ? Math.max(...bestProgram.completedDays)
      : 0;

    return {
      program: bestProgram.program,
      completedDays,
      lastCompletedDay,
      totalDays: bestProgram.program.duration,
      lastActivityDate: bestProgram.lastActivityDate,
      activityType: 'completed',
      lastActivityDay: lastCompletedDay,
      totalActivities: bestProgram.activities.length
    };
  } catch (error) {
    logger.warn('Failed to get program with most progress', {
      userId,
      error: (error as Error).message
    });
    return null;
  }
}

  
public async getCurrentProgram(userId: string) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // OPTION 1: Get activity without include, then get program separately (MOST RELIABLE)
    const latestActivity = await ActivityHistory.findOne({
      where: {
        userId: userId,
        [Op.and]: [
          literal(`created_at >= '${sevenDaysAgo.toISOString()}'`)
        ]
      } as any,
      attributes: ['id', 'programId', 'day', 'isCompleted', 'workoutVideoId', 'created_at'],
      order: [['created_at', 'DESC']] as any 
    });

    console.log('Latest activity found:', latestActivity);

    if (!latestActivity) {
      logger.info('No recent activity found, using program with most progress', { userId });
      return await this.getProgramWithMostProgress(userId);
    }

    // Get the program details separately
    const program = await Program.findByPk(latestActivity.programId, {
      attributes: ['id', 'name', 'slug', 'duration', 'coverImageUrl']
    });

    if (!program) {
      logger.warn('Program not found for activity', {
        activityId: latestActivity.id,
        programId: latestActivity.programId
      });
      return null;
    }

    // Get all completed activities for this program
    const completedActivities = await ActivityHistory.findAll({
      where: {
        userId: userId,
        isCompleted: true,
        programId: latestActivity.programId
      },
      attributes: ['day']
    });

    const completedDaysSet = new Set(
      completedActivities.map(a => a.day)
    );

    const completedDays = Array.from(completedDaysSet).length;
    const lastCompletedDay = completedDays > 0 
      ? Math.max(...Array.from(completedDaysSet)) 
      : 0;
      
    // Get the raw created_at value - use getDataValue for safety
    const lastActivityDate = (latestActivity as any).getDataValue ?
      (latestActivity as any).getDataValue('created_at') :
      (latestActivity as any).created_at;

    return {
      program: program,
      completedDays,
      lastCompletedDay,
      totalDays: program.duration,
      lastActivityDate,
      activityType: latestActivity.isCompleted ? 'completed' : 'started',
      lastActivityDay: latestActivity.day,
      isRecent: true
    };
  } catch (error) {
    logger.warn('Failed to get current program', {
      userId,
      error: (error as Error).message
    });
    return null;
  }
}

  /**
   * Get the next video to continue watching
   */
  public async getContinueWatching(userId: string, programId: string, lastCompletedDay: number) {
    try {
      // Find the next video after last completed day
      const nextVideo = await WorkoutVideo.findOne({
        where: {
          programId,
          day: lastCompletedDay + 1,
          isActive: true,
          isWelcomeVideo: false
        },
        include: [{
          model: Program,
          as: 'program',
          attributes: ['id', 'name', 'slug']
        }]
      });

      if (!nextVideo) {
        // User has completed the program or no next video found
        return {
          message: 'Congratulations! You have completed this program.',
          completed: true,
          video: null,
          programComplete: true
        };
      }

      // Check if user has already watched this video today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const alreadyWatchedToday = await ActivityHistory.findOne({
        where: {
          userId,
          workoutVideoId: nextVideo.id,
          isCompleted: true,
          completedAt: {
            [Op.between]: [today, tomorrow]
          }
        }
      });

      if (alreadyWatchedToday) {
        // User already completed today's workout
        return {
          message: 'Great job! You completed today\'s workout.',
          completed: true,
          video: null,
          programComplete: false
        };
      }

      // Get signed URL for the video
      const videoUrl = nextVideo.videoKey 
        ? await this.videoStreamService.getSignedVideoUrl(nextVideo.videoKey)
        : null;
      
      const thumbnailUrl = nextVideo.thumbnailKey 
        ? this.videoStreamService.getPublicThumbnailUrl(nextVideo.thumbnailKey)
        : null;

      return {
        message: `Continue with Day ${nextVideo.day}`,
        completed: false,
        video: {
          id: nextVideo.id,
          day: nextVideo.day,
          title: nextVideo.title,
          description: nextVideo.description,
          duration: nextVideo.duration,
          durationFormatted: this.formatDuration(nextVideo.duration),
          videoUrl,
          thumbnailUrl,
          program: {
            id: nextVideo.program.id,
            name: nextVideo.program.name,
            slug: nextVideo.program.slug
          }
        },
        progress: {
          currentDay: nextVideo.day,
          totalDays: nextVideo.program.duration,
          message: `Day ${nextVideo.day} of ${nextVideo.program.duration}`
        }
      };
    } catch (error) {
      logger.warn('Failed to get continue watching', {
        userId,
        programId,
        lastCompletedDay,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Get recommended targeted workouts based on user activity
   */
  public async getRecommendedWorkouts(userId: string) {
    try {
      // Get user's most completed muscle groups from activity history
      const userActivities = await ActivityHistory.findAll({
        where: { 
          userId, 
          isCompleted: true 
        },
        include: [{
          model: WorkoutVideo,
          as: 'workoutVideo',
          attributes: ['id', 'muscleGroups', 'title']
        }],
        limit: 50
      });

      // Count muscle groups from completed workouts
      const muscleGroupCounts: Record<string, number> = {};
      
      userActivities.forEach(activity => {
      if (activity.workoutVideo?.muscleGroups) {
        const groups = this._parseMuscleGroups(activity.workoutVideo.muscleGroups);
        
        groups.forEach((group: string) => {
          const normalizedGroup = group.trim().toLowerCase();
          if (normalizedGroup) {
            muscleGroupCounts[normalizedGroup] = (muscleGroupCounts[normalizedGroup] || 0) + 1;
          }
        });
      }
    });

      // Get top 3 muscle groups user focuses on
      const topGroups = Object.entries(muscleGroupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([group]) => group);

      // Return mock recommended workouts based on your screenshot
      // In production, you'd query TargetedWorkout model
      return this.getMockRecommendedWorkouts(topGroups);
    } catch (error) {
      logger.warn('Failed to get recommended workouts', {
        userId,
        error: (error as Error).message
      });
      return this.getMockRecommendedWorkouts([]);
    }
  }

  /**
   * Calculate all dashboard metrics
   */

private calculateDashboardMetrics(
  user: User,
  activityHistory: ActivityHistory[],
  recentActivity: ActivityHistory[],
  weeklyProgress: any
) {
  // Separate completed and started activities
  const completedActivities = activityHistory.filter(a => a.isCompleted);
  const startedActivities = activityHistory.filter(a => !a.isCompleted);
  
  // ✅ FIXED: Calculate UNIQUE PROGRAM DAYS completed (not calendar days)
  const uniqueCompletedProgramDaysSet = new Set(
    completedActivities.map(a => a.day)
  );

  const completedDays = uniqueCompletedProgramDaysSet.size;

  // Calculate minutes trained this month (from COMPLETED activities only)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const thisMonthCompleted = completedActivities.filter(a => 
    a.completedAt && new Date(a.completedAt) >= startOfMonth
  );
  
  const minutesThisMonth = Math.round(
    thisMonthCompleted.reduce((sum, a) => sum + (a.watchedDuration || 0), 0) / 60
  );

  // Calculate weekly change in days (from weeklyProgress)
  const weeklyChangeDays = weeklyProgress?.thisWeekCount || 0;

  // Calculate weekly change in minutes
  const weeklyChangeMinutes = weeklyProgress?.changeMinutes || 0;

  // Total videos watched (BOTH started and completed)
  const totalVideos = activityHistory.length;

  // New metrics for better insights
  const completionRate = activityHistory.length > 0 
    ? Math.round((completedActivities.length / activityHistory.length) * 100)
    : 0;

  // ✅ DEBUG: Add logging to understand what's happening
  console.log('=== METRICS DEBUG ===');
  console.log('Total activities:', activityHistory.length);
  console.log('Completed activities:', completedActivities.length);
  console.log('Unique completed days (program days):', completedDays);
  console.log('Completed days array:', Array.from(uniqueCompletedProgramDaysSet));
  console.log('Completed activities details:', completedActivities.map(a => ({
    id: a.id,
    day: a.day,
    completedAt: a.completedAt,
    isCompleted: a.isCompleted
  })));
  console.log('=== END DEBUG ===');

  return {
    completedDays,          // ✅ Now counts unique PROGRAM days completed
    minutesThisMonth,       // Minutes trained this month
    weeklyChangeDays,       // Change in completed days this week
    weeklyChangeMinutes,    // Change in minutes this week
    totalVideos,            // Total activities (started + completed)
    completionRate,         // Percentage of started activities that are completed
    totalStarted: startedActivities.length,
    totalCompleted: completedActivities.length
  };
}
  /**
   * Get weekly progress data
   */
  private async getWeeklyProgressData(userId: string, startOfWeek: Date) {
    try {
      // Get activities for this week
      const thisWeekActivities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            [Op.gte]: startOfWeek
          }
        },
        attributes: ['id', 'completedAt', 'watchedDuration']
      });

      // Get activities for last week
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);
      
      const lastWeekActivities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            [Op.between]: [startOfLastWeek, startOfWeek]
          }
        },
        attributes: ['id', 'completedAt', 'watchedDuration']
      });

      // Calculate unique days for each week
      const thisWeekDays = new Set(
        thisWeekActivities
          .filter(a => a.completedAt)
          .map(a => new Date(a.completedAt!).toDateString())
      ).size;

      const lastWeekDays = new Set(
        lastWeekActivities
          .filter(a => a.completedAt)
          .map(a => new Date(a.completedAt!).toDateString())
      ).size;

      // Calculate minutes for each week
      const thisWeekMinutes = Math.round(
        thisWeekActivities.reduce((sum, a) => sum + (a.watchedDuration || 0), 0) / 60
      );

      const lastWeekMinutes = Math.round(
        lastWeekActivities.reduce((sum, a) => sum + (a.watchedDuration || 0), 0) / 60
      );

      return {
        thisWeekCount: thisWeekDays,
        lastWeekCount: lastWeekDays,
        thisWeekMinutes,
        lastWeekMinutes,
        changeDays: thisWeekDays - lastWeekDays,
        changeMinutes: thisWeekMinutes - lastWeekMinutes
      };
    } catch (error) {
      logger.warn('Failed to get weekly progress data', {
        userId,
        error: (error as Error).message
      });
      return {
        thisWeekCount: 0,
        lastWeekCount: 0,
        thisWeekMinutes: 0,
        lastWeekMinutes: 0,
        changeDays: 0,
        changeMinutes: 0
      };
    }
  }

  /**
   * Get user's weekly progress for chart
   */
  async getWeeklyProgress(userId: string) {
    try {
      const now = new Date();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Get start of current week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Get activities for this week grouped by day
      const weeklyData = daysOfWeek.map((day, index) => ({
        day,
        date: new Date(startOfWeek.getTime() + (index * 24 * 60 * 60 * 1000)),
        count: 0,
        minutes: 0
      }));

      const activities = await ActivityHistory.findAll({
        where: {
          userId,
          // isCompleted: true,
          completedAt: {
            [Op.between]: [startOfWeek, endOfWeek]
          }
        },
        attributes: ['id', 'completedAt', 'watchedDuration']
      });

      // Group activities by day of week
      activities.forEach(activity => {
        if (activity.completedAt) {
          const activityDate = new Date(activity.completedAt);
          const dayIndex = activityDate.getDay(); // 0 = Sunday, 6 = Saturday
          
          if (dayIndex >= 0 && dayIndex < 7) {
            weeklyData[dayIndex].count += 1;
            weeklyData[dayIndex].minutes += Math.round((activity.watchedDuration || 0) / 60);
          }
        }
      });

      return {
        weekStart: startOfWeek.toISOString().split('T')[0],
        weekEnd: endOfWeek.toISOString().split('T')[0],
        weeklyData,
        totalWorkouts: activities.length,
        totalMinutes: activities.reduce((sum, a) => sum + Math.round((a.watchedDuration || 0) / 60), 0),
        averagePerDay: activities.length / 7
      };
    } catch (error: any) {
      logger.error('Failed to get weekly progress', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user's achievement badges
   */
  async getUserAchievements(userId: string) {
    try {
      const achievements = [];

      // Get user stats
      const totalWorkouts = await ActivityHistory.count({
        where: { userId, isCompleted: true }
      });

      const totalMinutes = await ActivityHistory.sum('watchedDuration', {
        where: { userId, isCompleted: true }
      }) || 0;

      const totalMinutesTrained = Math.round(totalMinutes / 60);

      // Get user for streak
      const user = await User.findByPk(userId, {
        attributes: ['dailyStreak', 'totalWorkouts', 'totalMinutes']
      });

      // Achievement 1: First Workout
      if (totalWorkouts >= 1) {
        achievements.push({
          id: 'first-workout',
          title: 'First Step',
          description: 'Completed your first workout',
          icon: '🏃‍♂️',
          unlocked: true,
          category: 'beginner',
          progress: { current: 1, required: 1, percentage: 100 }
        });
      }

      // Achievement 2: 10 Workouts
      if (totalWorkouts >= 10) {
        achievements.push({
          id: 'consistent-10',
          title: 'Consistent Starter',
          description: 'Completed 10 workouts',
          icon: '💪',
          unlocked: true,
          category: 'consistency',
          progress: { current: 10, required: 10, percentage: 100 }
        });
      } else {
        achievements.push({
          id: 'consistent-10',
          title: 'Consistent Starter',
          description: 'Complete 10 workouts',
          icon: '💪',
          unlocked: false,
          category: 'consistency',
          progress: { current: totalWorkouts, required: 10, percentage: Math.round((totalWorkouts / 10) * 100) }
        });
      }

      // Achievement 3: 100 Minutes
      if (totalMinutesTrained >= 100) {
        achievements.push({
          id: '100-minutes',
          title: 'Century Club',
          description: 'Trained for 100+ minutes',
          icon: '⏱️',
          unlocked: true,
          category: 'endurance',
          progress: { current: totalMinutesTrained, required: 100, percentage: 100 }
        });
      } else {
        achievements.push({
          id: '100-minutes',
          title: 'Century Club',
          description: 'Train for 100 minutes',
          icon: '⏱️',
          unlocked: false,
          category: 'endurance',
          progress: { current: totalMinutesTrained, required: 100, percentage: Math.round((totalMinutesTrained / 100) * 100) }
        });
      }

      // Achievement 4: 7-Day Streak
      if (user && user.dailyStreak >= 7) {
        achievements.push({
          id: '7-day-streak',
          title: 'Weekly Warrior',
          description: '7-day workout streak',
          icon: '🔥',
          unlocked: true,
          category: 'streak',
          progress: { current: user.dailyStreak, required: 7, percentage: 100 }
        });
      } else {
        achievements.push({
          id: '7-day-streak',
          title: 'Weekly Warrior',
          description: 'Achieve a 7-day streak',
          icon: '🔥',
          unlocked: false,
          category: 'streak',
          progress: { current: user?.dailyStreak || 0, required: 7, percentage: Math.round(((user?.dailyStreak || 0) / 7) * 100) }
        });
      }

      // Achievement 5: Program Completer (if any program is 100% complete)
      const completedPrograms = await this.getCompletedPrograms(userId);
      if (completedPrograms.length > 0) {
        achievements.push({
          id: 'program-completer',
          title: 'Program Champion',
          description: `Completed ${completedPrograms.length} program${completedPrograms.length > 1 ? 's' : ''}`,
          icon: '🏆',
          unlocked: true,
          category: 'achievement',
          progress: { current: completedPrograms.length, required: 1, percentage: 100 }
        });
      }

      return {
        total: achievements.length,
        unlocked: achievements.filter(a => a.unlocked).length,
        achievements,
        nextMilestones: [
          { 
            type: 'workouts', 
            target: totalWorkouts >= 10 ? 30 : 10, 
            current: totalWorkouts, 
            reward: totalWorkouts >= 10 ? '30 Workouts Badge' : '10 Workouts Badge',
            progress: totalWorkouts >= 10 ? Math.round((totalWorkouts / 30) * 100) : Math.round((totalWorkouts / 10) * 100)
          },
          { 
            type: 'minutes', 
            target: totalMinutesTrained >= 100 ? 500 : 100, 
            current: totalMinutesTrained, 
            reward: totalMinutesTrained >= 100 ? '500 Minutes Badge' : '100 Minutes Badge',
            progress: totalMinutesTrained >= 100 ? Math.round((totalMinutesTrained / 500) * 100) : Math.round((totalMinutesTrained / 100) * 100)
          },
          { 
            type: 'streak', 
            target: (user?.dailyStreak || 0) >= 7 ? 30 : 7, 
            current: user?.dailyStreak || 0, 
            reward: (user?.dailyStreak || 0) >= 7 ? 'Monthly Streak Badge' : 'Weekly Streak Badge',
            progress: (user?.dailyStreak || 0) >= 7 ? Math.round(((user.dailyStreak || 0) / 30) * 100) : Math.round(((user?.dailyStreak || 0) / 7) * 100)
          }
        ]
      };
    } catch (error: any) {
      logger.error('Failed to get user achievements', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Helper: Get programs user has completed
   */
  public async getCompletedPrograms(userId: string) {
    try {
      // Get all programs user has activities in
      const userActivities = await ActivityHistory.findAll({
        where: { userId, isCompleted: true },
        attributes: ['programId', 'day'],
        include: [{
          model: Program,
          as: 'program',
          attributes: ['id', 'name', 'duration']
        }]
      });

      // Group by program and check completion
      const programMap = new Map();
      
      userActivities.forEach(activity => {
        if (activity.program) {
          const programId = activity.programId;
          if (!programMap.has(programId)) {
            programMap.set(programId, {
              program: activity.program,
              completedDays: new Set()
            });
          }
          programMap.get(programId).completedDays.add(activity.day);
        }
      });

      // Find programs where completed days >= program duration
      const completedPrograms = [];
      for (const [programId, data] of programMap.entries()) {
        const completedDays = data.completedDays.size;
        const totalDays = data.program.duration;
        
        if (completedDays >= totalDays) {
          completedPrograms.push({
            id: programId,
            name: data.program.name,
            completedDays,
            totalDays,
            completedAt: new Date() // Would need to track when program was completed
          });
        }
      }

      return completedPrograms;
    } catch (error) {
      logger.warn('Failed to get completed programs', {
        userId,
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Helper: Get time-appropriate greeting
   */
  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Helper: Get streak encouragement message
   */
  private getStreakEncouragement(streak: number): string {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Great start! Come back tomorrow!';
    if (streak < 3) return 'Keep the momentum going!';
    if (streak < 7) return 'You\'re on fire!';
    if (streak < 14) return 'Amazing consistency!';
    if (streak < 30) return 'Incredible dedication!';
    return 'Legendary streak! Keep it up!';
  }

  /**
   * Helper: Format duration
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

 
  /**
   * Helper: Mock recommended workouts (based on your screenshot)
   */
   // TODO: FIX ALL MOCK DATA 
  private getMockRecommendedWorkouts(topGroups: string[]): any[] {
    // Base workouts from your screenshot
    const baseWorkouts = [
      {
        id: 'push-up-progression',
        title: 'Push-up Progression',
        rating: 4.8,
        instructor: 'Mike Anderson',
        duration: 2100, // 35 minutes
        durationFormatted: '35 mins',
        difficulty: 'intermediate',
        equipment: 'No Equipment',
        thumbnailKey: 'thumbnail/thum1.jpg',
        category: 'Strength',
        muscleGroups: ['chest', 'arms', 'shoulders']
      },
      {
        id: 'squat-basics',
        title: 'Squat Basics',
        rating: 4.5,
        instructor: 'Mike Anderson',
        duration: 1800, // 30 minutes
        durationFormatted: '30 mins',
        difficulty: 'beginner',
        equipment: 'No Equipment',
        thumbnailKey: 'thumbnail/thum2.jpg',
        category: 'Legs',
        muscleGroups: ['legs', 'glutes']
      },
      {
        id: 'core-strength',
        title: 'Core Strength',
        rating: 4.7,
        instructor: 'Sarah Johnson',
        duration: 1500, // 25 minutes
        durationFormatted: '25 mins',
        difficulty: 'intermediate',
        equipment: 'No Equipment',
        thumbnailKey: 'thumbnail/thum3.jpg',
        category: 'Core',
        muscleGroups: ['abs', 'core']
      }
    ];

    // If user has top groups, prioritize workouts that match
    if (topGroups.length > 0) {
      return baseWorkouts.map(workout => ({
        ...workout,
        thumbnailUrl: this.videoStreamService.getPublicThumbnailUrl(workout.thumbnailKey),
        recommended: workout.muscleGroups.some(group => 
          topGroups.some(top => group.toLowerCase().includes(top.toLowerCase()))
        )
      })).sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
    }

    // Otherwise return as-is
    return baseWorkouts.map(workout => ({
      ...workout,
      thumbnailUrl: this.videoStreamService.getPublicThumbnailUrl(workout.thumbnailKey),
      recommended: false
    }));
  }

  /**
   * Update user streak after workout completion
   */
  async updateUserStreak(userId: string, timeSpent: number = 0): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) return;

      const now = new Date();
      const today = now.toDateString();
      const lastWorkoutDate = user.lastWorkoutDate 
        ? new Date(user.lastWorkoutDate).toDateString() 
        : null;

      // If already worked out today, don't increment streak
      if (lastWorkoutDate === today) {
        logger.debug('User already worked out today', { userId });
        return;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let newStreak = 1;
      if (lastWorkoutDate === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak = (user.dailyStreak || 0) + 1;
      }
      // If streak is broken or first workout, starts at 1

      // Update user stats
      await user.update({
        dailyStreak: newStreak,
        lastWorkoutDate: now,
        totalWorkouts: (user.totalWorkouts || 0) + 1,
        totalMinutes: (user.totalMinutes || 0) + Math.round(timeSpent / 60),
        updatedAt: now
      });

      logger.info('User streak updated', {
        userId,
        newStreak,
        totalWorkouts: user.totalWorkouts,
        totalMinutes: user.totalMinutes
      });
    } catch (error) {
      logger.error('Failed to update user streak', {
        userId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Check subscription status for user
   */
  async checkSubscriptionStatus(userId: string) {
    try {
      const subscription = await this.getActiveSubscription(userId);
      
      if (!subscription) {
        return {
          hasActiveSubscription: false,
          message: 'No active subscription found',
          canAccessContent: false
        };
      }

      const isActive = subscription.status === 'active' && 
                      subscription.endDate !== null && 
                      subscription.endDate > new Date();

      return {
        hasActiveSubscription: isActive,
        subscription: this.formatSubscriptionForDashboard(subscription),
        canAccessContent: isActive,
        message: isActive ? 'Subscription active' : 'Subscription expired or inactive'
      };
    } catch (error) {
      logger.error('Failed to check subscription status', {
        userId,
        error: (error as Error).message
      });
      return {
        hasActiveSubscription: false,
        message: 'Error checking subscription status',
        canAccessContent: false
      };
    }
  }

  /**
 * PUBLIC: Get continue watching for user (single method that handles everything)
 */
public async getContinueWatchingForUser(userId: string) {
  try {
    // Get user's current program
    const currentProgram = await this.getCurrentProgram(userId);

    console.log('Current Program:', currentProgram);
    
    if (!currentProgram) {
      return {
        message: 'No active program found. Start a new program!',
        completed: false,
        video: null,
        programComplete: false
      };
    }

    // Check if user has any STARTED but NOT COMPLETED videos
    const startedNotCompleted = await ActivityHistory.findOne({
      where: {
        userId,
        programId: currentProgram.program.id,
        isCompleted: false,
        watchedDuration: { [Op.gt]: 0 } // They watched something
      },
      include: [{
        model: WorkoutVideo,
        as: 'workoutVideo',
        where: { isActive: true },
        required: true
      }],
      order: [['created_at', 'DESC']] as any
    });

    let continueDay;
    if (startedNotCompleted) {
      // Continue from where they left off (started but not completed)
      continueDay = startedNotCompleted.day;
    } else {
      // Continue from next day after last completed
      continueDay = currentProgram.lastCompletedDay + 1;
    }

       if (continueDay > currentProgram.totalDays) {
      return {
        message: 'Congratulations! You have completed this program.',
        completed: true,
        video: null,
        programComplete: true
      };
    }

    // Use the existing method with the determined day
    return await this.getContinueWatching(
      userId, 
      currentProgram.program.id, 
      continueDay
    );
  } catch (error) {
    logger.warn('Failed to get continue watching for user', {
      userId,
      error: (error as Error).message
    });
    return null;
  }
}
}