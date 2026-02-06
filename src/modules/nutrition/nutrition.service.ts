// src/services/nutrition/nutrition.service.ts
import { Service, Inject } from 'typedi';
import { Op, Sequelize, QueryTypes } from 'sequelize';

import { logger } from '../../utils/logger';
import { Nutrition } from '../../models/Nutrition.model';
import { VideoStreamService } from '../video/video-stream.service';

@Service()
export class NutritionService {
  
  constructor(
    @Inject() private videoStreamService: VideoStreamService
  ) {}

  /**
   * Get all active recipes for the Healthy Recipes section (PRD Section 4)
   */
  async getRecipes() {
    try {
      logger.info('Fetching all recipes for Healthy Recipes section');
      
      const recipes = await Nutrition.scope('recipes').findAll({
        attributes: [
          'id',
          'title',
          'description',
          'imageUrl',
          'calories',
          'prepTime',
          'category',
          'protein_g',
          'carbs_g',
          'fat_g',
          'fiber_g',
          'servings',
          'difficulty',
          'sortOrder'
        ],
        order: [['sort_order', 'ASC']]
      });

      const formattedRecipes = recipes.map(recipe => 
        this.formatRecipeForList(recipe)
      );

      logger.info(`Fetched ${formattedRecipes.length} recipes`);
      
      return formattedRecipes;
    } catch (error: any) {
      logger.error('Failed to fetch recipes', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recipe by ID with full details (for recipe details page)
   */
  async getRecipeById(id: string) {
    try {
      logger.info(`Fetching recipe details: ${id}`);
      
      const recipe = await Nutrition.findOne({
        where: {
          id,
          category: 'recipe',
          isActive: true
        }
      });

      if (!recipe) {
        logger.warn(`Recipe not found: ${id}`);
        throw new Error('Recipe not found');
      }

      // Format with nutrition facts and other details
      const formattedRecipe = this.formatRecipeForDetail(recipe);
      
      logger.info(`Recipe details fetched: ${id}`, {
        title: recipe.title,
        hasVideo: !!recipe.videoUrl
      });

      return formattedRecipe;
    } catch (error: any) {
      logger.error(`Failed to fetch recipe: ${id}`, {
        error: error.message,
        id
      });
      throw error;
    }
  }

  /**
   * Get nutrition tips (can be filtered by day for program integration)
   */
  async getTips(day?: string) {
    try {
      logger.info('Fetching nutrition tips', { day });
      
      const whereClause: any = {
        category: 'tip',
        is_active: true
      };

      if (day) {
        whereClause.day = parseInt(day);
      }

      const tips = await Nutrition.findAll({
        where: whereClause,
        order: [['day', 'ASC NULLS LAST'], ['sort_order', 'ASC']]
      });

      const formattedTips = tips.map(tip => 
        this.formatTipForResponse(tip)
      );

      logger.info(`Fetched ${formattedTips.length} tips`);
      
      return formattedTips;
    } catch (error: any) {
      logger.error('Failed to fetch nutrition tips', {
        error: error.message,
        day
      });
      throw error;
    }
  }

  /**
   * Get nutrition items by category (breakfast, lunch, dinner, snack, recipe, tip)
   */
  async getByCategory(category: string) {
    try {
      logger.info(`Fetching nutrition items by category: ${category}`);
      
      const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'recipe', 'tip'];
      
      if (!validCategories.includes(category)) {
        throw new Error('Invalid category. Must be one of: ' + validCategories.join(', '));
      }

      const items = await Nutrition.findAll({
        where: {
          category,
          isActive: true
        },
        order: [['sort_order', 'ASC']]
      });

      const formattedItems = items.map(item => {
        if (category === 'tip') {
          return this.formatTipForResponse(item);
        } else {
          return this.formatRecipeForList(item);
        }
      });

      logger.info(`Fetched ${formattedItems.length} items for category: ${category}`);
      
      return formattedItems;
    } catch (error: any) {
      logger.error(`Failed to fetch nutrition items for category: ${category}`, {
        error: error.message,
        category
      });
      throw error;
    }
  }

  /**
   * Get nutrition content for a specific program day (for 30-day programs)
   */
  async getNutritionForDay(day: number) {
    try {
      logger.info(`Fetching nutrition for day: ${day}`);
      
      const [breakfast, lunch, dinner, snack, tip] = await Promise.all([
        Nutrition.findOne({ 
          where: { 
            day, 
            category: 'breakfast', 
            isActive: true 
          }
        }),
        Nutrition.findOne({ 
          where: { 
            day, 
            category: 'lunch', 
            isActive: true 
          }
        }),
        Nutrition.findOne({ 
          where: { 
            day, 
            category: 'dinner', 
            isActive: true 
          }
        }),
        Nutrition.findOne({ 
          where: { 
            day, 
            category: 'snack', 
            isActive: true 
          }
        }),
        Nutrition.findOne({ 
          where: { 
            day, 
            category: 'tip', 
            isActive: true 
          }
        })
      ]);

      const formattedData = {
        day,
        breakfast: breakfast ? this.formatRecipeForList(breakfast) : null,
        lunch: lunch ? this.formatRecipeForList(lunch) : null,
        dinner: dinner ? this.formatRecipeForList(dinner) : null,
        snack: snack ? this.formatRecipeForList(snack) : null,
        tip: tip ? this.formatTipForResponse(tip) : null
      };

      logger.info(`Nutrition for day ${day} fetched successfully`);
      
      return formattedData;
    } catch (error: any) {
      logger.error(`Failed to fetch nutrition for day: ${day}`, {
        error: error.message,
        day
      });
      throw error;
    }
  }

  /**
   * Get all nutrition categories with counts
   */
  async getNutritionCategories() {
  try {
    logger.info('Fetching nutrition categories');
    
    const categories = await Nutrition.sequelize!.query(`
  SELECT 
    category,
    COUNT(id) as count
  FROM nutrition
  WHERE is_active = true
  GROUP BY category
  ORDER BY count DESC, category ASC
`, {
  type: QueryTypes.SELECT,
  raw: true
});
    logger.info('Nutrition categories fetched', {
      categoryCount: categories.length
    });

    return categories;
  } catch (error: any) {
    logger.error('Failed to fetch nutrition categories', {
      error: error.message
    });
    throw error;
  }
}

  /**
   * Search nutrition items (recipes and tips)
   */
  async searchNutrition(query: string, filters?: any) {
    try {
      logger.info(`Searching nutrition items: ${query}`, { query, filters });
      
      const where: any = {
        isActive: true,
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { ingredients: { [Op.contains]: [query] } } // Search in ingredients array
        ]
      };
      
      // Apply additional filters
      if (filters) {
        if (filters.category) where.category = filters.category;
        if (filters.difficulty) where.difficulty = filters.difficulty;
        if (filters.maxPrepTime) where.prep_time = { [Op.lte]: filters.maxPrepTime };
        if (filters.maxCalories) where.calories = { [Op.lte]: filters.maxCalories };
      }

      const items = await Nutrition.findAll({
        where,
        order: [['sort_order', 'ASC']]
      });

      const formattedItems = items.map(item => {
        if (item.category === 'tip') {
          return this.formatTipForResponse(item);
        } else {
          return this.formatRecipeForList(item);
        }
      });

      logger.info(`Search completed`, {
        query,
        results: formattedItems.length
      });

      return formattedItems;
    } catch (error: any) {
      logger.error(`Search nutrition items failed`, {
        error: error.message,
        query,
        filters
      });
      throw error;
    }
  }

  /**
   * Helper: Format recipe for list display (card view)
   */
  private formatRecipeForList(recipe: Nutrition) {
    const recipeData = recipe.toJSON ? recipe.toJSON() : recipe;
    
    return {
      id: recipeData.id,
      title: recipeData.title,
      description: recipeData.description,
      imageUrl: recipeData.imageUrl,
      calories: recipeData.calories,
      prepTime: recipeData.prepTime,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      nutritionFacts: {
        protein: recipeData.proteinG ? `${recipeData.proteinG}g` : null,
        carbs: recipeData.carbsG ? `${recipeData.carbsG}g` : null,
        fat: recipeData.fatG ? `${recipeData.fatG}g` : null,
        fiber: recipeData.fiberG ? `${recipeData.fiberG}g` : null
      },
      servings: recipeData.servings
    };
  }

  /**
   * Helper: Format recipe for detail view
   */
  private formatRecipeForDetail(recipe: Nutrition) {
    const recipeData = recipe.toJSON ? recipe.toJSON() : recipe;
    
    // Generate signed URL for video if exists
    let signedVideoUrl = null;
    if (recipeData.videoUrl) {
      try {
        // Extract video key from URL if needed, or use a direct approach
        // For now, we'll return the videoUrl as is
        signedVideoUrl = recipeData.videoUrl;
      } catch (error) {
        logger.warn('Could not generate signed video URL', {
          recipeId: recipeData.id,
          error: (error as Error).message
        });
      }
    }

    return {
      id: recipeData.id,
      title: recipeData.title,
      description: recipeData.description,
      detailedContent: recipeData.detailedContent,
      imageUrl: recipeData.imageUrl,
      videoUrl: signedVideoUrl,
      calories: recipeData.calories,
      ingredients: recipeData.ingredients || [],
      preparationSteps: recipeData.preparationSteps || [],
      prepTime: recipeData.prepTime,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      servings: recipeData.servings,
      nutritionFacts: {
        protein: recipeData.proteinG ? `${recipeData.proteinG}g` : null,
        carbs: recipeData.carbsG ? `${recipeData.carbsG}g` : null,
        fat: recipeData.fatG ? `${recipeData.fatG}g` : null,
        fiber: recipeData.fiberG ? `${recipeData.fiberG}g` : null
      },
      // Additional metadata
      day: recipeData.day,
      isActive: recipeData.isActive
    };
  }

  /**
   * Helper: Format tip for response
   */
  private formatTipForResponse(tip: Nutrition) {
    const tipData = tip.toJSON ? tip.toJSON() : tip;
    
    return {
      id: tipData.id,
      day: tipData.day,
      title: tipData.title,
      description: tipData.description,
      detailedContent: tipData.detailedContent,
      imageUrl: tipData.imageUrl,
      category: tipData.category,
      // Tips don't have nutrition facts or prep time
    };
  }
}