// src/routes/nutrition.routes.ts
import { Router } from 'express';
import Container from 'typedi';
import { NutritionController } from './nutrition.controller';
// If you need authentication for some routes later:
// import { authMiddleware } from '../middleware/auth.middleware';

// Initialize router
const router = Router();
const nutritionController = Container.get(NutritionController);

// =================== PUBLIC ROUTES ===================
// These routes are accessible without authentication

// Get all recipes (for Healthy Recipes section - PRD Section 4)
router.get('/recipes', (req, res) => nutritionController.getRecipes(req, res));

// Get recipe by ID
router.get('/recipes/:id', (req, res) => nutritionController.getRecipeById(req, res));

// Get nutrition tips (optional: filter by day)
router.get('/tips', (req, res) => nutritionController.getTips(req, res));

// Get nutrition items by category
router.get('/category/:category', (req, res) => nutritionController.getByCategory(req, res));

// Get nutrition for specific program day (1-30)
router.get('/day/:day', (req, res) => nutritionController.getNutritionForDay(req, res));

// Get all nutrition categories with counts
router.get('/categories', (req, res) => nutritionController.getNutritionCategories(req, res));

// Search nutrition items (recipes and tips)
router.get('/search', (req, res) => nutritionController.searchNutrition(req, res));

// =================== PROTECTED ROUTES (if needed later) ===================
// Example: If you want users to save favorite recipes or track nutrition
// router.get('/user/favorites', authMiddleware, (req, res) => nutritionController.getUserFavorites(req, res));
// router.post('/recipes/:id/favorite', authMiddleware, (req, res) => nutritionController.toggleFavorite(req, res));

export default router;