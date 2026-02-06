import { Service, Inject } from 'typedi';
import { Op, WhereOptions } from 'sequelize';
import { TargetedWorkout } from '../../models/TargetedWorkout.model';
import { TargetedWorkoutClip } from '../../models/TargetedWorkoutClip.model';
import { ActivityHistory } from '../../models/ActivityHistory.model';
import { ActivityLog } from '../../models/ActivityLog.model';
import { logger } from '../../utils/logger';
import { VideoStreamService } from '../video/video-stream.service';
import { User } from '../../models';

interface TargetedWorkoutFilter {
  gender_target?: string;
  body_part?: string;
  category?: string;
  difficulty?: string;
  equipment_required?: boolean;
}

interface SearchTargetedWorkoutsParams {
  query?: string;
  tags?: string[];
  focus_areas?: string[];
  gender?: string;
  body_part?: string;
}

@Service()
export class TargetedWorkoutsService {
  constructor(
    @Inject() private videoStreamService: VideoStreamService
  ) {}

  /**
   * Get targeted workouts grouped by gender
   */
  async getTargetedWorkoutsGroupedByGender(
    filters: Partial<TargetedWorkoutFilter> = {}
  ) {
    try {
      // Base where clause
      const whereClause: WhereOptions = { is_active: true };
      
      // Apply additional filters
      if (filters.body_part) {
        whereClause.body_part = filters.body_part;
      }
      if (filters.category) {
        whereClause.category = filters.category;
      }
      if (filters.difficulty) {
        whereClause.difficulty = filters.difficulty;
      }
      if (filters.equipment_required !== undefined) {
        whereClause.equipment_required = filters.equipment_required;
      }

      // Get all targeted workouts with the applied filters
      const workouts = await TargetedWorkout.findAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1,
          order: [['clip_order', 'ASC']]
        }],
        order: [
          ['gender_target', 'ASC'],
          ['sort_order', 'ASC'],
          ['created_at', 'DESC']
        ]
      });

      // Group by gender
      const menWorkouts = workouts.filter(w => w.genderTarget === 'male');
      const womenWorkouts = workouts.filter(w => w.genderTarget === 'female');
      const bothWorkouts = workouts.filter(w => w.genderTarget === 'both');

      logger.info('Targeted workouts grouped by gender', {
        total: workouts.length,
        menCount: menWorkouts.length,
        womenCount: womenWorkouts.length,
        bothCount: bothWorkouts.length,
        filters
      });

      return {
        category: 'targeted',
        title: this.getCategoryTitle('targeted'),
        description: this.getCategoryDescription('targeted'),
        programs: {
          men: menWorkouts.length > 0 ? {
            title: 'Men',
            description: this.getGenderDescription('targeted', 'male'),
            programs: this.formatTargetedWorkoutsForResponse(menWorkouts)
          } : null,
          women: womenWorkouts.length > 0 ? {
            title: 'Women',
            description: this.getGenderDescription('targeted', 'female'),
            programs: this.formatTargetedWorkoutsForResponse(womenWorkouts)
          } : null,
          both: bothWorkouts.length > 0 ? {
            title: 'All',
            description: 'For everyone',
            programs: this.formatTargetedWorkoutsForResponse(bothWorkouts)
          } : null
        }
      };
    } catch (error: any) {
      logger.error('Failed to get targeted workouts grouped by gender', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Mark targeted workout as started
   */
  async markTargetedWorkoutStarted(userId: string, workoutId: string) {
    try {
      logger.info(`Marking targeted workout as started`, { userId, workoutId });
      
      const workout = await TargetedWorkout.findByPk(workoutId);
      
      if (!workout) {
        throw new Error('Targeted workout not found');
      }
      
      // Check if activity already exists
      const existingActivity = await ActivityHistory.findOne({
        where: {
          userId,
          targetedWorkoutId: workout.id,
          activityType: 'TARGETED_WORKOUT'
        }
      });
      
      let activity;
      
      if (!existingActivity) {
        // Create a new activity for workout start
        activity = await ActivityHistory.create({
          userId,
          targetedWorkoutId: workout.id,
          activityType: 'TARGETED_WORKOUT',
          watchedDuration: 0,
          isCompleted: false,
          details: {
            workoutId: workout.id,
            workoutTitle: workout.title,
            startedAt: new Date().toISOString(),
            status: 'started',
            lastPlayedAt: new Date().toISOString()
          }
        } as any);
        
        logger.info(`Created targeted workout start record`, {
          activityId: activity.id,
          userId,
          workoutId: workout.id
        });
      } else if (!existingActivity.isCompleted) {
        // Already started but not completed - update last played time
        activity = await existingActivity.update({
          details: {
            ...existingActivity.details,
            startedAt: new Date().toISOString(),
            lastPlayedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        });
        
        logger.info(`Updated existing started activity`, {
          activityId: activity.id,
          userId,
          workoutId: workout.id
        });
      } else {
        // Activity already completed - don't update, just return info
        logger.info(`Targeted workout already completed, not updating start time`, {
          activityId: existingActivity.id,
          userId,
          workoutId: workout.id
        });
        
        return { 
          success: true, 
          message: 'Targeted workout already completed',
          alreadyCompleted: true,
          activity: {
            workoutId,
            completedAt: existingActivity.completedAt
          }
        };
      }
      
      // Also log to ActivityLog for audit
      await ActivityLog.create({
        userId,
        action: 'TARGETED_WORKOUT_STARTED',
        entityType: 'targeted_workout',
        entityId: workout.id,
        details: {
          workoutId: workout.id,
          workoutTitle: workout.title
        }
      });
      
      return { 
        success: true, 
        message: 'Targeted workout start tracked',
        activity: {
          workoutId,
          startedAt: new Date().toISOString(),
          activityId: activity?.id
        }
      };
    } catch (error: any) {
      logger.error(`Failed to mark targeted workout as started`, {
        error: error.message,
        userId,
        workoutId
      });
      throw error;
    }
  }

  /**
   * Mark targeted workout as completed
   */
  async markTargetedWorkoutCompleted(userId: string, workoutId: string, timeSpent: number) {
    try {
      logger.info(`Marking targeted workout as completed`, {
        userId,
        workoutId,
        timeSpent
      });
      
      const workout = await TargetedWorkout.findByPk(workoutId);
      
      if (!workout) {
        logger.warn(`Targeted workout not found for completion: ${workoutId}`);
        throw new Error('Targeted workout not found');
      }
      
      // Look for ANY activity for this user/workout
      const existingActivity = await ActivityHistory.findOne({
        where: {
          userId,
          targetedWorkoutId: workout.id,
          activityType: 'TARGETED_WORKOUT'
        }
      });
      
      let activity;
      let isNewCompletion = false;
      
      if (existingActivity) {
        // Check if this is a new completion (wasn't already completed)
        if (!existingActivity.isCompleted) {
          isNewCompletion = true;
          logger.info(`Marking started targeted workout as completed`, {
            activityId: existingActivity.id,
            userId,
            workoutId: workout.id
          });
        }
        
        // Update existing activity
        activity = await existingActivity.update({
          watchedDuration: (existingActivity.watchedDuration || 0) + timeSpent,
          isCompleted: true,
          completedAt: new Date(),
          details: {
            ...existingActivity.details,
            timeSpent: ((existingActivity.details as any)?.timeSpent || 0) + timeSpent,
            completedAt: new Date().toISOString(),
            status: 'completed',
            caloriesBurned: workout.caloriesBurned,
            duration: workout.totalDuration
          },
          updatedAt: new Date()
        });
      } else {
        // Create new completion record
        isNewCompletion = true;
        
        const activityData = {
          userId,
          targetedWorkoutId: workout.id,
          activityType: 'TARGETED_WORKOUT',
          watchedDuration: timeSpent,
          isCompleted: true,
          completedAt: new Date(),
          details: {
            workoutId: workout.id,
            workoutTitle: workout.title,
            timeSpent,
            completedAt: new Date().toISOString(),
            caloriesBurned: workout.caloriesBurned,
            duration: workout.totalDuration
          }
        };

        activity = await ActivityHistory.create(activityData as any);
        
        logger.info(`Created new targeted workout completion`, {
          activityId: activity.id,
          userId,
          workoutId: workout.id
        });
      }
      
      // Update streak and user stats for NEW completions
      if (isNewCompletion) {
        await this.updateUserStreak(userId, timeSpent);
        await this.updateUserStats(userId, timeSpent);
      }
      
      // Also log to ActivityLog for audit trail
      await ActivityLog.create({
        userId,
        action: 'TARGETED_WORKOUT_COMPLETED',
        entityType: 'targeted_workout',
        entityId: workout.id,
        details: {
          workoutId: workout.id,
          workoutTitle: workout.title,
          timeSpent,
          caloriesBurned: workout.caloriesBurned,
          duration: workout.totalDuration,
          isNewCompletion,
          activityId: activity.id
        }
      });
      
      return {
        success: true,
        completed: true,
        activityId: activity.id,
        isNewCompletion,
        message: 'Targeted workout completed!'
      };
    } catch (error: any) {
      logger.error(`Failed to mark targeted workout as completed`, {
        error: error.message,
        userId,
        workoutId,
        timeSpent
      });
      throw error;
    }
  }

  /**
   * Get user's targeted workout progress
   */
  async getUserTargetedWorkoutProgress(userId: string) {
    try {
      logger.info(`Fetching user targeted workout progress`, { userId });
      
      // Get user's completed targeted workouts
      const completedActivities = await ActivityHistory.findAll({
        where: {
          userId,
          targetedWorkoutId: { [Op.not]: null },
          activityType: 'TARGETED_WORKOUT',
          isCompleted: true
        },
        order: [['createdAt', 'DESC']]
      });
      
      // Get targeted workout details for completed activities
      const workoutIds = completedActivities.map(a => a.targetedWorkoutId).filter(id => id) as string[];
      const workouts = await TargetedWorkout.findAll({
        where: {
          id: workoutIds,
          isActive: true
        }
      });
      
      // Calculate statistics
      const totalWorkouts = workouts.length;
      const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      const totalDuration = workouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0);
      
      // Group by category
      const workoutsByCategory: Record<string, any> = {};
      workouts.forEach(workout => {
        const category = workout.category || 'other';
        if (!workoutsByCategory[category]) {
          workoutsByCategory[category] = {
            count: 0,
            calories: 0,
            duration: 0,
            workouts: []
          };
        }
        workoutsByCategory[category].count++;
        workoutsByCategory[category].calories += workout.caloriesBurned || 0;
        workoutsByCategory[category].duration += workout.totalDuration || 0;
        workoutsByCategory[category].workouts.push({
          id: workout.id,
          title: workout.title,
          bodyPart: workout.bodyPart,
          completedAt: completedActivities.find(a => a.targetedWorkoutId === workout.id)?.completedAt
        });
      });
      
      // Calculate streak for targeted workouts
      const streak = await this.calculateTargetedStreak(userId);
      
      logger.info(`User targeted workout progress fetched`, {
        userId,
        totalWorkouts,
        totalCalories,
        totalDuration,
        streak
      });
      
      return {
        summary: {
          totalWorkouts,
          totalCalories,
          totalDuration,
          totalDurationFormatted: this.formatDuration(totalDuration),
          streak
        },
        byCategory: Object.entries(workoutsByCategory).map(([category, data]) => ({
          category,
          displayName: category.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          count: data.count,
          calories: data.calories,
          duration: data.duration,
          durationFormatted: this.formatDuration(data.duration)
        })),
        recentCompletions: completedActivities.slice(0, 10).map(activity => ({
          workoutId: activity.targetedWorkoutId,
          completedAt: activity.completedAt,
          timeSpent: (activity.details as any)?.timeSpent || activity.watchedDuration,
          workoutTitle: (activity.details as any)?.workoutTitle
        }))
      };
    } catch (error: any) {
      logger.error(`Failed to fetch user targeted workout progress`, {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user's completion status for a specific targeted workout
   */
  async getUserTargetedWorkoutCompletion(userId: string, workoutId: string) {
    try {
      const activity = await ActivityHistory.findOne({
        where: {
          userId,
          targetedWorkoutId: workoutId,
          activityType: 'TARGETED_WORKOUT',
          isCompleted: true
        }
      });
      
      return {
        isCompleted: !!activity,
        completedAt: activity?.completedAt,
        timesCompleted: activity ? 1 : 0,
        lastActivity: activity ? {
          activityId: activity.id,
          watchedDuration: activity.watchedDuration,
          completedAt: activity.completedAt
        } : null
      };
    } catch (error: any) {
      logger.error(`Failed to fetch user targeted workout completion`, {
        error: error.message,
        userId,
        workoutId
      });
      throw error;
    }
  }

  /**
   * Update user's daily streak
   */
  private async updateUserStreak(userId: string, timeSpent: number) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return;

      const now = new Date();
      const today = now.toDateString();
      const lastWorkoutDate = user.lastWorkoutDate 
        ? new Date(user.lastWorkoutDate).toDateString() 
        : null;

      if (lastWorkoutDate === today) {
        // Already worked out today, don't increment streak
        return;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastWorkoutDate === yesterdayStr) {
        // Consecutive day - increment streak
        await user.update({
          dailyStreak: (user.dailyStreak || 0) + 1,
          lastWorkoutDate: now,
          totalWorkouts: (user.totalWorkouts || 0) + 1,
          totalMinutes: (user.totalMinutes || 0) + Math.round(timeSpent / 60)
        });
      } else if (!lastWorkoutDate || lastWorkoutDate < yesterdayStr) {
        // Streak broken or first workout
        await user.update({
          dailyStreak: 1,
          lastWorkoutDate: now,
          totalWorkouts: (user.totalWorkouts || 0) + 1,
          totalMinutes: (user.totalMinutes || 0) + Math.round(timeSpent / 60)
        });
      }
    } catch (error) {
      logger.warn('Failed to update user streak', {
        userId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Update user stats
   */
  private async updateUserStats(userId: string, timeSpent: number): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) return;

      await user.update({
        totalWorkouts: (user.totalWorkouts || 0) + 1,
        totalMinutes: (user.totalMinutes || 0) + Math.round(timeSpent / 60),
        updatedAt: new Date()
      });

      logger.info('User stats updated', {
        userId,
        totalWorkouts: user.totalWorkouts,
        totalMinutes: user.totalMinutes
      });
    } catch (error) {
      logger.error('Failed to update user stats', {
        userId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Calculate streak for targeted workouts
   */
  private async calculateTargetedStreak(userId: string): Promise<number> {
    const activities = await ActivityHistory.findAll({
      where: {
        userId,
        targetedWorkoutId: { [Op.not]: null },
        activityType: 'TARGETED_WORKOUT',
        isCompleted: true
      },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    
    if (activities.length === 0) return 0;
    
    // Get unique completion dates
    const completionDates = activities
      .map(a => {
        const date = a.details?.completedAt 
          ? new Date(a.details.completedAt)
          : a.createdAt;
        return date.toDateString();
      })
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
   * Format duration helper
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get targeted workouts for homepage
   */
  async getTargetedWorkoutsForHomepage() {
    return this.getTargetedWorkoutsGroupedByGender();
  }

  /**
   * Get targeted workouts by category and gender
   */
  async getTargetedWorkoutsByCategory(
    category: string,
    gender?: 'male' | 'female'
  ) {
    try {
      const filters: Partial<TargetedWorkoutFilter> = { category };
      
      if (gender) {
        filters.gender_target = gender;
      }

      if (gender) {
        const whereClause: WhereOptions = { 
          is_active: true,
          category,
          gender_target: gender
        };

        const workouts = await TargetedWorkout.findAll({
          where: whereClause,
          include: [{
            model: TargetedWorkoutClip,
            as: 'clips',
            required: false,
            where: { is_active: true },
            limit: 1
          }],
          order: [['sort_order', 'ASC']]
        });

        const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

        return {
          category,
          title: this.getTargetedCategoryTitle(category),
          description: this.getTargetedCategoryDescription(category),
          gender: gender === 'male' ? 'Men' : 'Women',
          programs: formattedWorkouts
        };
      }

      return this.getTargetedWorkoutsGroupedByGender(filters);
    } catch (error: any) {
      logger.error('Failed to get targeted workouts by category', {
        error: error.message,
        category,
        gender
      });
      throw error;
    }
  }

  /**
   * Get all targeted workouts with filters and pagination
   */
  async getTargetedWorkouts(
    filter: TargetedWorkoutFilter = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const whereClause: WhereOptions = { is_active: true };
      
      if (filter.gender_target) {
        whereClause.gender_target = filter.gender_target;
      }
      if (filter.body_part) {
        whereClause.body_part = filter.body_part;
      }
      if (filter.category) {
        whereClause.category = filter.category;
      }
      if (filter.difficulty) {
        whereClause.difficulty = filter.difficulty;
      }
      if (filter.equipment_required !== undefined) {
        whereClause.equipment_required = filter.equipment_required;
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await TargetedWorkout.findAndCountAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1,
          order: [['clip_order', 'ASC']]
        }],
        order: [
          ['sort_order', 'ASC'],
          ['created_at', 'DESC']
        ],
        limit,
        offset
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(rows);

      logger.info('Targeted workouts fetched successfully', {
        total: count,
        page,
        limit,
        filters: filter
      });

      return {
        workouts: formattedWorkouts,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error: any) {
      logger.error('Failed to fetch targeted workouts', {
        error: error.message,
        filter,
        page,
        limit
      });
      throw error;
    }
  }

  /**
   * Get targeted workout by ID
   */
 async getTargetedWorkoutById(id: string) {
  try {
    const workout = await TargetedWorkout.findByPk(id, {
      include: [{
        model: TargetedWorkoutClip,
        as: 'clips',
        required: false,
        where: { is_active: true },
        order: [['clip_order', 'ASC']]
      }]
    });

    if (!workout) {
      logger.warn('Targeted workout not found', { id });
      throw new Error('Targeted workout not found');
    }

    logger.debug('Raw workout with clips:', {
      workoutId: workout.id,
      clipsCount: workout.clips?.length,
      clipsRaw: workout.clips?.map((clip: any) => ({
        id: clip.id,
        title: clip.title,
        // Check raw data values
        dataValues: clip.dataValues,
        videoKey: clip.videoKey,
        video_key: clip.getDataValue('video_key'), // Get raw column value
        // Check getters
        hasGetter: clip.__proto__.hasOwnProperty('videoKey'),
        // Check virtual fields
        videoUrl: clip.videoUrl
      }))
    });

    // Increment view count
    await workout.incrementViewCount();

    const formattedWorkout = this.formatTargetedWorkoutForResponse(workout);
    
    // ✅ FIX: Format clips with signed URLs - check if clips exist and have video_key
    if (formattedWorkout.clips && formattedWorkout.clips.length > 0) {
      formattedWorkout.clips = await Promise.all(
        formattedWorkout.clips.map(async (clip: any) => {
          // ✅ Debug logging to see what's in the clip
          logger.debug('Processing clip for signed URL', {
            clipId: clip.id,
            videoKey: clip.videoKey,
            hasVideoKey: !!clip.videoKey,
            videoKeyType: typeof clip.videoKey
          });

          // ✅ Handle missing or invalid video keys
          if (!clip.videoKey || clip.videoKey === '{Key+}') {
            logger.warn('Invalid video key found in clip', {
              clipId: clip.id,
              videoKey: clip.videoKey
            });
            
            // Use a default video if key is invalid
            const defaultVideo = 'video/5114742_Running_Runner_3840x2160.mp4';
            const signedUrl = await this.videoStreamService.getSignedVideoUrl(defaultVideo);
            
            return {
              ...clip,
              videoUrl: signedUrl,
              thumbnailUrl: clip.thumbnailKey 
                ? this.videoStreamService.getPublicThumbnailUrl(clip.thumbnailKey)
                : null,
              note: 'Using default video due to invalid key'
            };
          }
          
          // ✅ Generate signed URL for valid video key
          const signedUrl = await this.videoStreamService.getSignedVideoUrl(clip.videoKey);
          
          return {
            ...clip,
            videoUrl: signedUrl,
            thumbnailUrl: clip.thumbnailKey 
              ? this.videoStreamService.getPublicThumbnailUrl(clip.thumbnailKey)
              : null
          };
        })
      );
    }

    logger.info('Targeted workout fetched successfully', {
      id,
      title: workout.title,
      viewCount: workout.viewCount + 1
    });

    return formattedWorkout;
  } catch (error: any) {
    logger.error('Failed to fetch targeted workout', {
      error: error.message,
      id
    });
    throw error;
  }
}

  /**
   * Get targeted workouts by gender
   */
  async getTargetedWorkoutsByGender(
    gender: string,
    additionalFilters: Partial<TargetedWorkoutFilter> = {}
  ) {
    try {
      const whereClause: WhereOptions = { 
        is_active: true,
        gender_target: gender 
      };
      
      if (additionalFilters.body_part) {
        whereClause.body_part = additionalFilters.body_part;
      }
      if (additionalFilters.category) {
        whereClause.category = additionalFilters.category;
      }
      if (additionalFilters.difficulty) {
        whereClause.difficulty = additionalFilters.difficulty;
      }

      let scopeMethod = 'forBoth';
      if (gender === 'male') scopeMethod = 'forMen';
      else if (gender === 'female') scopeMethod = 'forWomen';

      const workouts = await TargetedWorkout.scope(scopeMethod).findAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1
        }],
        order: [['sort_order', 'ASC']]
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

      logger.info(`Targeted workouts fetched for gender: ${gender}`, {
        count: workouts.length,
        gender,
        filters: additionalFilters
      });

      return formattedWorkouts;
    } catch (error: any) {
      logger.error('Failed to fetch targeted workouts by gender', {
        error: error.message,
        gender,
        filters: additionalFilters
      });
      throw error;
    }
  }

  /**
   * Get targeted workouts by body part
   */
  async getTargetedWorkoutsByBodyPart(
    bodyPart: string,
    filters: { genderTarget?: string; difficulty?: string } = {}
  ) {
    try {
      const whereClause: WhereOptions = { 
        is_active: true,
        body_part: bodyPart 
      };
      
      if (filters.genderTarget) {
        whereClause.gender_target = filters.genderTarget;
      }
      if (filters.difficulty) {
        whereClause.difficulty = filters.difficulty;
      }

      const workouts = await TargetedWorkout.findAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1
        }],
        order: [['sort_order', 'ASC']]
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

      logger.info(`Targeted workouts fetched for body part: ${bodyPart}`, {
        count: workouts.length,
        bodyPart,
        filters
      });

      return formattedWorkouts;
    } catch (error: any) {
      logger.error('Failed to fetch targeted workouts by body part', {
        error: error.message,
        bodyPart,
        filters
      });
      throw error;
    }
  }

  /**
   * Get quick workouts (3-5 minutes)
   */
  async getQuickWorkouts(filters: { genderTarget?: string; bodyPart?: string } = {}) {
    try {
      const whereClause: WhereOptions = { 
        is_active: true,
        total_duration: {
          [Op.between]: [180, 300]
        }
      };
      
      if (filters.genderTarget) {
        whereClause.gender_target = filters.genderTarget;
      }
      if (filters.bodyPart) {
        whereClause.body_part = filters.bodyPart;
      }

      const workouts = await TargetedWorkout.findAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1
        }],
        order: [['sort_order', 'ASC']],
        limit: 20
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

      logger.info('Quick workouts (3-5 mins) fetched', {
        count: workouts.length,
        filters
      });

      return formattedWorkouts;
    } catch (error: any) {
      logger.error('Failed to fetch quick workouts', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get popular targeted workouts
   */
  async getPopularWorkouts(limit: number = 10) {
    try {
      const workouts = await TargetedWorkout.findAll({
        where: { isActive: true },
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1
        }],
        order: [
          ['view_count', 'DESC'],
          ['rating', 'DESC']
        ],
        limit
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

      logger.info('Popular targeted workouts fetched', {
        count: workouts.length,
        limit
      });

      return formattedWorkouts;
    } catch (error: any) {
      logger.error('Failed to fetch popular workouts', {
        error: error.message,
        limit
      });
      throw error;
    }
  }

  /**
   * Search targeted workouts
   */
  async searchTargetedWorkouts(params: SearchTargetedWorkoutsParams) {
    try {
      const whereClause: any = { is_active: true };
      
      if (params.query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${params.query}%` } },
          { description: { [Op.iLike]: `%${params.query}%` } }
        ];
      }
      
      if (params.tags && params.tags.length > 0) {
        whereClause.tags = {
          [Op.overlap]: params.tags
        };
      }
      
      if (params.focus_areas && params.focus_areas.length > 0) {
        whereClause.focus_areas = {
          [Op.overlap]: params.focus_areas
        };
      }

      if (params.gender) {
        whereClause.gender_target = params.gender;
      }

      if (params.body_part) {
        whereClause.body_part = params.body_part;
      }

      const workouts = await TargetedWorkout.findAll({
        where: whereClause,
        include: [{
          model: TargetedWorkoutClip,
          as: 'clips',
          required: false,
          where: { is_active: true },
          limit: 1
        }],
        order: [['sort_order', 'ASC']]
      });

      const formattedWorkouts = this.formatTargetedWorkoutsForResponse(workouts);

      logger.info('Targeted workouts search completed', {
        count: workouts.length,
        searchParams: params
      });

      return formattedWorkouts;
    } catch (error: any) {
      logger.error('Failed to search targeted workouts', {
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Get workout categories
   */
  async getWorkoutCategories() {
    try {
      const categories = await TargetedWorkout.findAll({
        attributes: [
          'category',
          [TargetedWorkout.sequelize!.fn('COUNT', TargetedWorkout.sequelize!.col('category')), 'workout_count']
        ],
        where: { isActive: true },
        group: ['category'],
        order: [['category', 'ASC']]
      });

      const formattedCategories = categories.map(cat => ({
        category: cat.get('category'),
        workoutCount: cat.get('workout_count'),
        displayName: (cat.get('category') as string).split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));

      logger.info('Workout categories fetched', {
        count: categories.length
      });

      return formattedCategories;
    } catch (error: any) {
      logger.error('Failed to fetch workout categories', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get body parts
   */
  async getBodyParts() {
    try {
      const bodyParts = await TargetedWorkout.findAll({
        attributes: [
          'body_part',
          [TargetedWorkout.sequelize!.fn('COUNT', TargetedWorkout.sequelize!.col('body_part')), 'workout_count']
        ],
        where: { isActive: true },
        group: ['body_part'],
        order: [['body_part', 'ASC']]
      });

      const formattedBodyParts = bodyParts.map(bp => {
        const bodyPartValue = bp.get('body_part') as string;
        return {
          bodyPart: bodyPartValue,
          workoutCount: bp.get('workout_count'),
          displayName: bodyPartValue.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          type: this.getWorkoutTypeFromBodyPart(bodyPartValue)
        };
      });

      logger.info('Body parts fetched', {
        count: bodyParts.length
      });

      return formattedBodyParts;
    } catch (error: any) {
      logger.error('Failed to fetch body parts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get targeted workout clip by ID
   */
 async getTargetedWorkoutClip(clipId: string) {
  try {
    const clip = await TargetedWorkoutClip.findByPk(clipId, {
      include: [{
        model: TargetedWorkout,
        as: 'targetedWorkout'
      }]
    });

    if (!clip) {
      logger.warn('Targeted workout clip not found', { clipId });
      throw new Error('Targeted workout clip not found');
    }

    // ✅ FIX: Check for valid video key
    if (!clip.videoKey || clip.videoKey === '{Key+}') {
      logger.error('Invalid video key in clip', {
        clipId,
        videoKey: clip.videoKey,
        clipData: JSON.stringify(clip.toJSON(), null, 2)
      });
      
      // Use a default video
      const defaultVideo = 'video/5114742_Running_Runner_3840x2160.mp4';
      const signedVideoUrl = await this.videoStreamService.getSignedVideoUrl(defaultVideo);
      
      return {
        ...clip.toJSON(),
        videoUrl: signedVideoUrl,
        thumbnailUrl: clip.thumbnailKey 
          ? this.videoStreamService.getPublicThumbnailUrl(clip.thumbnailKey)
          : null,
        note: 'Using default video due to invalid key in database'
      };
    }

    // ✅ Generate signed URL for valid video key
    const signedVideoUrl = await this.videoStreamService.getSignedVideoUrl(clip.videoKey);
    const thumbnailUrl = clip.thumbnailKey 
      ? this.videoStreamService.getPublicThumbnailUrl(clip.thumbnailKey)
      : null;

    const formattedClip = {
      id: clip.id,
      clipOrder: clip.clipOrder,
      title: clip.title,
      description: clip.description,
      exercise: clip.exercise,
      duration: clip.duration,
      videoUrl: signedVideoUrl,
      thumbnailUrl: thumbnailUrl,
      instructions: clip.instructions,
      tips: clip.tips,
      caloriesBurned: clip.caloriesBurned,
      workout: clip.targetedWorkout ? {
        id: clip.targetedWorkout.id,
        title: clip.targetedWorkout.title,
        bodyPart: clip.targetedWorkout.bodyPart
      } : null
    };

    logger.info('Targeted workout clip fetched', {
      clipId,
      exercise: clip.exercise,
      workoutId: clip.targetedWorkout?.id
    });

    return formattedClip;
  } catch (error: any) {
    logger.error('Failed to fetch targeted workout clip', {
      error: error.message,
      clipId
    });
    throw error;
  }
}

  /**
   * Helper: Format multiple targeted workouts for response
   */
  private formatTargetedWorkoutsForResponse(workouts: TargetedWorkout[]) {
    return workouts.map(workout => this.formatTargetedWorkoutForResponse(workout));
  }

  /**
   * Helper: Format single targeted workout for response
   */
  private formatTargetedWorkoutForResponse(workout: TargetedWorkout) {
    const workoutData = workout.toJSON ? workout.toJSON() : workout;
    
    let formattedClips: any[] = [];
    if (workoutData.clips && Array.isArray(workoutData.clips)) {
      formattedClips = workoutData.clips.map((clip: any) => ({
        id: clip.id,
        clipOrder: clip.clipOrder,
        title: clip.title,
        exercise: clip.exercise,
        duration: clip.duration,
        videoKey: clip.videoKey || clip.video_key,
        thumbnailUrl: clip.thumbnailKey 
          ? this.videoStreamService.getPublicThumbnailUrl(clip.thumbnailKey)
          : null,
        instructions: clip.instructions,
        tips: clip.tips,
        caloriesBurned: clip.caloriesBurned
      }));
    }

    return {
      id: workoutData.id,
      title: workoutData.title,
      description: workoutData.description,
      totalDuration: workoutData.totalDuration,
      durationFormatted: workoutData.durationFormatted,
      bodyPart: workoutData.bodyPart,
      genderTarget: workoutData.genderTarget,
      category: workoutData.category,
      difficulty: workoutData.difficulty,
      caloriesBurned: workoutData.caloriesBurned,
      clipCount: workoutData.clipCount,
      thumbnailUrl: workoutData.thumbnailUrl,
      equipmentRequired: workoutData.equipmentRequired,
      focusAreas: workoutData.focusAreas || [],
      tags: workoutData.tags || [],
      viewCount: workoutData.viewCount || 0,
      rating: workoutData.rating || 0,
      sortOrder: workoutData.sortOrder,
      workoutType: this.getWorkoutTypeFromBodyPart(workoutData.bodyPart),
      clips: formattedClips
    };
  }

  /**
   * Helper: Get category title
   */
  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      targeted: 'Targeted Workouts'
    };
    
    return titles[category] || category;
  }

  /**
   * Helper: Get targeted category title
   */
  private getTargetedCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      belly_fat: 'Belly Fat Workouts',
      toning: 'Toning Workouts',
      strength: 'Strength Workouts',
      cardio: 'Cardio Workouts',
      flexibility: 'Flexibility Workouts',
      curves: 'Curves Workouts'
    };
    
    return titles[category] || 
      category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  /**
   * Helper: Get category description
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      targeted: '3-5 min routines categorized by body goals'
    };
    
    return descriptions[category] || '';
  }

  /**
   * Helper: Get targeted category description
   */
  private getTargetedCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      belly_fat: 'Target stubborn belly fat with quick, effective workouts',
      toning: 'Sculpt and tone your body with targeted exercises',
      strength: 'Build strength and muscle with focused workouts',
      cardio: 'Get your heart pumping with quick cardio routines',
      flexibility: 'Improve flexibility and mobility with gentle exercises',
      curves: 'Shape and build beautiful curves'
    };
    
    return descriptions[category] || `Workouts focused on ${category.replace('_', ' ')}`;
  }

  /**
   * Helper: Get gender-specific description
   */
  private getGenderDescription(category: string, gender: 'male' | 'female'): string {
    const maleDescriptions: Record<string, string> = {
      targeted: 'Targeted workouts for men\'s fitness goals: strength, fat loss, chest/arms'
    };
    
    const femaleDescriptions: Record<string, string> = {
      targeted: 'Targeted workouts for women\'s fitness goals: belly fat, toning, curves'
    };
    
    if (gender === 'male') {
      return maleDescriptions[category] || '';
    } else {
      return femaleDescriptions[category] || '';
    }
  }

  /**
   * Helper: Get workout type from body part
   */
  private getWorkoutTypeFromBodyPart(bodyPart: string): string {
    const fullBodyParts = ['full_body', 'cardio'];
    const upperBodyParts = ['chest', 'arms', 'shoulders', 'back'];
    const lowerBodyParts = ['legs', 'glutes', 'thighs'];
    const coreParts = ['abs', 'core'];

    if (fullBodyParts.includes(bodyPart)) return 'full_body';
    if (upperBodyParts.includes(bodyPart)) return 'upper_body';
    if (lowerBodyParts.includes(bodyPart)) return 'lower_body';
    if (coreParts.includes(bodyPart)) return 'core';
    return 'other';
  }
}