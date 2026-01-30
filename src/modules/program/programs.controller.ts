import { Request, Response } from 'express';
import { Service } from 'typedi';
import { ProgramsService } from './programs.service';
import { logger } from '../../utils/logger';
import { Program } from '../../models/Program.model';
import { WorkoutVideo } from '../../models/WorkoutVideo.model';
import { ActivityHistory } from '../../models/ActivityHistory.model';
import { ActivityLog } from '../../models/ActivityLog.model';

// Define authenticated request interface based on your User model
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

  // ✅ Add these lines
  params: Params;
  body: ReqBody;
  query: ReqQuery;
}

@Service()
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  /**
   * Get homepage data (Public)
   */
  async getHomepageData(req: Request, res: Response) {
    try {
      logger.info('Controller: Fetching homepage data');
      
      const data = await this.programsService.getHomepageData();
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get homepage data', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch homepage data'
      });
    }
  }

  /**
   * Get programs by category (Public)
   */
  async getProgramsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { gender, equipmentType } = req.query;
      
      // Basic validation
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category parameter is required'
        });
      }

      if (!['beginner', 'equipment', 'targeted'].includes(category as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category. Must be: beginner, equipment, or targeted'
        });
      }

      if (gender && !['male', 'female'].includes(gender as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid gender. Must be: male or female'
        });
      }

      // If equipment type is provided, ensure we're in the equipment category
      if (equipmentType && category !== 'equipment') {
        return res.status(400).json({
          success: false,
          error: 'Equipment type can only be specified when category is "equipment"'
        });
      }

      logger.info('Controller: Fetching programs by category', {
        category,
        gender,
        ...(equipmentType && { equipmentType })
      });

      const data = await this.programsService.getProgramsByCategory(
        category as 'beginner' | 'equipment' | 'targeted',
        gender as 'male' | 'female' | undefined,
        equipmentType as string | undefined
      );
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get programs by category', {
        error: error.message,
        category: req.params.category,
        gender: req.query.gender
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch programs by category'
      });
    }
  }

  /**
   * Get program details (Public, but shows user progress if authenticated)
   */
 async getProgramDetails(req: AuthRequest<{ slug: string }>, res: Response) {
    try {
      const { slug } =  (req as any).params;
      const userId = req.user?.id;

      if (!slug) return res.status(400).json({ success: false, error: 'Program slug is required' });

      logger.info('Controller: Fetching program details', { slug, userId: userId || 'anonymous' });
      const programData = await this.programsService.getProgramDetails(slug);

      if (userId) {
        try {
          const progress = await this.programsService.getUserProgramProgress(userId, slug);
          return res.status(200).json({ success: true, data: { ...programData, userProgress: progress } });
        } catch (progressError) {
          logger.warn('Controller: Could not fetch user progress', { error: (progressError as Error).message, userId, slug });
        }
      }

      res.status(200).json({ success: true, data: programData });
    } catch (error: any) {
      logger.error('Controller: Failed to get program details', { error: error.message, slug: req.params.slug });
      const statusCode = error.message === 'Program not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, error: error.message || 'Failed to fetch program details' });
    }
  }

  /**
   * Get workout video by day (Public, but tracks view for authenticated users)
   */
  async getWorkoutVideo(req: AuthRequest<{ programSlug: string; day: string }>, res: Response) {
    try {
      const { programSlug, day } = (req as any).params;
      const userId = req.user?.id;

      if (!programSlug || !day) return res.status(400).json({ success: false, error: 'Program slug and day are required' });

      const dayNumber = parseInt(day, 10);
      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30)
        return res.status(400).json({ success: false, error: 'Day must be a number between 1 and 30' });

      logger.info('Controller: Fetching workout video', { programSlug, day: dayNumber, userId: userId || 'anonymous' });

      const data = await this.programsService.getWorkoutVideo(programSlug, dayNumber);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error('Controller: Failed to get workout video', { error: error.message, programSlug: req.params.programSlug, day: req.params.day });
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: error.message || 'Failed to fetch workout video' });
    }
  }

  /**
   * Get workout video sections (Protected - requires authentication)
   */
  async getWorkoutVideoSections(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      logger.info('Controller: Fetching video sections', {
        videoId,
        userId
      });

      const data = await this.programsService.getWorkoutVideoSections(videoId);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get video sections', {
        error: error.message,
        videoId: req.params.videoId,
        userId: req.user?.id
      });
      
      const statusCode = error.message === 'Video not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch video sections'
      });
    }
  }

  /**
   * Mark workout as completed (Protected - requires authentication)
   */
  async markWorkoutCompleted(req: AuthRequest<{ programSlug: string }, any, { day: string; timeSpent: string }>, res: Response) {
    try {
      const { programSlug } = (req as any).params;
      const { day, timeSpent } = (req as any).body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      if (!programSlug || !day || !timeSpent)
        return res.status(400).json({ success: false, error: 'Missing required fields: program slug, day, timeSpent' });

      const dayNumber = parseInt(day, 10);
      const timeSpentNumber = parseInt(timeSpent, 10);

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30)
        return res.status(400).json({ success: false, error: 'Day must be a number between 1 and 30' });

      if (isNaN(timeSpentNumber) || timeSpentNumber <= 0)
        return res.status(400).json({ success: false, error: 'Time spent must be a positive number' });

      logger.info('Controller: Marking workout as completed', { userId, programSlug, day: dayNumber, timeSpent: timeSpentNumber });

      const data = await this.programsService.markWorkoutCompleted(userId, programSlug, dayNumber, timeSpentNumber);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error('Controller: Failed to mark workout as completed', { error: error.message, userId: req.user?.id, programSlug: req.params.programSlug, body: req.body });
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: error.message || 'Failed to mark workout as completed' });
    }
  }

  // In your controller
