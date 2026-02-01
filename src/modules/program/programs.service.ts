import { Service, Inject  } from 'typedi';
import { Op } from 'sequelize';
import { Program } from '../../models/Program.model';
import { WorkoutVideo } from '../../models/WorkoutVideo.model';
import { ActivityHistory } from '../../models/ActivityHistory.model';
import { ActivityLog } from '../../models/ActivityLog.model';
import { logger } from '../../utils/logger';
import { VideoStreamService } from '../video/video-stream.service'; 
import { User } from '../../models';

interface SimplifiedWorkoutVideo {
  id: any;
  day: any;
  title: any;
  description: any;
  duration: any;
  durationFormatted: any;
  videoUrl: any;
  thumbnailUrl: any;
  views: any;
  difficulty: any;
  caloriesBurned: any;
  muscleGroups: any;
  streamingUrl: any;
  hasAdaptiveStreaming: any;
  isWelcomeVideo: any;
  videoKey: any;
  thumbnailKey: any;
  streamingManifestKey: any;
}

interface FormattedVideoResponse {
  id: string;
  day: number;
  title: string;
  description: string | null;
  duration: number;
  durationFormatted: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  views: number;
  difficulty: string;
  caloriesBurned: number;
  muscleGroups: string[];
  streamingUrl: string;
  streamingManifestKey: string | null;
  hasAdaptiveStreaming: boolean;
  isWelcomeVideo: boolean;
}


@Service()
export class ProgramsService {

   constructor(
    @Inject() private videoStreamService: VideoStreamService // Inject the service
  ) {}


    private formatProgramsForResponse(programs: Program[]): any[] {
  return programs.map(program => this.formatProgramForResponse(program));
}
  
  /**
   * Get programs by category (PRD Section 4 & 8)
   * @param category 'beginner' | 'equipment' | 'targeted'
   * @param gender 'male' | 'female' | null (optional)
   * @param equipmentType Specific type of equipment to filter by (e.g., 'dumbbells', 'resistance-band') (optional)
   */
  async getProgramsByCategory(
    category: 'beginner' | 'equipment' | 'targeted', 
    gender?: 'male' | 'female',
    equipmentType?: string
  ) {
  try {
    // Define filters based on category (from PRD Section 4 & 8)
    let where: any = {
      status: 'published',
      isActive: true
    };
    
    switch (category) {
      case 'beginner':
        // PRD: Beginner (Men/Women): 30-day playlists, bodyweight
        where.difficulty = 'beginner';
        where.equipmentRequired = false;
        break;
        
      case 'equipment':
        // PRD: With Equipment (Men/Women): 30-day dumbbell playlists
        where.equipmentRequired = true;
        break;
        
      case 'targeted':
        // PRD: Targeted Workouts: 3-5 min routines categorized by body goals
        // For now, we'll get programs that are not beginner or equipment
        where.difficulty = { [Op.ne]: 'beginner' };
        where.equipmentRequired = false;
        break;
    }
    
    // Filter by gender if specified
    if (gender) {
      where.genderTarget = gender;
    }
    
    // Filter by equipment type if specified and category is equipment
    if (category === 'equipment' && equipmentType) {
      where.equipmentType = equipmentType;
      
      logger.debug(`Filtering equipment programs by type : ${equipmentType}`);
    }
    
    // Get programs with their first workout video
    const programs = await Program.findAll({
      where,
      include: [{
        model: WorkoutVideo,
        as: 'workoutVideos',
        required: false,
        where: { 
          isActive: true,
          isWelcomeVideo: false // Exclude welcome videos
        },
        order: [['day', 'ASC']],
        limit: 1, // Get first video only (PRD: "first video should be first")
        // Don't specify attributes - get all fields including virtual ones
      }],
      order: [
        ['genderTarget', 'ASC'], // Group by gender
        ['sortOrder', 'ASC'],
        ['enrollmentCount', 'DESC']
      ]
    });
    
    // Group by gender for the response
    const menPrograms = programs.filter(p => p.genderTarget === 'male');
    const womenPrograms = programs.filter(p => p.genderTarget === 'female');
    const bothPrograms = programs.filter(p => p.genderTarget === 'both');
    
    logger.info(`Fetched ${programs.length} ${category} programs`, {
      category,
      gender,
      menCount: menPrograms.length,
      womenCount: womenPrograms.length,
      bothCount: bothPrograms.length
    });
    
    return {
      category,
      title: this.getCategoryTitle(category),
      description: this.getCategoryDescription(category),
      programs: {
        men: menPrograms.length > 0 ? {
          title: 'Men',
          description: this.getGenderDescription(category, 'male'),
          programs: this.formatProgramsForResponse(menPrograms) // Now this method exists
        } : null,
        women: womenPrograms.length > 0 ? {
          title: 'Women',
          description: this.getGenderDescription(category, 'female'),
          programs: this.formatProgramsForResponse(womenPrograms) // Now this method exists
        } : null,
        both: bothPrograms.length > 0 ? {
          title: 'All',
          description: 'For everyone',
          programs: this.formatProgramsForResponse(bothPrograms) // Now this method exists
        } : null
      }
    };
  } catch (error: any) {
    logger.error(`Failed to get programs by category: ${category}`, {
      error: error.message,
      category,
      gender
    });
    throw error;
  }
}
  
