// modules/user/user-dashboard.route.ts
import { Router, Request, Response, NextFunction } from 'express';
import Container from 'typedi';
import { UserDashboardController, AuthRequest } from './user-dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// Initialize router
const router = Router();
const dashboardController = Container.get(UserDashboardController);

// Create a type-safe wrapper to handle async controller methods
const handleAsync = (controllerMethod: (req: AuthRequest, res: Response) => Promise<any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controllerMethod(req as AuthRequest, res);
    } catch (error) {
      next(error);
    }
  };

// =================== PROTECTED ROUTES ===================
// All dashboard routes require authentication

// Main dashboard overview (complete dashboard data)
router.get('/overview', authMiddleware, handleAsync(
  (req, res) => dashboardController.getDashboardOverview(req, res)
));

// Get weekly progress for charts
router.get('/progress/weekly', authMiddleware, handleAsync(
  (req, res) => dashboardController.getWeeklyProgress(req, res)
));

// Get user achievements and badges
router.get('/achievements', authMiddleware, handleAsync(
  (req, res) => dashboardController.getUserAchievements(req, res)
));

// Update user streak (called after workout completion)
router.post('/streak/update', authMiddleware, handleAsync(
  (req, res) => dashboardController.updateUserStreak(req, res)
));

// Get subscription status
router.get('/subscription/status', authMiddleware, handleAsync(
  (req, res) => dashboardController.getSubscriptionStatus(req, res)
));

// Get stats summary (lighter version of overview)
router.get('/stats/summary', authMiddleware, handleAsync(
  (req, res) => dashboardController.getUserStatsSummary(req, res)
));

// Get next video to continue watching
router.get('/continue-watching', authMiddleware, handleAsync(
  (req, res) => dashboardController.getContinueWatchingVideo(req, res)
));

// Get recommended workouts
router.get('/recommended-workouts', authMiddleware, handleAsync(
  (req, res) => dashboardController.getUserRecommendedWorkouts(req, res)
));

// Get completed programs
router.get('/programs/completed', authMiddleware, handleAsync(
  (req, res) => dashboardController.getUserCompletedPrograms(req, res)
));

export default router;