async markWorkoutStarted(req: AuthRequest, res: Response) {
  try {
    const { programSlug } = req.params;
    const { day } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!programSlug || !day) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: programSlug, day' 
      });
    }

    const dayNumber = parseInt(day, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return res.status(400).json({ 
        success: false, 
        error: 'Day must be a number between 1 and 30' 
      });
    }

    logger.info('Controller: Marking workout as started', { 
      userId, 
      programSlug, 
      day: dayNumber 
    });

    const data = await this.programsService.markWorkoutStarted(
      userId, 
      programSlug, 
      dayNumber
    );
    
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    logger.error('Controller: Failed to mark workout as started', { 
      error: error.message, 
      userId: req.user?.id, 
      programSlug: req.params.programSlug, 
      body: req.body 
    });
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message || 'Failed to mark workout as started' 
    });
  }
}

  /**
   * Get user program progress (Protected - requires authentication)
   */
  async getUserProgramProgress(req: AuthRequest<{ programSlug: string }>, res: Response) {
    try {
      const { programSlug } = (req as any).params;
      const userId = req.user?.id;
      
      // Check authentication
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!programSlug) {
        return res.status(400).json({
          success: false,
          error: 'Program slug is required'
        });
      }

      logger.info('Controller: Fetching user program progress', {
        userId,
        programSlug
      });

      const data = await this.programsService.getUserProgramProgress(userId, programSlug);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get user program progress', {
        error: error.message,
        userId: req.user?.id,
        programSlug: req.params.programSlug
      });
      
      const statusCode = error.message === 'Program not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch program progress'
      });
    }
  }

  /**
   * Search programs (Public)
   */
  async searchPrograms(req: Request, res: Response) {
    try {
      const { q, difficulty, genderTarget, equipmentRequired, duration } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Basic filter validation
      const filters: any = {};
      if (difficulty) {
        if (!['beginner', 'intermediate', 'advanced'].includes(difficulty as string)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid difficulty. Must be: beginner, intermediate, or advanced'
          });
        }
        filters.difficulty = difficulty;
      }
      
      if (genderTarget) {
        if (!['male', 'female', 'both'].includes(genderTarget as string)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid gender target. Must be: male, female, or both'
          });
        }
        filters.genderTarget = genderTarget;
      }
      
      if (equipmentRequired !== undefined) {
        filters.equipmentRequired = equipmentRequired === 'true';
      }
      
      if (duration) {
        const durationNum = parseInt(duration as string, 10);
        if (isNaN(durationNum) || durationNum <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Duration must be a positive number'
          });
        }
        filters.duration = durationNum;
      }

      logger.info('Controller: Searching programs', {
        query: q,
        filters
      });

      const data = await this.programsService.searchPrograms(q as string, filters);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to search programs', {
        error: error.message,
        query: req.query.q,
        filters: req.query
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to search programs'
      });
    }
  }

  /**
   * Rate a workout (Protected - requires authentication)
   */
 async rateWorkout(req: AuthRequest<{ programSlug: string; day: string }, any, { rating: string }>, res: Response) {
    try {
      const { programSlug, day } = (req as any).params;
      const { rating } = (req as any).body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      if (!programSlug || !day || rating === undefined)
        return res.status(400).json({ success: false, error: 'Missing required fields: program slug, day, rating' });

      const dayNumber = parseInt(day, 10);
      const ratingNumber = parseInt(rating, 10);

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30)
        return res.status(400).json({ success: false, error: 'Day must be a number between 1 and 30' });

      if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5)
        return res.status(400).json({ success: false, error: 'Rating must be a number between 1 and 5' });

      logger.info('Controller: Rating workout', { userId, programSlug, day: dayNumber, rating: ratingNumber });

      // Find program and video
      const program = await Program.findOne({ where: { slug: programSlug, status: 'published', isActive: true } });
      if (!program) return res.status(404).json({ success: false, error: 'Program not found' });

      const video = await WorkoutVideo.findOne({ where: { programId: program.id, day: dayNumber, isActive: true } });
      if (!video) return res.status(404).json({ success: false, error: 'Workout video not found' });

      const activity = await ActivityHistory.findOne({ where: { userId, programId: program.id, workoutVideoId: video.id, isCompleted: true } });
      if (!activity) return res.status(400).json({ success: false, error: 'You must complete the workout before rating it' });

      await activity.update({ rating: ratingNumber, updatedAt: new Date() });
      await ActivityLog.create({ userId, action: 'WORKOUT_RATED', entityType: 'workout_video', entityId: video.id, details: { programSlug, day: dayNumber, rating: ratingNumber, videoId: video.id, programId: program.id } });

      res.status(200).json({ success: true, data: { message: 'Workout rated successfully', rating: ratingNumber, activityId: activity.id } });
    } catch (error: any) {
      logger.error('Controller: Failed to rate workout', { error: error.message, userId: req.user?.id, programSlug: req.params.programSlug, body: req.body });
      res.status(500).json({ success: false, error: 'Failed to rate workout' });
    }
  }

  /**
   * Get user's workout history (Protected - requires authentication)
   */
