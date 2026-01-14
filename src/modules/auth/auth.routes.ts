// src/services/auth.route.ts (UPDATED WITH MIDDLEWARE)
import { Router } from 'express';
import { Container } from 'typedi';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authController = Container.get(AuthController);

// Public routes (no authentication required)
router.get('/test', (req, res) => {
  console.log('✅ Test route called');
  res.json({ message: 'Auth route is working!' });
});

router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));
router.post('/check-phone', (req, res) => authController.checkPhoneExists(req, res));
router.get('/health', (req, res) => authController.healthCheck(req, res));

// Apply authentication middleware to all routes below
router.use(authMiddleware);

// Protected routes (authentication required)
router.get('/profile', (req, res) => authController.getProfile(req, res));
router.put('/profile', (req, res) => authController.updateProfile(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/workout', (req, res) => authController.recordWorkout(req, res));
router.get('/activity-logs', (req, res) => authController.getUserActivityLogs(req, res));

export default router;