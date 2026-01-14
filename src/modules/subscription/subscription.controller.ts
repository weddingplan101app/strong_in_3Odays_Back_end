// src/modules/subscription/subscription.controller.ts
import { Request, Response } from 'express';
import { Service } from 'typedi';
import { SubscriptionService } from './subscription.service';
import { TelcoWebhookService } from './telcoWebhook.service';
import { logger } from '../../utils/logger';

@Service()
export class SubscriptionController {
  constructor(
    private subscriptionService: SubscriptionService,
    private telcoWebhookService: TelcoWebhookService
  ) {}

  /**
   * Get current user subscription
   */
  async getCurrentSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Assuming user is attached via auth middleware
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const subscription = await this.subscriptionService.getUserSubscription(userId);
      
      return res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Error getting subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscription details'
      });
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { reason } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await this.subscriptionService.cancelSubscription(userId, reason);
      
      return res.json(result);
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 10, offset = 0 } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await this.subscriptionService.getSubscriptionHistory(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      return res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error getting subscription history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscription history'
      });
    }
  }

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const hasActive = await this.subscriptionService.hasActiveSubscription(userId);
      
      return res.json({
        success: true,
        data: {
          hasActiveSubscription: hasActive
        }
      });
    } catch (error) {
      logger.error('Error checking subscription status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check subscription status'
      });
    }
  }

  /**
   * Process telco webhook
   */
  async processTelcoWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-signature'] as string;
      const secret = process.env.TELCO_WEBHOOK_SECRET;
      
      // Verify webhook signature
      const isValid = this.telcoWebhookService.verifyWebhookSignature(
        req.body,
        signature,
        secret || ''
      );
      
      if (!isValid) {
        logger.warn('⚠️ Invalid webhook signature received');
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
      
      logger.info('✅ Valid webhook signature verified');
      
      // Process the webhook
      const result = await this.telcoWebhookService.processAggregatorWebhook(req.body);
      
      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      logger.error('❌ Error processing webhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error processing webhook'
      });
    }
  }

  /**
   * Admin: Get subscription statistics
   */
  async getSubscriptionStats(req: Request, res: Response) {
    try {
      // Add admin authorization check here
      // if (!req.user?.isAdmin) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }
      
      const stats = await this.subscriptionService.getSubscriptionStats();
      
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting subscription stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscription statistics'
      });
    }
  }

  /**
   * Admin: Get all active subscriptions
   */
  async getAllActiveSubscriptions(req: Request, res: Response) {
    try {
      // Add admin authorization check here
      // if (!req.user?.isAdmin) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }
      
      const { page = 1, limit = 20 } = req.query;
      
      const subscriptions = await this.subscriptionService.getAllActiveSubscriptions(
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return res.json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      logger.error('Error getting all subscriptions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get subscriptions'
      });
    }
  }
}