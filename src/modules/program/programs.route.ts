import { Router } from 'express';
import Container from 'typedi';
import { ProgramsController, AuthRequest } from './programs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// Initialize router
const router = Router();
const programsController = Container.get(ProgramsController);

// =================== PUBLIC ROUTES ===================
// These routes are accessible without authentication

// Get homepage data with all program categories
router.get('/homepage', (req, res) => programsController.getHomepageData(req, res));

// Get programs by category
// Supported categories: beginner, equipment, targeted
// Optional query params: gender (male/female), equipmentType (e.g., 'dumbbells', 'resistance-band')
router.get('/category/:category', (req, res) => programsController.getProgramsByCategory(req, res));

// Search programs
router.get('/search', (req, res) => programsController.searchPrograms(req, res));

// Get all programs (paginated)
router.get('/', (req, res) => programsController.getAllPrograms(req, res));

// Get program details - public but handles auth if present
router.get('/:slug', (req, res) => 
  programsController.getProgramDetails(req as AuthRequest, res)
);

// Get workout video by day - public but handles auth if present
router.get('/:programSlug/workout/:day', (req, res) => 
  programsController.getWorkoutVideo(req as AuthRequest, res)
);

// =================== PROTECTED ROUTES ===================
// These routes require authentication

// Get user program progress
router.get('/:slug/progress', authMiddleware, (req, res) => 
  programsController.getUserProgramProgress(req as AuthRequest, res)
);

// Mark workout as completed
router.post('/:slug/complete', authMiddleware, (req, res) => 
  programsController.markWorkoutCompleted(req as AuthRequest, res)
);

// Rate a completed workout
router.post('/:slug/workout/:day/rate', authMiddleware, (req, res) => 
  programsController.rateWorkout(req as AuthRequest, res)
);

// Get workout video sections/timestamps
router.get('/videos/:videoId/sections', authMiddleware, (req, res) => 
  programsController.getWorkoutVideoSections(req as AuthRequest, res)
);

// Get user's workout history
router.get('/user/history', authMiddleware, (req, res) => 
  programsController.getUserWorkoutHistory(req as AuthRequest, res)
);

// Get user workout statistics
router.get('/user/statistics', authMiddleware, (req, res) => 
  programsController.getUserStatistics(req as AuthRequest, res)
);

export default router;