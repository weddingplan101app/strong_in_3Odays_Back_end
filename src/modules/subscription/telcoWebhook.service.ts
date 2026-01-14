// src/modules/subscription/telcoWebhook.service.ts
import { Service } from 'typedi';
import crypto from 'crypto';
import { SubscriptionService } from './subscription.service';
import { User, Subscription } from '../../models';
import { logger } from '../../utils/logger';

@Service()
export class TelcoWebhookService {
  constructor(private subscriptionService: SubscriptionService) {}

  async processAggregatorWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      logger.info(`📞 Processing aggregator webhook: ${JSON.stringify(payload)}`);

      const { type, telco, product, details } = payload;

      if (!details?.phone) {
        throw new Error('No phone number in webhook payload');
      }

      const phone = User.formatPhoneNumber(details.phone);

      switch (type) {
        case 'SYNC_NOTIFICATION':
          await this.handleNewSubscription(phone, product, details);
          break;

        case 'RENEWAL_NOTIFICATION':
          await this.handleRenewal(phone, product, details);
          break;

        case 'UNSUBSCRIPTION_NOTIFICATION':
          await this.handleUnsubscription(phone, product, details);
          break;

        case 'INSUFFICIENT_BALANCE':
          await this.handleBillingFailed(phone, product, details, 'insufficient_balance');
          break;

        default:
          logger.warn(`⚠️ Unhandled webhook type: ${type}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      logger.error('❌ Error processing webhook:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async handleNewSubscription(phone: string, product: any, details: any): Promise<void> {
    // Find or create user
    let user = await User.findOne({ where: { phoneFormatted: phone } });

    if (!user) {
      // Create user instance manually
      user = new User();
      
      // Set all properties
      user.phone = details.phone;
      user.phoneFormatted = phone;
      user.name = null;
      user.email = null;
      user.subscriptionStatus = 'active';
      user.subscriptionPlan = this.getPlanTypeFromAmount(details.amount);
      user.subscriptionEndDate = this.calculateEndDate(this.getPlanTypeFromAmount(details.amount));
      user.dailyStreak = 0;
      user.genderPreference = 'both';
      user.fitnessLevel = 'beginner';
      user.equipmentAvailable = false;
      user.hasCompletedWelcomeVideo = false;
      user.timezone = 'Africa/Lagos';
      user.totalWorkouts = 0;
      user.totalMinutes = 0;
      user.lastWorkoutDate = null;
      user.metadata = {};
      
      await user.save();
      logger.info(`👤 Created new user from webhook: ${phone}`);
    } else {
      // Update existing user subscription using direct assignment
      user.subscriptionStatus = 'active';
      user.subscriptionPlan = this.getPlanTypeFromAmount(details.amount);
      user.subscriptionEndDate = this.calculateEndDate(this.getPlanTypeFromAmount(details.amount));
      await user.save();
    }

    // Create subscription record
    const subscription = new Subscription();
    
    // Set all required properties
    subscription.userId = user.id;
    subscription.telcoRef = details.telco_ref;
    subscription.planType = this.getPlanTypeFromAmount(details.amount);
    subscription.amount = details.amount;
    subscription.status = 'active';
    subscription.channel = details.channel || 'SMS';
    subscription.telco = details.telco || 'MTN';
    subscription.phone = phone;
    subscription.telcoStatusCode = details.telco_status_code || '0';
    subscription.startDate = new Date();
    subscription.endDate = this.calculateEndDate(this.getPlanTypeFromAmount(details.amount));
    
    // Set optional properties
    if (product?.id) subscription.aggregatorProductId = product.id;
    if (details.telco_ref) subscription.aggregatorTransactionId = details.telco_ref;
    if (details.telco_status_message) subscription.telcoStatusMessage = details.telco_status_message;
    if (details) subscription.aggregatorResponse = details;
    subscription.renewalCount = 0;

    await subscription.save();

    logger.info(`✅ Subscription activated for ${phone}`);
  }

  async handleRenewal(phone: string, product: any, details: any): Promise<void> {
    const user = await User.findOne({ where: { phoneFormatted: phone } });
    
    if (!user) {
      throw new Error(`User not found for phone: ${phone}`);
    }

    const planType = this.getPlanTypeFromAmount(details.amount);
    const endDate = this.calculateEndDate(planType);

    // Update user subscription using direct assignment
    user.subscriptionEndDate = endDate;
    await user.save();

    // Find active subscription
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (subscription) {
      // Update existing subscription
      subscription.endDate = endDate;
      subscription.telcoRef = details.telco_ref;
      subscription.telcoStatusCode = details.telco_status_code;
      subscription.renewalCount = (subscription.renewalCount || 0) + 1;
      
      // Update optional properties
      if (details.telco_status_message) subscription.telcoStatusMessage = details.telco_status_message;
      if (details) subscription.aggregatorResponse = details;
      
      await subscription.save();
    } else {
      // Create new subscription if not found
      const newSubscription = new Subscription();
      
      // Set all required properties
      newSubscription.userId = user.id;
      newSubscription.telcoRef = details.telco_ref;
      newSubscription.planType = planType;
      newSubscription.amount = details.amount;
      newSubscription.status = 'active';
      newSubscription.channel = details.channel || 'SMS';
      newSubscription.telco = details.telco || 'MTN';
      newSubscription.phone = phone;
      newSubscription.telcoStatusCode = details.telco_status_code;
      newSubscription.startDate = new Date();
      newSubscription.endDate = endDate;
      
      // Set optional properties
      if (product?.id) newSubscription.aggregatorProductId = product.id;
      if (details.telco_ref) newSubscription.aggregatorTransactionId = details.telco_ref;
      if (details.telco_status_message) newSubscription.telcoStatusMessage = details.telco_status_message;
      if (details) newSubscription.aggregatorResponse = details;
      newSubscription.renewalCount = 1;

      await newSubscription.save();
    }

    logger.info(`🔄 Renewal processed for ${phone}`);
  }

  async handleUnsubscription(phone: string, product: any, details: any): Promise<void> {
    const user = await User.findOne({ where: { phoneFormatted: phone } });
    
    if (!user) {
      throw new Error(`User not found for phone: ${phone}`);
    }

    // Update user subscription status
    user.subscriptionStatus = 'cancelled';
    await user.save();

    // Find active subscriptions
    const activeSubscriptions = await Subscription.findAll({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    // Update each active subscription
    for (const subscription of activeSubscriptions) {
      subscription.status = 'cancelled';
      subscription.endDate = new Date();
      
      // Store unsubscription reason in aggregatorResponse if available
      if (details.reason) {
        const currentResponse = subscription.aggregatorResponse || {};
        subscription.aggregatorResponse = {
          ...currentResponse,
          cancellationReason: details.reason,
          cancelledAt: new Date().toISOString()
        };
      }
      
      await subscription.save();
    }

    logger.info(`❌ Unsubscription processed for ${phone}`);
  }

  async handleBillingFailed(phone: string, product: any, details: any, failureType: string): Promise<void> {
    const user = await User.findOne({ where: { phoneFormatted: phone } });
    
    if (!user) {
      throw new Error(`User not found for phone: ${phone}`);
    }

    // Update user subscription status
    user.subscriptionStatus = 'failed';
    await user.save();

    // Find active subscriptions
    const activeSubscriptions = await Subscription.findAll({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    // Update each active subscription
    for (const subscription of activeSubscriptions) {
      subscription.status = 'failed';
      subscription.telcoStatusCode = details.telco_status_code;
      
      // Store failure reason in aggregatorResponse
      const currentResponse = subscription.aggregatorResponse || {};
      subscription.aggregatorResponse = {
        ...currentResponse,
        failureType: failureType,
        failedAt: new Date().toISOString(),
        telcoStatusCode: details.telco_status_code,
        telcoStatusMessage: details.telco_status_message || currentResponse.telcoStatusMessage
      };
      
      await subscription.save();
    }

    logger.info(`💳 Billing failure (${failureType}) for ${phone}`);
  }

  verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
    if (!secret) return true; // Skip verification if no secret configured

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }

  private getPlanTypeFromAmount(amount: number): 'daily' | 'weekly' | 'monthly' {
    if (amount === 50000) return 'weekly';
    if (amount === 150000) return 'monthly';
    return 'daily'; // Default
  }

  private calculateEndDate(planType: string): Date {
    const date = new Date();
    switch (planType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date;
  }
}