async getUserWorkoutHistory(req: AuthRequest<any, any, any, { limit?: string; offset?: string }>, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const { limit = '20', offset = '0' } = (req as any).query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ success: false, error: 'Limit must be a number between 1 and 100' });
      if (isNaN(offsetNum) || offsetNum < 0) return res.status(400).json({ success: false, error: 'Offset must be a non-negative number' });

      logger.info('Controller: Fetching user workout history', { userId, limit: limitNum, offset: offsetNum });

      const activities = await ActivityHistory.findAll({
        where: { userId, isCompleted: true },
        include: [{ model: WorkoutVideo, as: 'workoutVideo', include: [{ model: Program, as: 'program' }] }],
        order: [['completedAt', 'DESC']],
        limit: limitNum,
        offset: offsetNum
      });

      const history = activities.map((activity: any) => ({
        id: activity.id,
        program: { id: activity.workoutVideo?.program?.id, name: activity.workoutVideo?.program?.name, slug: activity.workoutVideo?.program?.slug, coverImageUrl: activity.workoutVideo?.program?.coverImageUrl },
        video: { id: activity.workoutVideo?.id, day: activity.day, title: activity.workoutVideo?.title, duration: activity.workoutVideo?.duration, thumbnailUrl: activity.workoutVideo?.thumbnailUrl },
        completedAt: activity.completedAt,
        timeSpent: (activity.details as any)?.timeSpent || activity.watchedDuration,
        rating: activity.rating,
        details: activity.details
      }));

      res.status(200).json({ success: true, data: { history, total: history.length, limit: limitNum, offset: offsetNum } });
    } catch (error: any) {
      logger.error('Controller: Failed to get user workout history', { error: error.message, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to fetch workout history' });
    }
  }
  /**
   * Get user statistics (Protected - requires authentication)
   */
  async getUserStatistics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      // Check authentication
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      logger.info('Controller: Fetching user statistics', {
        userId
      });

      // Get total workouts completed using the imported ActivityHistory model
      const totalWorkouts = await ActivityHistory.count({
        where: {
          userId,
          isCompleted: true
        }
      });

      // Get total time spent
      const activities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true
        },
        attributes: ['watchedDuration', 'details']
      });

      const totalTimeSpent = activities.reduce((total: number, activity: any) => {
        return total + ((activity.details?.timeSpent || activity.watchedDuration || 0) as number);
      }, 0);

      // Get programs completed (unique programs)
      const programCounts = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true
        },
        attributes: ['programId'],
        group: ['programId']
      });

      const programsCompleted = programCounts.length;

      // Get current streak - using the ProgramsService's calculateStreak method
      // Note: This currently only calculates streak for a specific program
      // You might need to create a separate method for total streak
      
      // For now, let's calculate streak manually
      const streakActivities = await ActivityHistory.findAll({
        where: {
          userId,
          isCompleted: true
        },
        order: [['completedAt', 'DESC']],
        limit: 30
      });

      let streak = 0;
      const today = new Date();
      
      if (streakActivities.length > 0) {
        const completionDates = streakActivities
          .map((activity: any) => {
            const date = activity.details?.completedAt 
              ? new Date(activity.details.completedAt)
              : activity.createdAt;
            return date.toDateString();
          })
          .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          
          if (completionDates.includes(checkDate.toDateString())) {
            streak++;
          } else {
            break;
          }
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          totalWorkouts,
          totalTimeSpentMinutes: Math.round(totalTimeSpent / 60), // Convert to minutes
          totalTimeSpentHours: Math.round(totalTimeSpent / 3600 * 10) / 10, // Convert to hours with 1 decimal
          programsCompleted,
          streak,
          averageWorkoutDuration: totalWorkouts > 0 ? Math.round(totalTimeSpent / totalWorkouts / 60) : 0 // Average minutes per workout
        }
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get user statistics', {
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user statistics'
      });
    }
  }

  /**
   * Get all programs (Public - for browsing)
   */
  async getAllPrograms(req: Request, res: Response) {
    try {
      const { limit = 50, offset = 0, sort = 'enrollmentCount', order = 'DESC' } = (req as any).query;

      // Validate parameters
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
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

      const validSortFields = ['enrollmentCount', 'createdAt', 'name', 'duration'];
      const validOrders = ['ASC', 'DESC'];
      
      if (!validSortFields.includes(sort as string)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
        });
      }
      
      if (!validOrders.includes((order as string).toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order. Must be: ASC or DESC'
        });
      }

      logger.info('Controller: Fetching all programs', {
        limit: limitNum,
        offset: offsetNum,
        sort,
        order
      });

      // Use the imported Program model directly
      const programs = await Program.findAll({
        where: {
          status: 'published',
          isActive: true
        },
        include: [{
          model: WorkoutVideo,
          as: 'workoutVideos',
          required: false,
          where: { isActive: true },
          limit: 1 // Get first video only
        }],
        order: [[sort as string, (order as string).toUpperCase()]],
        limit: limitNum,
        offset: offsetNum
      });

      // Format response using the ProgramsService's formatter
      // Since we don't have access to the private formatter, we'll format manually
      const formattedPrograms = programs.map((program :any)=> {
        const programData = program.toJSON();
        return {
          id: programData.id,
          slug: programData.slug,
          name: programData.name,
          description: programData.description,
          duration: programData.duration,
          difficulty: programData.difficulty,
          genderTarget: programData.genderTarget,
          equipmentRequired: programData.equipmentRequired,
          coverImageUrl: programData.coverImageUrl,
          enrollmentCount: programData.enrollmentCount,
          videoCount: programData.workoutVideos?.length || 0
        };
      });

      res.status(200).json({
        success: true,
        data: {
          programs: formattedPrograms,
          total: formattedPrograms.length,
          limit: limitNum,
          offset: offsetNum
        }
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get all programs', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch programs'
      });
    }
  }
}