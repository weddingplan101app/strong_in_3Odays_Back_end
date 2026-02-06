import { Request, Response } from 'express';
import Container from 'typedi';
import { TargetedWorkoutsService } from './targeted-workout.service';
import { logger } from '../../utils/logger';

// Define authenticated request interface
export interface AuthRequest<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    phone: string;
    // ... other user properties
  };
}

export class TargetedWorkoutsController {
  private targetedWorkoutsService: TargetedWorkoutsService;

  constructor() {
    this.targetedWorkoutsService = Container.get(TargetedWorkoutsService);
  }

  /**
   * Get targeted workouts grouped by gender (Public)
   */
  getTargetedWorkoutsGroupedByGender = async (req: Request, res: Response) => {
    try {
      const { 
        body_part, 
        category, 
        difficulty,
        equipment_required
      } = req.query;

      const filter: any = {
        ...(body_part && { body_part: body_part as string }),
        ...(category && { category: category as string }),
        ...(difficulty && { difficulty: difficulty as string }),
        ...(equipment_required !== undefined && { 
          equipment_required: equipment_required === 'true' 
        })
      };

      const data = await this.targetedWorkoutsService.getTargetedWorkoutsGroupedByGender(filter);
      
      res.status(200).json({
        success: true,
        message: 'Targeted workouts grouped by gender retrieved successfully',
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts grouped by gender', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts grouped by gender'
      });
    }
  };

  /**
   * Get targeted workouts for homepage (Public)
   */
  getTargetedWorkoutsForHomepage = async (req: Request, res: Response) => {
    try {
      const data = await this.targetedWorkoutsService.getTargetedWorkoutsForHomepage();
      
      res.status(200).json({
        success: true,
        message: 'Targeted workouts for homepage retrieved successfully',
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts for homepage', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts for homepage'
      });
    }
  };