  /**
   * Get homepage data (PRD Section 4: HOME SCREEN)
   */
  async getHomepageData() {
    try {
      logger.info('Fetching homepage data');
      
      // Get intro video (you might want to store this in a config or separate table)
      const introVideo = {
        title: 'Welcome to Strong in 30',
        description: 'Your 30-day journey to becoming fitter and stronger',
        videoUrl: 'https://cdn.strongin30.com/intro/welcome.mp4',
        thumbnailUrl: 'https://cdn.strongin30.com/intro/welcome.jpg',
        duration: 60 // seconds
      };
      
      // Get all categories in parallel
      const [beginner, equipment, targeted] = await Promise.all([
        this.getProgramsByCategory('beginner'),
        this.getProgramsByCategory('equipment'),
        this.getProgramsByCategory('targeted')
      ]);
      
      // Calculate counts safely
      const beginnerMenCount = beginner.programs.men?.programs?.length || 0;
      const beginnerWomenCount = beginner.programs.women?.programs?.length || 0;
      const equipmentMenCount = equipment.programs.men?.programs?.length || 0;
      const equipmentWomenCount = equipment.programs.women?.programs?.length || 0;
      const targetedMenCount = targeted.programs.men?.programs?.length || 0;
      const targetedWomenCount = targeted.programs.women?.programs?.length || 0;
      
      const beginnerCount = beginnerMenCount + beginnerWomenCount;
      const equipmentCount = equipmentMenCount + equipmentWomenCount;
      const targetedCount = targetedMenCount + targetedWomenCount;
      
      // Note: Healthy Recipes would come from a different service/module
      const recipes = {
        title: 'Healthy Recipes',
        description: '20+ overhead-style recipe videos for healthy eating',
        items: [] // Would be populated by nutrition module
      };
      
      logger.info('Homepage data fetched successfully', {
        beginnerCount,
        equipmentCount,
        targetedCount,
        totalCount: beginnerCount + equipmentCount + targetedCount
      });
      
      return {
        introVideo,
        sections: {
          beginner,
          equipment,
          targeted,
          recipes
        }
      };
    } catch (error: any) {
      logger.error('Failed to fetch homepage data', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Get program details with all workout videos
   */
  async getProgramDetails(slug: string) {
    try {
      logger.info(`Fetching program details: ${slug}`);
      
      const program = await Program.findOne({
        where: { 
          slug,
          status: 'published',
          isActive: true 
        },
        include: [{
          model: WorkoutVideo,
          as: 'workoutVideos',
          required: false,
          where: { isActive: true },
          order: [['day', 'ASC']] // PRD: Users can jump to any day freely
        }]
      });
      
      if (!program) {
        logger.warn(`Program not found: ${slug}`);
        throw new Error('Program not found');
      }
      
      // Calculate program statistics
      const stats = this.calculateProgramStats(program);
      
      logger.info(`Program details fetched: ${slug}`, {
        programId: program.id,
        videoCount: program.workoutVideos?.length || 0,
        totalDuration: stats.totalDuration
      });
      
      return {
        ...this.formatProgramForResponse(program),
        stats
      };
    } catch (error: any) {
      logger.error(`Failed to fetch program details: ${slug}`, {
        error: error.message,
        slug
      });
      throw error;
    }
  }
  
  /**
   * Get specific workout video by day
   */
async getWorkoutVideo(programSlug: string, day: number) {
    try {
      logger.info(`Fetching workout video: ${programSlug} day ${day}`);
      
      const program = await Program.findOne({
        where: { 
          slug: programSlug,
          status: 'published',
          isActive: true 
        }
      });
      
      if (!program) {
        logger.warn(`Program not found for workout video: ${programSlug}`);
        throw new Error('Program not found');
      }
      
      const video = await WorkoutVideo.findOne({
        where: {
          programId: program.id,
          day,
          isActive: true
        },
        include: [{
          model: Program,
          as: 'program'
        }]
      });
      
      if (!video) {
        logger.warn(`Workout video not found: ${programSlug} day ${day}`);
        throw new Error('Workout video not found');
      }
      
      // ✅ Generate signed URL for the video
      let signedVideoUrl: string | null = null;
      try {
        signedVideoUrl = await this.videoStreamService.getSignedVideoUrl(video.videoKey);
        logger.info('Generated signed URL for video', {
          videoId: video.id,
          urlLength: signedVideoUrl?.length
        });
      } catch (urlError: any) {
        logger.error('Failed to generate signed URL', {
          error: urlError.message,
          videoKey: video.videoKey
        });
        // Don't throw, just leave it null
      }
      
      // ✅ Get public thumbnail URL
      const thumbnailUrl = video.thumbnailKey 
        ? this.videoStreamService.getPublicThumbnailUrl(video.thumbnailKey)
        : null;
      
      // Get navigation (previous and next videos)
      const navigation = await this.getVideoNavigation(program.id, day);
      
      // Increment view count
      try {
        await video.increment('views');
      } catch (error) {
        logger.warn('Could not increment views', {
          videoId: video.id,
          error: (error as Error).message
        });
      }
      
      // Refresh to get updated data
      await video.reload();
      
      logger.info(`Workout video fetched: ${video.id}`, {
        videoId: video.id,
        programId: program.id,
        day,
        views: video.views || 0,
        hasSignedUrl: !!signedVideoUrl
      });
      
      return {
        video: {
          id: video.id,
          day: video.day,
          title: video.title,
          description: video.description,
          duration: video.duration,
          durationFormatted: this.formatDuration(video.duration),
          videoUrl: signedVideoUrl,
          thumbnailUrl: thumbnailUrl, 
          views: video.views || 0,
          difficulty: video.difficulty,
          caloriesBurned: video.caloriesBurned,
          muscleGroups: video.muscleGroups || [],
          hasAdaptiveStreaming: video.hasAdaptiveStreaming,
          streamingManifestKey: video.streamingManifestKey,
          isWelcomeVideo: video.isWelcomeVideo,
          videoKey: video.videoKey,
          thumbnailKey: video.thumbnailKey,
          expiresIn: 3600 // 1 hour in seconds
        },
        navigation
      };
    } catch (error: any) {
      logger.error(`Failed to fetch workout video: ${programSlug} day ${day}`, {
        error: error.message,
        programSlug,
        day
      });
      throw error;
    }
  }
  
  /**
   * Get workout video sections (like in your screenshot with timestamps)
   */
  async getWorkoutVideoSections(videoId: string) {
    try {
      logger.info(`Fetching video sections: ${videoId}`);
      
      const video = await WorkoutVideo.findByPk(videoId, {
        attributes: ['id', 'title', 'description', 'duration']
      });
      
      if (!video) {
        logger.warn(`Video not found for sections: ${videoId}`);
        throw new Error('Video not found');
      }
      
      // For now, return mock sections based on video duration
      // In a real app, you'd have a separate VideoSection model
      const sections = this.generateVideoSections(video);
      
      logger.info(`Video sections fetched: ${videoId}`, {
        videoId,
        sectionsCount: sections.length
      });
      
      return {
        videoId: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        sections
      };
    } catch (error: any) {
      logger.error(`Failed to fetch video sections: ${videoId}`, {
        error: error.message,
        videoId
      });
      throw error;
    }
  }
  
  /**
   * Mark workout as completed
   */

async markWorkoutCompleted(userId: string, programSlug: string, day: number, timeSpent: number) {
  try {
    logger.info(`Marking workout as completed`, {
      userId,
      programSlug,
      day,
      timeSpent
    });
    
    const program = await Program.findOne({
      where: { 
        slug: programSlug,
        status: 'published',
        isActive: true 
      }
    });
    
    if (!program) {
      logger.warn(`Program not found for completion: ${programSlug}`);
      throw new Error('Program not found');
    }
    
    const video = await WorkoutVideo.findOne({
      where: {
        programId: program.id,
        day,
        isActive: true
      }
    });
    
    if (!video) {
      logger.warn(`Workout video not found for completion: ${programSlug} day ${day}`);
      throw new Error('Workout video not found');
    }
    
    // 🔴 FIXED: Look for ANY activity (completed OR started) for this user/video/day
    const existingActivity = await ActivityHistory.findOne({
      where: {
        userId,
        programId: program.id,
        workoutVideoId: video.id,
        day: day
        // REMOVED: isCompleted: true - Now looks for ANY activity
      }
    });
    
    let activity;
    let isNewCompletion = false;
    
    if (existingActivity) {
      // 🔴 FIXED: Check if this is a new completion (wasn't already completed)
      if (!existingActivity.isCompleted) {
        isNewCompletion = true;
        logger.info(`Marking started activity as completed`, {
          activityId: existingActivity.id,
          userId,
          programId: program.id,
          videoId: video.id
        });
      }
      
      // Update existing activity
      activity = await existingActivity.update({
        watchedDuration: (existingActivity.watchedDuration || 0) + timeSpent,
        isCompleted: true, // Mark as completed
        completedAt: new Date(),
        details: {
          ...existingActivity.details,
          timeSpent: ((existingActivity.details as any)?.timeSpent || 0) + timeSpent,
          completedAt: new Date().toISOString(),
          status: 'completed'
        },
        updatedAt: new Date()
      });
      
      logger.info(`Updated existing workout activity`, {
        activityId: activity.id,
        userId,
        programId: program.id,
        videoId: video.id,
        wasCompleted: existingActivity.isCompleted,
        isNewCompletion
      });
    } else {
      // 🔴 This should rarely happen - only if user somehow completes without starting
      isNewCompletion = true;
      
      const activityData = {
        userId,
        programId: program.id,
        workoutVideoId: video.id,
        day,
        watchedDuration: timeSpent,
        isCompleted: true,
        completedAt: new Date(),
        details: {
          day,
          timeSpent,
          completedAt: new Date().toISOString(),
          programName: program.name,
          videoTitle: video.title
        }
      };

      activity = await ActivityHistory.create(activityData as any);
      
      logger.warn(`Created new workout completion without start record`, {
        activityId: activity.id,
        userId,
        programId: program.id,
        videoId: video.id
      });
    }
    
    // 🔴 FIXED: Only update streak and user stats for NEW completions
    if (isNewCompletion) {
      await this.updateUserStreak(userId, timeSpent);
      
      // Also update user's total workouts and minutes
      await this.updateUserStats(userId, timeSpent);
    }
    
    // Also log to ActivityLog for audit trail
    await ActivityLog.create({
      userId,
      action: 'WORKOUT_COMPLETED',
      entityType: 'workout_video',
      entityId: video.id,
      details: {
        programSlug,
        day,
        timeSpent,
        videoId: video.id,
        programId: program.id,
        isNewCompletion,
        activityId: activity.id
      }
    });
    
    // Get next video for response
    const nextVideo = await WorkoutVideo.findOne({
      where: {
        programId: program.id,
        day: day + 1,
        isActive: true
      }
    });
    
    return {
      success: true,
      completed: true,
      activityId: activity.id,
      isNewCompletion, // Include this in response
      nextVideo: nextVideo ? {
        day: nextVideo.day,
        title: nextVideo.title,
        thumbnailUrl: nextVideo.thumbnailUrl
      } : null,
      message: nextVideo ? `Ready for Day ${nextVideo.day}` : 'Program completed!'
    };
  } catch (error: any) {
    logger.error(`Failed to mark workout as completed`, {
      error: error.message,
      userId,
      programSlug,
      day,
      timeSpent
    });
    throw error;
  }
}


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

// In ProgramsService - new method
async markWorkoutStarted(userId: string, programSlug: string, day: number) {
  try {
    logger.info(`Marking workout as started`, { userId, programSlug, day });
    
    const program = await Program.findOne({
      where: { 
        slug: programSlug,
        status: 'published',
        isActive: true 
      }
    });
    
    if (!program) {
      throw new Error('Program not found');
    }
    
    const video = await WorkoutVideo.findOne({
      where: {
        programId: program.id,
        day,
        isActive: true
      }
    });
    
    if (!video) {
      throw new Error('Workout video not found');
    }
    
    // 🔴 FIXED: Check if activity already exists (completed OR started)
    const existingActivity = await ActivityHistory.findOne({
      where: {
        userId,
        programId: program.id,
        workoutVideoId: video.id,
        day
      }
    });
    
    let activity;
    
    if (!existingActivity) {
      // Create a new activity for video start
      activity = await ActivityHistory.create({
        userId,
        programId: program.id,
        workoutVideoId: video.id,
        day,
        watchedDuration: 0,
        isCompleted: false,
        details: {
          day,
          startedAt: new Date().toISOString(),
          status: 'started',
          videoTitle: video.title,
          programName: program.name,
          lastPlayedAt: new Date().toISOString()
        }
      });
      
      logger.info(`Created workout start record`, {
        activityId: activity.id,
        userId,
        programId: program.id,
        videoId: video.id
      });
    } else if (!existingActivity.isCompleted) {
      // Already started but not completed - update start time
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
        programId: program.id,
        videoId: video.id
      });
    } else {
      // Activity already completed - don't update, just return info
      logger.info(`Workout already completed, not updating start time`, {
        activityId: existingActivity.id,
        userId,
        programId: program.id,
        videoId: video.id
      });
      
      return { 
        success: true, 
        message: 'Workout already completed',
        alreadyCompleted: true,
        activity: {
          day,
          programSlug,
          completedAt: existingActivity.completedAt
        }
      };
    }
    
    // Also log to ActivityLog for audit
    await ActivityLog.create({
      userId,
      action: 'WORKOUT_STARTED',
      entityType: 'workout_video',
      entityId: video.id,
      details: {
        programSlug,
        day,
        videoId: video.id,
        programId: program.id
      }
    });
    
    return { 
      success: true, 
      message: 'Workout start tracked',
      activity: {
        day,
        programSlug,
        startedAt: new Date().toISOString(),
        activityId: activity?.id
      }
    };
  } catch (error: any) {
    logger.error(`Failed to mark workout as started`, {
      error: error.message,
      userId,
      programSlug,
      day
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
   * Get user's progress in a program
   */
  async getUserProgramProgress(userId: string, programSlug: string) {
  try {
    logger.info(`Fetching user program progress`, {
      userId,
      programSlug
    });
    
    const program = await Program.findOne({
      where: { 
        slug: programSlug,
        status: 'published',
        isActive: true 
      },
      include: [{
        model: WorkoutVideo,
        as: 'workoutVideos',
        required: false,
        where: { isActive: true },
        order: [['day', 'ASC']]
      }]
    });
    
    if (!program) {
      logger.warn(`Program not found for progress: ${programSlug}`);
      throw new Error('Program not found');
    }
    
    // Get user's completed workouts - REMOVE action field, use isCompleted
    const completedActivities = await ActivityHistory.findAll({
      where: {
        userId,
        programId: program.id,
        isCompleted: true  // Changed from action: 'WORKOUT_COMPLETED'
      },
      order: [['createdAt', 'DESC']]
    });
    
    const completedVideoIds = new Set(
      completedActivities.map(activity => activity.workoutVideoId)
    );
    
    // Calculate progress
    const totalVideos = program.workoutVideos?.length || 0;
    const completedVideos = program.workoutVideos?.filter(v => 
      completedVideoIds.has(v.id)
    ).length || 0;
    
    // Calculate streak (consecutive days with completed workouts)
    const streak = await this.calculateStreak(userId, program.id);
    
    // Get last completed activity
    const lastCompleted = completedActivities[0];
    
    logger.info(`User program progress fetched`, {
      userId,
      programId: program.id,
      totalVideos,
      completedVideos,
      streak
    });
    
    return {
      program: {
        id: program.id,
        name: program.name,
        slug: program.slug,
        duration: program.duration
      },
      progress: {
        completedVideos,
        totalVideos,
        percentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
        streak,
        lastCompleted: lastCompleted ? {
          day: lastCompleted.day, // Use direct field instead of details
          date: lastCompleted.completedAt, // Use direct field
          videoTitle: (lastCompleted.details as any)?.videoTitle || (lastCompleted.details as any)?.title || 'Workout Video'
        } : null
      },
      completedDays: completedActivities.map(activity => ({
        day: activity.day, // Use direct field
        completedAt: activity.completedAt, // Use direct field
        timeSpent: (activity.details as any)?.timeSpent || activity.watchedDuration
      }))
    };
  } catch (error: any) {
    logger.error(`Failed to fetch user program progress`, {
      error: error.message,
      userId,
      programSlug
    });
    throw error;
  }
}
  
  /**
   * Search programs
   */
 async searchPrograms(query: string, filters?: any) {
  try {
    logger.info(`Searching programs: ${query}`, { query, filters });
    
    const where: any = {
      status: 'published',
      isActive: true,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { slug: { [Op.iLike]: `%${query}%` } }
      ]
    };
    
    // Apply additional filters
    if (filters) {
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.genderTarget) where.genderTarget = filters.genderTarget;
      if (filters.equipmentRequired !== undefined) {
        where.equipmentRequired = filters.equipmentRequired;
      }
      if (filters.duration) where.duration = filters.duration;
    }
    
    const programs = await Program.findAll({
      where,
      include: [{
        model: WorkoutVideo,
        as: 'workoutVideos',
        required: false,
        limit: 1
      }],
      order: [['enrollmentCount', 'DESC']]
    });
    
    logger.info(`Search completed`, {
      query,
      results: programs.length
    });
    
    // Map over the array and format each program
    return programs.map(program => this.formatProgramForResponse(program));
  } catch (error: any) {
    logger.error(`Search programs failed`, {
      error: error.message,
      query,
      filters
    });
    throw error;
  }
}
  
  /**
   * Helper: Format programs for API response
   */
 private formatVideoForResponse(video: WorkoutVideo | any): FormattedVideoResponse {
  const videoData = video.toJSON ? video.toJSON() : video;
  
  return {
    id: videoData.id,
    day: videoData.day,
    title: videoData.title,
    description: videoData.description,
    duration: videoData.duration,
    durationFormatted: videoData.durationFormatted,
    videoUrl: videoData.videoUrl,
    thumbnailUrl: videoData.thumbnailUrl,
    views: videoData.views,
    difficulty: videoData.difficulty,
    caloriesBurned: videoData.caloriesBurned,
    muscleGroups: videoData.muscleGroups,
    streamingUrl: videoData.streamingUrl,
    streamingManifestKey: videoData.streamingManifestKey,
    hasAdaptiveStreaming: videoData.hasAdaptiveStreaming,
    isWelcomeVideo: videoData.isWelcomeVideo
  };
}

 private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Helper: Format single program for API response
   */
 private formatProgramForResponse(program: Program) {
    const programData = program.toJSON();
    
    // ✅ Use public URL for cover image
    let coverImageUrl = programData.coverImageUrl;
    if (coverImageUrl && !coverImageUrl.startsWith('http')) {
      coverImageUrl = this.videoStreamService.getPublicCoverUrl(coverImageUrl);
    }
    
    // Format workout videos if present (without video URLs for lists)
    let formattedVideos:any = [];
    if (programData.workoutVideos) {
      formattedVideos = programData.workoutVideos.map((video: any) => ({
        id: video.id,
        day: video.day,
        title: video.title,
        description: video.description,
        duration: video.duration,
        durationFormatted: this.formatDuration(video.duration),
        // For lists, only include thumbnail, not video URL (for performance)
        thumbnailUrl: video.thumbnailKey 
          ? this.videoStreamService.getPublicThumbnailUrl(video.thumbnailKey)
          : null,
        views: video.views || 0,
        difficulty: video.difficulty,
        caloriesBurned: video.caloriesBurned,
        muscleGroups: video.muscleGroups || [],
        isWelcomeVideo: video.isWelcomeVideo
      }));
    }
    
    return {
      id: programData.id,
      slug: programData.slug,
      name: programData.name,
      description: programData.description,
      duration: programData.duration,
      difficulty: programData.difficulty,
      genderTarget: programData.genderTarget,
      equipmentRequired: programData.equipmentRequired,
      coverImageUrl: coverImageUrl, // ✅ Public URL
      enrollmentCount: programData.enrollmentCount,
      workoutVideos: formattedVideos,
      totalDuration: programData.totalDuration,
      videoCount: programData.videoCount
    };
  }
  /**
   * Helper: Format video for API response
   */
//   private formatVideoForResponse(video: WorkoutVideo | any) {
//     const videoData = video.toJSON ? video.toJSON() : video;
    
//     return {
//       id: videoData.id,
//       day: videoData.day,
//       title: videoData.title,
//       description: videoData.description,
//       duration: videoData.duration,
//       durationFormatted: videoData.durationFormatted, // Virtual field
//       videoUrl: videoData.videoUrl, // Virtual field (computed from video_key)
//       thumbnailUrl: videoData.thumbnailUrl, // Virtual field (computed from thumbnail_key)
//       views: videoData.views || 0,
//       difficulty: videoData.difficulty,
//       caloriesBurned: videoData.caloriesBurned,
//       muscleGroups: videoData.muscleGroups || [],
//       streamingUrl: videoData.streamingUrl, // Virtual field (for adaptive streaming)
//       hasAdaptiveStreaming: videoData.hasAdaptiveStreaming,
//       isWelcomeVideo: videoData.isWelcomeVideo,
//       // Include keys if needed for admin/processing
//       videoKey: videoData.videoKey,
//       thumbnailKey: videoData.thumbnailKey,
//       streamingManifestKey: videoData.streamingManifestKey
//     };
//   }
  
  /**
   * Helper: Get category title
   */
  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      beginner: 'Beginner Programs',
      equipment: 'With Equipment Programs',
      targeted: 'Targeted Workouts'
    };
    
    return titles[category] || category;
  }
  
  /**
   * Helper: Get category description
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      beginner: '30-day programs for those starting their fitness journey',
      equipment: '30-day dumbbell playlists for men and women',
      targeted: '3-5 min routines categorized by body goals'
    };
    
    return descriptions[category] || '';
  }
  
  /**
   * Helper: Get gender-specific description
   */
  private getGenderDescription(category: string, gender: 'male' | 'female'): string {
    const maleDescriptions: Record<string, string> = {
      beginner: 'Strength, fat loss, chest/arm workouts for men',
      equipment: 'Dumbbell strength training for men',
      targeted: 'Targeted workouts for men\'s fitness goals'
    };
    
    const femaleDescriptions: Record<string, string> = {
      beginner: 'Belly fat, toning, curves, simple workouts for women',
      equipment: 'Dumbbell toning and sculpting for women',
      targeted: 'Targeted workouts for women\'s fitness goals'
    };
    
    if (gender === 'male') {
      return maleDescriptions[category] || '';
    } else {
      return femaleDescriptions[category] || '';
    }
  }
  
  /**
   * Helper: Calculate program statistics
   */
  private calculateProgramStats(program: Program) {
    const videos = program.workoutVideos || [];
    
    const totalDuration = videos.reduce((sum, video) => sum + (video.duration || 0), 0);
    const totalVideos = videos.length;
    const totalCalories = videos.reduce((sum, video) => sum + (video.caloriesBurned || 0), 0);
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    
    return {
      totalDuration,
      totalVideos,
      totalCalories,
      totalViews,
      avgDurationPerVideo: totalVideos > 0 ? Math.round(totalDuration / totalVideos) : 0
    };
  }
  
  /**
   * Helper: Get video navigation
   */
  private async getVideoNavigation(programId: string, currentDay: number) {
    const [prevVideo, nextVideo] = await Promise.all([
      WorkoutVideo.findOne({
        where: {
          programId,
          day: { [Op.lt]: currentDay },
          isActive: true,
          isWelcomeVideo: false
        },
        order: [['day', 'DESC']]
      }),
      WorkoutVideo.findOne({
        where: {
          programId,
          day: { [Op.gt]: currentDay },
          isActive: true,
          isWelcomeVideo: false
        },
        order: [['day', 'ASC']]
      })
    ]);
    
    return {
      previous: prevVideo ? this.formatVideoForResponse(prevVideo) : null,
      next: nextVideo ? this.formatVideoForResponse(nextVideo) : null,
      currentDay,
      hasPrevious: !!prevVideo,
      hasNext: !!nextVideo
    };
  }
  
  /**
   * Helper: Calculate user streak
   */
    private async calculateStreak(userId: string, programId: string): Promise<number> {
        const activities = await ActivityHistory.findAll({
        where: {
            userId,
            programId,
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
   * Helper: Generate video sections (mock for now)
   */
  private generateVideoSections(video: WorkoutVideo) {
    // This is a mock. In production, you'd have a separate VideoSection model
    // that stores timestamps and titles for each section
    const sections = [
      { timestamp: 135, title: 'Neck and Shoulder Rolls' }, // 2:15
      { timestamp: 390, title: 'Arm Circles and Swings' },  // 6:30
      { timestamp: 525, title: 'Hip Rotations' },           // 8:45
      { timestamp: 540, title: 'Leg Swings and Lunges' }    // 9:00
    ];
    
    return sections;
  }
}