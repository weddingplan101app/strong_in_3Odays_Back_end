// services/analytics.service.ts
import { Service, Inject } from 'typedi';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import { ActivityHistory } from '../../models/ActivityHistory.model';
import { WorkoutVideo } from '../../models/WorkoutVideo.model';
import { Program } from '../../models/Program.model';
import { TargetedWorkout } from '../../models/TargetedWorkout.model';
import { User } from '../../models/User.model';
import { logger } from '../../utils/logger';

@Service()
export class AnalyticsService {

     
  // ✅ FIXED: Hardcoded dashboard categories (from your screenshots)
  private readonly DASHBOARD_CATEGORIES = [
    'Upper Body',
    'Lower Body', 
    'Core',
    'Cardio',
    'Full Body',
    'Other'
  ] as const;

  // ✅ FIXED: Color mapping for charts (also hardcoded)
  private readonly CATEGORY_COLORS = {
    'Upper Body': '#FF6B6B',
    'Lower Body': '#4ECDC4', 
    'Core': '#FFD166',
    'Cardio': '#06D6A0',
    'Full Body': '#118AB2',
    'Other': '#9D9D9D'
  };
  
  /**
   * GET DASHBOARD ANALYTICS (Main endpoint for phone screenshots)
   * This now handles BOTH regular workouts AND targeted workouts
   */
   async getDashboardAnalytics(userId: string, period: 'week' | 'month' = 'month') {
    try {
      logger.info('Fetching dashboard analytics', { userId, period });
      
      const [
        weeklyStats,
        monthlyProgress,
        categoryDistribution,
        mostWatchedVideos
      ] = await Promise.all([
        this.getWeeklyStats(userId),
        this.getMonthlyProgress(userId, period),
        this.getCategoryDistribution(userId, period),
        this.getMostWatchedVideos(userId, period)
      ]);

      return {
        analytics: {
          thisWeek: weeklyStats,
          weeklyActivity: weeklyStats.weeklyActivity,
          monthlyProgress,
          workoutCategories: categoryDistribution,
          mostWatchedVideos
        },
        // ✅ Return constants for frontend
        constants: {
          categories: this.DASHBOARD_CATEGORIES,
          colors: this.CATEGORY_COLORS
        }
      };
    } catch (error: any) {
      logger.error('Failed to get dashboard analytics', {
        error: error.message,
        userId,
        period
      });
      throw error;
    }
  }

  