  /**
   * Get targeted workouts by category (Public)
   */
  getTargetedWorkoutsByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { gender } = req.query;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category parameter is required'
        });
      }

      const validCategories = ['belly_fat', 'toning', 'strength', 'cardio', 'flexibility', 'curves'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      if (gender && !['male', 'female'].includes(gender as string)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid gender. Must be: male or female'
        });
      }

      logger.info('Controller: Fetching targeted workouts by category', {
        category,
        gender
      });

      const data = await this.targetedWorkoutsService.getTargetedWorkoutsByCategory(
        category,
        gender as 'male' | 'female' | undefined
      );
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts by category', {
        error: error.message,
        category: req.params.category,
        gender: req.query.gender
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts by category'
      });
    }
  };

  /**
   * Get all targeted workouts with filters (Public)
   */
  getTargetedWorkouts = async (req: Request, res: Response) => {
    try {
      const { 
        gender, 
        body_part, 
        category, 
        difficulty,
        equipment_required,
        limit = 20,
        page = 1
      } = req.query;

      const filter = {
        ...(gender && { gender_target: gender as string }),
        ...(body_part && { body_part: body_part as string }),
        ...(category && { category: category as string }),
        ...(difficulty && { difficulty: difficulty as string }),
        ...(equipment_required !== undefined && { 
          equipment_required: equipment_required === 'true' 
        })
      };

      const result = await this.targetedWorkoutsService.getTargetedWorkouts(
        filter,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        message: 'Targeted workouts retrieved successfully',
        data: result.workouts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts'
      });
    }
  };

  /**
   * Get targeted workout by ID (Public)
   */
  getTargetedWorkoutById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Workout ID is required'
        });
      }

      const workout = await this.targetedWorkoutsService.getTargetedWorkoutById(id);
      
      res.status(200).json({
        success: true,
        message: 'Targeted workout retrieved successfully',
        data: workout
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workout by ID', {
        error: error.message,
        id: req.params.id
      });
      
      const statusCode = error.message === 'Targeted workout not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch targeted workout'
      });
    }
  };

  /**
   * Get targeted workouts by gender (Public)
   */
  getTargetedWorkoutsByGender = async (req: Request, res: Response) => {
    try {
      const { gender } = req.params;
      const { body_part, category, difficulty } = req.query;
      
      if (!['male', 'female', 'both'].includes(gender)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid gender parameter. Use: male, female, or both'
        });
      }

      const workouts = await this.targetedWorkoutsService.getTargetedWorkoutsByGender(
        gender,
        {
          ...(body_part && { body_part: body_part as string }),
          ...(category && { category: category as string }),
          ...(difficulty && { difficulty: difficulty as string })
        }
      );

      res.status(200).json({
        success: true,
        message: `Targeted workouts for ${gender} retrieved successfully`,
        data: workouts,
        count: workouts.length
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts by gender', {
        error: error.message,
        gender: req.params.gender
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts by gender'
      });
    }
  };

  /**
   * Get targeted workouts by body part (Public)
   */
  getTargetedWorkoutsByBodyPart = async (req: Request, res: Response) => {
    try {
      const { body_part } = req.params;
      const { gender, difficulty } = req.query;

      const workouts = await this.targetedWorkoutsService.getTargetedWorkoutsByBodyPart(
        body_part,
        {
          ...(gender && { genderTarget: gender as string }),
          ...(difficulty && { difficulty: difficulty as string })
        }
      );

      res.status(200).json({
        success: true,
        message: `Targeted workouts for ${body_part} retrieved successfully`,
        data: workouts,
        count: workouts.length
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workouts by body part', {
        error: error.message,
        body_part: req.params.body_part
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch targeted workouts by body part'
      });
    }
  };

  /**
   * Get quick workouts (3-5 minutes) (Public)
   */
  getQuickWorkouts = async (req: Request, res: Response) => {
    try {
      const { gender, body_part } = req.query;
      
      const workouts = await this.targetedWorkoutsService.getQuickWorkouts({
        ...(gender && { genderTarget: gender as string }),
        ...(body_part && { bodyPart: body_part as string })
      });

      res.status(200).json({
        success: true,
        message: 'Quick workouts (3-5 mins) retrieved successfully',
        data: workouts,
        count: workouts.length
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get quick workouts', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quick workouts'
      });
    }
  };

  /**
   * Get popular targeted workouts (Public)
   */
  getPopularWorkouts = async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const workouts = await this.targetedWorkoutsService.getPopularWorkouts(
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        message: 'Popular workouts retrieved successfully',
        data: workouts,
        count: workouts.length
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get popular workouts', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular workouts'
      });
    }
  };

  /**
   * Search targeted workouts (Public)
   */
  searchTargetedWorkouts = async (req: Request, res: Response) => {
    try {
      const { q, tags, focus_areas, gender, body_part } = req.query;
      
      if (!q && !tags && !focus_areas) {
        return res.status(400).json({
          success: false,
          error: 'Please provide search query, tags, or focus areas'
        });
      }

      const workouts = await this.targetedWorkoutsService.searchTargetedWorkouts({
        query: q as string,
        tags: tags ? (tags as string).split(',') : undefined,
        focus_areas: focus_areas ? (focus_areas as string).split(',') : undefined,
        gender: gender as string,
        body_part: body_part as string
      });

      res.status(200).json({
        success: true,
        message: 'Workouts search results',
        data: workouts,
        count: workouts.length
      });
    } catch (error: any) {
      logger.error('Controller: Failed to search targeted workouts', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to search workouts'
      });
    }
  };

  /**
   * Get workout categories (Public)
   */
  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.targetedWorkoutsService.getWorkoutCategories();
      
      res.status(200).json({
        success: true,
        message: 'Workout categories retrieved successfully',
        data: categories
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get categories', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout categories'
      });
    }
  };

  /**
   * Get body parts (Public)
   */
  getBodyParts = async (req: Request, res: Response) => {
    try {
      const bodyParts = await this.targetedWorkoutsService.getBodyParts();
      
      res.status(200).json({
        success: true,
        message: 'Body parts retrieved successfully',
        data: bodyParts
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get body parts', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch body parts'
      });
    }
  };

  /**
   * Get targeted workout clip (Public)
   */
  getTargetedWorkoutClip = async (req: Request, res: Response) => {
    try {
      const { clipId } = req.params;
      
      if (!clipId) {
        return res.status(400).json({
          success: false,
          error: 'Clip ID is required'
        });
      }

      const clip = await this.targetedWorkoutsService.getTargetedWorkoutClip(clipId);
      
      res.status(200).json({
        success: true,
        message: 'Workout clip retrieved successfully',
        data: clip
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get targeted workout clip', {
        error: error.message,
        clipId: req.params.clipId
      });
      
      const statusCode = error.message === 'Targeted workout clip not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch workout clip'
      });
    }
  };
}