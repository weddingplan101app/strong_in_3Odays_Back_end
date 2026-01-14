// src/modules/subscription/subscription.route.ts
import { Router } from 'express';
import { SubscriptionController } from './subscription.controller';
import { Container } from 'typedi';
import { authMiddleware } from '../../middleware/auth.middleware';
// import { authMiddleware } from '../auth/auth.middleware'; // Assuming you have auth middleware

const router = Router();
const subscriptionController = Container.get(SubscriptionController);

// Apply auth middleware to all routes except webhook
router.use((req, res, next) => {
  if (req.path === '/webhook/telco') {
    return next(); // Skip auth for webhook
  }
  return authMiddleware(req, res, next); // Apply auth for other routes
});

// User subscription endpoints
router.get('/me', (req, res) => subscriptionController.getCurrentSubscription(req, res));
router.get('/history', (req, res) => subscriptionController.getSubscriptionHistory(req, res));
router.get('/status', (req, res) => subscriptionController.checkSubscriptionStatus(req, res));
router.post('/cancel', (req, res) => subscriptionController.cancelSubscription(req, res));

// Telco webhook endpoint (no auth required, but signature verification)
router.post('/webhook/telco', (req, res) => subscriptionController.processTelcoWebhook(req, res));

// Admin endpoints (add admin middleware if needed)
router.get('/admin/stats', (req, res) => subscriptionController.getSubscriptionStats(req, res));
router.get('/admin/active', (req, res) => subscriptionController.getAllActiveSubscriptions(req, res));

export default router;