  /**
   * GET WEEKLY STATISTICS (Top 4 stats from your screenshot)
   * Now includes BOTH regular and targeted workouts
   */
  private async getWeeklyStats(userId: string) {
    const startOfWeek = this.getStartDateForPeriod('week');
    const startOfLastWeek = new Date(startOfWeek);
    console.log("Start of week:", startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    console.log("Start of last week:", startOfLastWeek);

    // Get ALL completed activities (both program workouts and targeted workouts)
    const thisWeekActivities = await ActivityHistory.findAll({
      where: {
        userId,
        isCompleted: true,
        completedAt: { [Op.gte]: startOfWeek }
      },
      include: [
        {
          model: WorkoutVideo,
          as: 'workoutVideo',
          attributes: ['duration', 'caloriesBurned', 'title'],
          required: false // LEFT JOIN so we get activities even if no video
        },
        {
          model: Program,
          as: 'program',
          attributes: ['name', 'slug'],
          required: false
        }
      ]
    });

    console.log("This week activities:", thisWeekActivities)

    // Get last week's activities for comparison
    const lastWeekActivities = await ActivityHistory.findAll({
      where: {
        userId,
        isCompleted: true,
        completedAt: { 
          [Op.gte]: startOfLastWeek,
          [Op.lt]: startOfWeek
        }
      }
    });

    // Calculate total minutes for this week
    const minutesTrained = thisWeekActivities.reduce((total, activity) => {
      return total + this.getActivityDuration(activity);
    }, 0);

    // Calculate total minutes for last week
    const lastWeekMinutes = lastWeekActivities.reduce((total, activity) => {
      return total + this.getActivityDuration(activity);
    }, 0);

    // Calculate percentage change from last week
    let changeFromLastWeek = '0%';
    if (lastWeekMinutes > 0) {
      const change = ((minutesTrained - lastWeekMinutes) / lastWeekMinutes) * 100;
      changeFromLastWeek = `${change > 0 ? '+' : ''}${Math.round(change)}%`;
    } else if (minutesTrained > 0) {
      changeFromLastWeek = '+100%';
    }

    // Calculate current streak
    const streak = await this.calculateCurrentStreak(userId);

    // Calculate completion rate (days with at least one workout)
    const daysInWeek = 7;
    const uniqueDays = new Set(
      thisWeekActivities
        .filter(a => a.completedAt)
        .map(a => new Date(a.completedAt!).toDateString())
    ).size;
    const completionRate = Math.round((uniqueDays / daysInWeek) * 100);

    // Calculate average minutes per day
    const avgPerDay = Math.round(minutesTrained / daysInWeek);

    // Get weekly activity data for the chart
    const weeklyActivity = await this.getWeeklyActivityData(userId, startOfWeek);

    return {
      minutesTrained: Math.round(minutesTrained),
      changeFromLastWeek,
      currentStreak: streak,
      completionRate: `${completionRate}%`,
      avgPerDay,
      weeklyActivity
    };
  }

  /**
   * GET CATEGORY DISTRIBUTION (Pie chart data)
   * Since WorkoutVideo doesn't have category, we'll derive it from muscleGroups
   * OR we can create a mapping function
   */

   private async getCategoryDistribution(userId: string, period: string) {
    const startDate = this.getStartDateForPeriod(period);
    
    const activities = await ActivityHistory.findAll({
      where: {
        userId,
        isCompleted: true,
        completedAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: WorkoutVideo,
          as: 'workoutVideo',
          attributes: ['muscleGroups', 'title'],
          required: false
        }
      ]
    });

    // Initialize with all dashboard categories at 0
    const categoryCounts = new Map<string, number>();
    this.DASHBOARD_CATEGORIES.forEach(category => {
      categoryCounts.set(category, 0);
    });

    // Count activities per category
    activities.forEach(activity => {
      const category = this.determineDashboardCategory(activity);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    const total = activities.length;
    
    // Format with all categories, even if 0 (for consistent UI)
    return Array.from(categoryCounts.entries())
      .map(([category, workouts]) => ({
        category,
        workouts,
        percentage: total > 0 ? Math.round((workouts / total) * 100) : 0,
        color: this.CATEGORY_COLORS[category as keyof typeof this.CATEGORY_COLORS]
      }))
      .sort((a, b) => b.workouts - a.workouts); // Sort by most workouts
  }

   /**
   * ✅ FIXED: Map workout to one of the hardcoded dashboard categories
   */
  private determineDashboardCategory(activity: ActivityHistory): string {
    // If we have workout video with muscle groups
    if (activity.workoutVideo && activity.workoutVideo.muscleGroups) {
      return this.mapMuscleGroupsToCategory(activity.workoutVideo.muscleGroups);
    }
    
    // Check details field for category
    const details = activity.details || {};
    if (details.category && this.DASHBOARD_CATEGORIES.includes(details.category)) {
      return details.category;
    }
    
    // Default to "Other" for unknown workouts
    return 'Other';
  }
  
  /**
   * ✅ FIXED: Map muscle groups to hardcoded categories
   */
  private mapMuscleGroupsToCategory(muscleGroups: string[]): string {
    if (!muscleGroups || muscleGroups.length === 0) return 'Other';
    
    const muscles = muscleGroups.map(mg => mg.toLowerCase());
    
    // Upper Body detection
    const upperBodyKeywords = ['chest', 'arms', 'shoulders', 'back', 'biceps', 'triceps', 'upper'];
    if (upperBodyKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Upper Body';
    
    // Lower Body detection
    const lowerBodyKeywords = ['legs', 'glutes', 'thighs', 'quads', 'hamstrings', 'calves', 'lower'];
    if (lowerBodyKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Lower Body';
    
    // Core detection
    const coreKeywords = ['abs', 'core', 'abdominal', 'obliques', 'stomach'];
    if (coreKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Core';
    
    // Cardio detection
    const cardioKeywords = ['cardio', 'hiit', 'heart', 'endurance', 'aerobic'];
    if (cardioKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Cardio';
    
    // Full Body detection (multiple muscle groups or specific keywords)
    if (muscles.length >= 3) return 'Full Body';
    if (muscles.some(m => m.includes('full') || m.includes('total'))) return 'Full Body';
    
    return 'Other';
  }

  /**
   * Helper: Determine category from muscle groups
   */
  private determineCategoryFromMuscleGroups(muscleGroups: string[]): string {
    if (!muscleGroups || muscleGroups.length === 0) return 'Other';
    
    const muscles = muscleGroups.map(mg => mg.toLowerCase());
    
    // Upper Body muscles
    const upperBodyKeywords = ['chest', 'arms', 'shoulders', 'back', 'biceps', 'triceps', 'upper'];
    if (upperBodyKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Upper Body';
    
    // Lower Body muscles
    const lowerBodyKeywords = ['legs', 'glutes', 'thighs', 'quads', 'hamstrings', 'calves', 'lower'];
    if (lowerBodyKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Lower Body';
    
    // Core muscles
    const coreKeywords = ['abs', 'core', 'abdominal', 'obliques', 'stomach'];
    if (coreKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Core';
    
    // Cardio indicators
    const cardioKeywords = ['cardio', 'hiit', 'heart', 'endurance', 'aerobic'];
    if (cardioKeywords.some(keyword => 
      muscles.some(muscle => muscle.includes(keyword))
    )) return 'Cardio';
    
    // Full Body workouts
    if (muscles.length >= 3 || muscles.some(m => m.includes('full') || m.includes('total'))) {
      return 'Full Body';
    }
    
    return 'Other';
  }

  /**
   * GET MOST WATCHED VIDEOS (Top 5 videos)
   */
 private async getMostWatchedVideos(userId: string, period: string) {
    const startDate = this.getStartDateForPeriod(period);
    
    const activities = await ActivityHistory.findAll({
      where: {
        userId,
        isCompleted: true,
        completedAt: { [Op.gte]: startDate },
        workoutVideoId: { [Op.ne]: null }
      },
      include: [
        {
          model: WorkoutVideo,
          as: 'workoutVideo',
          attributes: ['id', 'title', 'muscleGroups']
        }
      ]
    });

    // Count video views
    const videoMap = new Map<string, { 
      title: string, 
      category: string, 
      views: number 
    }>();

    activities.forEach(activity => {
      if (activity.workoutVideo) {
        const videoId = activity.workoutVideo.id;
        const existing = videoMap.get(videoId) || {
          title: activity.workoutVideo.title,
          category: this.mapMuscleGroupsToCategory(activity.workoutVideo.muscleGroups || []),
          views: 0
        };
        existing.views += 1;
        videoMap.set(videoId, existing);
      }
    });

    // Return top 5, sorted by views
    return Array.from(videoMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((video, index) => ({
        rank: index + 1,
        title: video.title,
        category: video.category,
        views: video.views,
        color: this.CATEGORY_COLORS[video.category as keyof typeof this.CATEGORY_COLORS] || '#9D9D9D'
      }));
  }

  /**
   * GET MONTHLY PROGRESS (Chart data for monthly progress)
   */
  private async getMonthlyProgress(userId: string, period: string) {
    const startDate = this.getStartDateForPeriod(period);
    
    // Get activities for the period
    const activities = await ActivityHistory.findAll({
      where: {
        userId,
        isCompleted: true,
        completedAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: WorkoutVideo,
          as: 'workoutVideo',
          attributes: ['duration'],
          required: false
        }
      ]
    });

    // Group by week
    const weekMap = new Map<number, { workouts: number, minutes: number }>();
    
    activities.forEach(activity => {
      const completedAt = activity.completedAt ? new Date(activity.completedAt) : new Date();
      const weekNumber = this.getWeekOfMonth(completedAt);
      
      const current = weekMap.get(weekNumber) || { workouts: 0, minutes: 0 };
      current.workouts += 1;
      current.minutes += this.getActivityDuration(activity);
      weekMap.set(weekNumber, current);
    });

    // Fill in missing weeks
    const result = [];
    const maxWeek = Math.max(...Array.from(weekMap.keys()), 4);
    
    for (let week = 1; week <= maxWeek; week++) {
      const data = weekMap.get(week) || { workouts: 0, minutes: 0 };
      result.push({
        week: `Week ${week}`,
        minutes: Math.round(data.minutes),
        workouts: data.workouts
      });
    }

    return result;
  }

  /**
   * GET WEEKLY ACTIVITY DATA (For the daily chart)
   */
  private async getWeeklyActivityData(userId: string, startOfWeek: Date) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayActivities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            [Op.gte]: dayStart,
            [Op.lte]: dayEnd
          }
        },
        include: [
          {
            model: WorkoutVideo,
            as: 'workoutVideo',
            attributes: ['duration', 'caloriesBurned'],
            required: false
          }
        ]
      });

      const minutes = dayActivities.reduce((total, activity) => {
        return total + this.getActivityDuration(activity);
      }, 0);

      const calories = dayActivities.reduce((total, activity) => {
        return total + (activity.workoutVideo?.caloriesBurned || 0);
      }, 0);

      result.push({
        day: days[i],
        minutes: Math.round(minutes),
        calories: Math.round(calories)
      });
    }

    return result;
  }

  /**
   * GET ACTIVITY DURATION in minutes
   */
  private getActivityDuration(activity: ActivityHistory): number {
    // Priority 1: Use watchedDuration from activity (seconds)
    if (activity.watchedDuration) {
      return activity.watchedDuration / 60; // Convert seconds to minutes
    }
    
    // Priority 2: Use video duration (seconds)
    if (activity.workoutVideo?.duration) {
      return activity.workoutVideo.duration / 60; // Convert seconds to minutes
    }
    
    // Default: Assume 15 minutes per workout
    return 15;
  }

  /**
   * CALCULATE CURRENT STREAK
   */
  private async calculateCurrentStreak(userId: string): Promise<number> {
    const user = await User.findByPk(userId);
    if (!user || !user.lastWorkoutDate) return 0;

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
  }

  /**
   * HELPER: Get week of month (1-5)
   */
  private getWeekOfMonth(date: Date): number {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.floor(offsetDate / 7) + 1;
  }

  /**
   * HELPER: Get start date based on period
   */
  private getStartDateForPeriod(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'week':
        // Start of week (Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
        
      case 'month':
        // Start of month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
        
      default:
        // Last 30 days as default
        const startOfDefault = new Date(now);
        startOfDefault.setDate(startOfDefault.getDate() - 30);
        startOfDefault.setHours(0, 0, 0, 0);
        return startOfDefault;
    }
  }
}