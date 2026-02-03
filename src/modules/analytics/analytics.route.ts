// routes/analytics.routes.ts
import { Router } from 'express';
import Container from 'typedi';
import { AnalyticsController, AuthRequest } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// Initialize router
const router = Router();
const analyticsController = Container.get(AnalyticsController);

// =================== PROTECTED ROUTES ===================
// ALL analytics routes require authentication (unlike programs which has some public routes)

// MAIN DASHBOARD ENDPOINT - Returns all data for phone screenshots
router.get('/dashboard', authMiddleware, (req: AuthRequest, res) => 
  analyticsController.getDashboardAnalytics(req, res)
);

// GET ACTIVITY HISTORY - With filtering options
router.get('/history', authMiddleware, (req: AuthRequest<any, any, any, { 
  limit?: string; 
  offset?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  programId?: string;
}>, res) => 
  analyticsController.getActivityHistory(req, res)
);

// GET ACTIVITY STATISTICS - Detailed analytics
router.get('/statistics', authMiddleware, (req: AuthRequest<any, any, any, {
  startDate?: string;
  endDate?: string;
}>, res) => 
  analyticsController.getActivityStatistics(req, res)
);

// GET WEEKLY SUMMARIES - Multiple weeks overview
router.get('/weekly-summaries', authMiddleware, (req: AuthRequest<any, any, any, {
  weeks?: string;
}>, res) => 
  analyticsController.getWeeklySummaries(req, res)
);

// GET CATEGORY BREAKDOWN - Detailed category analysis
router.get('/category-breakdown', authMiddleware, (req: AuthRequest<any, any, any, {
  startDate?: string;
  endDate?: string;
}>, res) => 
  analyticsController.getCategoryBreakdown(req, res)
);

// GET USER INSIGHTS - Personalized recommendations
router.get('/insights', authMiddleware, (req: AuthRequest, res) => 
  analyticsController.getUserInsights(req, res)
);

// =================== ALIAS ROUTES (for backward compatibility) ===================
// These routes point to existing functionality in your ProgramsController

// This route already exists in programs.routes.ts - we should keep it there
// router.get('/user/statistics', authMiddleware, (req: AuthRequest, res) => 
//   analyticsController.getUserStatistics(req, res)
// );

// This route already exists in programs.routes.ts - we should keep it there  
// router.get('/user/history', authMiddleware, (req: AuthRequest<any, any, any, { limit?: string; offset?: string }>, res) => 
//   analyticsController.getUserWorkoutHistory(req, res)
// );

export default router;