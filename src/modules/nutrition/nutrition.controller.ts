// src/controllers/nutrition.controller.ts
import { Request, Response } from 'express';
import { Service } from 'typedi';
import { NutritionService } from './nutrition.service';
import { logger } from '../../utils/logger';

@Service()
export class NutritionController {
  constructor(private nutritionService: NutritionService) {}

  /**
   * Get all recipes (for Healthy Recipes section - PRD Section 4)
   */
  getRecipes = async (req: Request, res: Response) => {
    try {
      logger.info('Controller: Fetching all recipes');
      
      const recipes = await this.nutritionService.getRecipes();
      
      res.status(200).json({
        success: true,
        message: 'Recipes fetched successfully',
        data: recipes
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get recipes', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch recipes'
      });
    }
  };

  /**
   * Get recipe by ID
   */
  getRecipeById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Recipe ID is required'
        });
      }

      logger.info('Controller: Fetching recipe by ID', { id });
      
      const recipe = await this.nutritionService.getRecipeById(id);
      
      res.status(200).json({
        success: true,
        message: 'Recipe fetched successfully',
        data: recipe
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get recipe by ID', {
        error: error.message,
        id: req.params.id
      });
      
      const statusCode = error.message === 'Recipe not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch recipe'
      });
    }
  };

  /**
   * Get nutrition tips (optionally filtered by day)
   */
  getTips = async (req: Request, res: Response) => {
    try {
      const { day } = req.query; // Optional: filter by day
      
      logger.info('Controller: Fetching nutrition tips', { day });
      
      const tips = await this.nutritionService.getTips(day as string);
      
      res.status(200).json({
        success: true,
        message: 'Nutrition tips fetched successfully',
        data: tips
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get nutrition tips', {
        error: error.message,
        day: req.query.day
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch nutrition tips'
      });
    }
  };

  /**
   * Get nutrition items by category
   */
  getByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category parameter is required'
        });
      }

      logger.info('Controller: Fetching nutrition items by category', { category });
      
      const items = await this.nutritionService.getByCategory(category);
      
      res.status(200).json({
        success: true,
        message: `Nutrition items for ${category} fetched successfully`,
        data: items
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get nutrition items by category', {
        error: error.message,
        category: req.params.category
      });
      
      const statusCode = error.message.includes('Invalid category') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch category items'
      });
    }
  };

  /**
   * Get nutrition for a specific program day
   */
  getNutritionForDay = async (req: Request, res: Response) => {
    try {
      const { day } = req.params;
      
      if (!day) {
        return res.status(400).json({
          success: false,
          error: 'Day parameter is required'
        });
      }

      const dayNumber = parseInt(day, 10);
      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
        return res.status(400).json({
          success: false,
          error: 'Day must be a number between 1 and 30'
        });
      }

      logger.info('Controller: Fetching nutrition for day', { day: dayNumber });
      
      const nutrition = await this.nutritionService.getNutritionForDay(dayNumber);
      
      res.status(200).json({
        success: true,
        message: `Nutrition for day ${dayNumber} fetched successfully`,
        data: nutrition
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get nutrition for day', {
        error: error.message,
        day: req.params.day
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch nutrition for day'
      });
    }
  };

  /**
   * Get nutrition categories
   */
  getNutritionCategories = async (req: Request, res: Response) => {
    try {
      logger.info('Controller: Fetching nutrition categories');
      
      const categories = await this.nutritionService.getNutritionCategories();
      
      res.status(200).json({
        success: true,
        message: 'Nutrition categories fetched successfully',
        data: categories
      });
    } catch (error: any) {
      logger.error('Controller: Failed to get nutrition categories', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch nutrition categories'
      });
    }
  };

  /**
   * Search nutrition items
   */
  searchNutrition = async (req: Request, res: Response) => {
    try {
      const { q, category, difficulty, maxPrepTime, maxCalories } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Build filters object
      const filters: any = {};
      if (category) filters.category = category;
      if (difficulty) filters.difficulty = difficulty;
      if (maxPrepTime) filters.maxPrepTime = parseInt(maxPrepTime as string, 10);
      if (maxCalories) filters.maxCalories = parseInt(maxCalories as string, 10);

      logger.info('Controller: Searching nutrition items', {
        query: q,
        filters
      });
      
      const results = await this.nutritionService.searchNutrition(q as string, filters);
      
      res.status(200).json({
        success: true,
        message: 'Nutrition search completed successfully',
        data: results
      });
    } catch (error: any) {
      logger.error('Controller: Failed to search nutrition items', {
        error: error.message,
        query: req.query.q,
        filters: req.query
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search nutrition items'
      });
    }
  };
}