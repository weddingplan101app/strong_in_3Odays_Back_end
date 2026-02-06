import { Router } from 'express';
import { TargetedWorkoutsController } from './targeted-workout.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const targetedWorkoutsController = new TargetedWorkoutsController();

// =================== PUBLIC ROUTES ===================

// Get targeted workouts grouped by gender (similar to programs by category)
router.get('/grouped/gender', targetedWorkoutsController.getTargetedWorkoutsGroupedByGender);

// Get targeted workouts for homepage
router.get('/homepage', targetedWorkoutsController.getTargetedWorkoutsForHomepage);

// Get targeted workouts by specific category (belly_fat, toning, etc.)
router.get('/category/:category', targetedWorkoutsController.getTargetedWorkoutsByCategory);

// Get all targeted workouts with filters
router.get('/', targetedWorkoutsController.getTargetedWorkouts);

// Get targeted workout by ID
router.get('/:id', targetedWorkoutsController.getTargetedWorkoutById);


// Get targeted workouts by gender
router.get('/gender/:gender', targetedWorkoutsController.getTargetedWorkoutsByGender);

// Get targeted workouts by body part
router.get('/body-part/:body_part', targetedWorkoutsController.getTargetedWorkoutsByBodyPart);

// Get quick workouts (3-5 minutes)
router.get('/quick/all', targetedWorkoutsController.getQuickWorkouts);

// Get popular workouts
router.get('/popular/all', targetedWorkoutsController.getPopularWorkouts);

// Search workouts
router.get('/search/all', targetedWorkoutsController.searchTargetedWorkouts);

// Get available categories
router.get('/categories/all', targetedWorkoutsController.getCategories);

// Get available body parts
router.get('/body-parts/all', targetedWorkoutsController.getBodyParts);

// Get workout clip
router.get('/clips/:clipId', targetedWorkoutsController.getTargetedWorkoutClip);

// =================== PROTECTED ROUTES ===================
// Add more protected routes as needed

export default router;