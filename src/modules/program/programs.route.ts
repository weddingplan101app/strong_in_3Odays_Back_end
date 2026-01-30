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
router.get('/:slug', (req: AuthRequest<{ slug: string }>, res) => 
  programsController.getProgramDetails(req, res)
);

// Get workout video by day - public but handles auth if present
router.get('/:programSlug/workout/:day', (req: AuthRequest<{ programSlug: string, day: string }>, res) => 
  programsController.getWorkoutVideo(req, res)
);

// =================== PROTECTED ROUTES ===================
// These routes require authentication

// Get user program progress
router.get('/:programSlug/progress', authMiddleware, (req: AuthRequest<{ programSlug: string }>, res) => 
  programsController.getUserProgramProgress(req, res)
);

router.post('/:programSlug/start', authMiddleware, (req: AuthRequest<{ programSlug: string }, any, { day: string }>, res) => 
  programsController.markWorkoutStarted(req, res)
);


// Mark workout as completed
router.post('/:programSlug/complete', authMiddleware, (req: AuthRequest<{ programSlug: string }, any, { day: string; timeSpent: string }>, res) => 
  programsController.markWorkoutCompleted(req, res)
);

// Rate a completed workout
router.post('/:programSlug/workout/:day/rate', authMiddleware, (req: AuthRequest<{ programSlug: string; day: string }, any, { rating: string }>, res) => 
  programsController.rateWorkout(req, res)
);

// Get workout video sections/timestamps
router.get('/videos/:videoId/sections', authMiddleware, (req: AuthRequest<{ videoId: string }>, res) => 
  programsController.getWorkoutVideoSections(req, res)
);

// Get user's workout history
router.get('/user/history', authMiddleware, (req: AuthRequest<any, any, any, { limit?: string; offset?: string }>, res) => 
  programsController.getUserWorkoutHistory(req, res)
);

// Get user workout statistics
router.get('/user/statistics', authMiddleware, (req: AuthRequest, res) => 
  programsController.getUserStatistics(req, res)
);

export default router;