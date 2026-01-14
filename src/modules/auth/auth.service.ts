// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Subscription, ActivityLog } from '../../models/index'; // Added ActivityLog
import { 
  BadRequestException, 
  UnauthorizedException, 
  NotFoundException,
  ForbiddenException 
} from '../../exceptions/http.exceptions';
import { logUserActivity } from '../../helpers/activityLogger.helper';
// import { redisClient } from '../config/redis'; // Commented out for now
import { logger } from '../../utils/logger';
import { Service } from 'typedi';

// In-memory store for refresh tokens (temporary replacement for Redis)
const inMemoryStore = new Map<string, string>();

@Service()
export class AuthService {
  /**
   * Generate JWT tokens for user
   */
  private generateTokens(userId: string, phone: string) {
    const accessToken = jwt.sign(
      { 
        id: userId, 
        phone,
        type: 'access' 
      },
      process.env.JWT_SECRET!,
      { 
       expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] || '1d'
      }
    );
    
    const refreshToken = jwt.sign(
      { 
        id: userId, 
        phone,
        type: 'refresh' 
      },
      process.env.JWT_REFRESH_SECRET!,
      { 
          expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '30d'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Login user with phone number only
   * User must exist and have active subscription
   */
  async login(phone: string, ipAddress?: string, userAgent?: string) {
    // Format phone number using User model's static method
    const formattedPhone = User.formatPhoneNumber(phone);

    // Find user by phone
    const user = await User.findOne({ 
      where: { phoneFormatted: formattedPhone } 
    });

    // If user doesn't exist, throw error
    if (!user) {
      throw new NotFoundException('User not found. Please subscribe first.');
    }

    // Check subscription status using the model's method
    const subscriptionStatus = user.getSubscriptionStatus();
    
    // Check if user has active subscription
    if (!subscriptionStatus.isActive) {
      throw new ForbiddenException('No active subscription found. Please subscribe first.');
    }

    // Update metadata with login info
    const metadata = user.metadata || {};
    user.metadata = {
      ...metadata,
      lastLoginAt: new Date().toISOString(),
      loginCount: (metadata.loginCount || 0) + 1
    };
    
    // Update user's last workout date if not set (for daily streak)
    if (!user.lastWorkoutDate) {
      user.lastWorkoutDate = new Date();
    }
    
    await user.save();

    // Log login activity in ActivityLog
   await logUserActivity(
  user.id,
  'LOGIN',
  { 
    phone: formattedPhone,
    subscriptionActive: subscriptionStatus.isActive,
    planType: subscriptionStatus.planType,
    daysLeft: subscriptionStatus.daysLeft
  },
  ipAddress,
  userAgent
);

    // Log to console as well
    logger.info(`User ${user.id} logged in`, {
      userId: user.id,
      phone: formattedPhone,
      subscriptionActive: subscriptionStatus.isActive
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.phone);

    // Store refresh token in in-memory store (temporary)
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Return user data with subscription info
    const userData = user.toJSON();
    
    return {
      user: userData,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Store refresh token in in-memory store (temporary)
   */
  private async storeRefreshToken(userId: string, refreshToken: string) {
  // In production, use Redis instead of in-memory store
  inMemoryStore.set(`refresh_token:${userId}`, refreshToken);
  
  // Fix the timeout issue
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const max32Bit = Math.pow(2, 31) - 1; // Maximum 32-bit signed integer
  
  // Set a reasonable maximum timeout if needed
  const timeoutDuration = Math.min(thirtyDaysInMs, max32Bit);
  
  // Schedule cleanup
  setTimeout(() => {
    inMemoryStore.delete(`refresh_token:${userId}`);
  }, timeoutDuration).unref(); // Use unref() to prevent keeping the process alive
}

  /**
   * Get user profile with subscription details
   */
  async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Subscription,
          where: { status: 'active' },
          required: false,
          order: [['created_at', 'DESC']],
          limit: 1
        },
        {
           model: ActivityLog,
            as: 'activityLogs',
            limit: 10, 
            order: [['created_at', 'DESC']] 
        }
      ]
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: any, ipAddress?: string, userAgent?: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fields that can be updated (based on your model)
    const allowedFields = [
      'name', 
      'email', 
      'genderPreference', 
      'fitnessLevel', 
      'equipmentAvailable', 
      'hasCompletedWelcomeVideo', 
      'timezone'
    ];
    
    const updates: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    // Update daily streak if last workout date is being set
    if (updateData.lastWorkoutDate) {
      updates.lastWorkoutDate = updateData.lastWorkoutDate;
      
      // Calculate if it's a new day for streak
      const today = new Date();
      const lastWorkout = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;
      
      if (!lastWorkout || lastWorkout.toDateString() !== today.toDateString()) {
        // It's a new day, increment streak
        updates.dailyStreak = (user.dailyStreak || 0) + 1;
      }
    }

    // Update workout stats if provided
    if (updateData.totalWorkouts !== undefined) {
      updates.totalWorkouts = updateData.totalWorkouts;
    }
    
    if (updateData.totalMinutes !== undefined) {
      updates.totalMinutes = updateData.totalMinutes;
    }

    // If metadata is provided, merge it
    if (updateData.metadata) {
      updates.metadata = {
        ...user.metadata,
        ...updateData.metadata,
        profileUpdatedAt: new Date().toISOString()
      };
    }

    await user.update(updates);
    
    // Log profile update in ActivityLog
    await ActivityLog.create({
      userId: user.id,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: user.id,
      details: { 
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString()
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });

    // Log to console
    logger.info(`User ${user.id} updated profile`, {
      userId: user.id,
      updatedFields: Object.keys(updates)
    });

    return user.toJSON();
  }

  /**
   * Logout user
   */
  // TODO: use Redis/Memcached: for production ready 
  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    // Remove refresh token from in-memory store (temporary)
    inMemoryStore.delete(`refresh_token:${userId}`);
    
    // Log logout activity in ActivityLog
    await ActivityLog.create({
      userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      details: { timestamp: new Date().toISOString() },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });

    // Log to console
    logger.info(`User ${userId} logged out`, { userId });
  }

  /**
   * Refresh access token
   */

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Verify token type
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify token in in-memory store (temporary)
      const storedToken = inMemoryStore.get(`refresh_token:${decoded.id}`);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user still exists
      const user = await User.findByPk(decoded.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.phone);

      // Update refresh token in in-memory store
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Log token refresh in ActivityLog
      await ActivityLog.create({
        userId: user.id,
        action: 'TOKEN_REFRESHED',
        entityType: 'user',
        entityId: user.id,
        details: { timestamp: new Date().toISOString() },
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      });

      return tokens;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Check if phone number exists and get subscription status
   */
  async checkPhoneExists(phone: string) {
    const formattedPhone = User.formatPhoneNumber(phone);
    const user = await User.findOne({ 
      where: { phoneFormatted: formattedPhone }
    });
    
    if (!user) {
      return {
        exists: false,
        phone: formattedPhone,
        message: 'Phone number not registered. Please subscribe first.'
      };
    }

    const subscriptionStatus = user.getSubscriptionStatus();
    
    return {
      exists: true,
      phone: formattedPhone,
      user: {
        id: user.id,
        name: user.name,
        subscriptionStatus: subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEndDate: user.subscriptionEndDate,
        dailyStreak: user.dailyStreak,
        totalWorkouts: user.totalWorkouts
      },
      message: 'Phone number registered'
    };
  }

  /**
   * Handle aggregator subscription webhook
   * Creates user if they don't exist (via webhook only, not login)
   */
  // async handleSubscriptionWebhook(webhookData: any, ipAddress?: string) {
  //   const { 
  //     event, 
  //     msisdn, 
  //     product_id, 
  //     plan_type, 
  //     transaction_id, 
  //     timestamp,
  //     status,
  //     telco
  //   } = webhookData;

  //   const formattedPhone = User.formatPhoneNumber(msisdn);

  //   logger.info(`Processing subscription webhook: ${event} for ${formattedPhone}`);

  //   // Find or create user (via webhook we DO create users)
  //   let user = await User.findOne({ 
  //     where: { phoneFormatted: formattedPhone } 
  //   });

  //   const isNewUser = !user;

  //   if (!user) {
  //     // Create new user via webhook
  //     user = await User.create({
  //       phone: msisdn,
  //       phoneFormatted: formattedPhone,
  //       subscriptionStatus: 'pending',
  //       subscriptionPlan: plan_type || null,
  //       metadata: {
  //         source: 'aggregator_webhook',
  //         firstWebhookAt: new Date(timestamp).toISOString(),
  //         telco: telco || 'unknown',
  //         createdVia: 'subscription_webhook'
  //       }
  //     });
  //   }

  //   // Handle different events
  //   switch (event) {
  //     case 'subscription.activated':
  //     case 'subscription.renewed':
  //       await this.activateSubscription(user, {
  //         plan: plan_type,
  //         transactionId: transaction_id,
  //         telco: telco,
  //         activatedAt: new Date(timestamp),
  //         event: event
  //       }, ipAddress);
  //       break;

  //     case 'subscription.cancelled':
  //     case 'subscription.expired':
  //       await this.deactivateSubscription(user, {
  //         cancelledAt: new Date(timestamp),
  //         reason: event
  //       }, ipAddress);
  //       break;

  //     case 'subscription.failed':
  //       await this.handleFailedSubscription(user, {
  //         transactionId: transaction_id,
  //         failedAt: new Date(timestamp),
  //         reason: status,
  //         telco: telco
  //       }, ipAddress);
  //       break;

  //     default:
  //       logger.warn(`Unknown webhook event: ${event}`);
  //   }

  //   return {
  //     processed: true,
  //     userId: user.id,
  //     phone: user.phoneFormatted,
  //     isNewUser,
  //     event,
  //     subscriptionStatus: user.subscriptionStatus,
  //     timestamp: new Date()
  //   };
  // }

  /**
   * Activate user subscription
   */
  // private async activateSubscription(user: User, data: any, ipAddress?: string) {
  //   // Calculate end date based on plan
  //   const endDate = this.calculateEndDate(data.activatedAt, data.plan);
    
  //   // Update user
  //   await user.update({
  //     subscriptionStatus: 'active',
  //     subscriptionPlan: data.plan,
  //     subscriptionEndDate: endDate,
  //     metadata: {
  //       ...user.metadata,
  //       lastSubscriptionActivation: data.activatedAt.toISOString(),
  //       telco: data.telco || user.metadata?.telco,
  //       subscriptionHistory: [
  //         ...(user.metadata?.subscriptionHistory || []),
  //         {
  //           type: 'activation',
  //           plan: data.plan,
  //           transactionId: data.transactionId,
  //           timestamp: data.activatedAt.toISOString()
  //         }
  //       ]
  //     }
  //   });

  //   // Create subscription record
  //   await Subscription.create({
  //     userId: user.id,
  //     planType: data.plan,
  //     amount: this.getPlanAmount(data.plan),
  //     status: 'active',
  //     startDate: data.activatedAt,
  //     endDate: endDate,
  //     telco: data.telco || 'unknown',
  //     telcoRef: data.transactionId,
  //     metadata: {
  //       activatedVia: 'aggregator',
  //       webhookTimestamp: new Date().toISOString(),
  //       transactionId: data.transactionId
  //     }
  //   });

  //   // Log subscription activation in ActivityLog
  //   await ActivityLog.create({
  //     userId: user.id,
  //     action: 'SUBSCRIPTION_ACTIVATED',
  //     entityType: 'subscription',
  //     entityId: user.id,
  //     details: {
  //       plan: data.plan,
  //       transactionId: data.transactionId,
  //       telco: data.telco,
  //       endDate: endDate.toISOString(),
  //       isRenewal: data.event === 'subscription.renewed'
  //     },
  //     ipAddress: ipAddress || null
  //   });

  //   logger.info(`Subscription activated for user ${user.phoneFormatted}, plan: ${data.plan}`);
  // }

  /**
   * Deactivate user subscription
   */
  // private async deactivateSubscription(user: User, data: any, ipAddress?: string) {
  //   await user.update({
  //     subscriptionStatus: 'cancelled',
  //     subscriptionEndDate: data.cancelledAt
  //   });

  //   // Update active subscription record
  //   const activeSubscription = await Subscription.findOne({
  //     where: {
  //       userId: user.id,
  //       status: 'active'
  //     }
  //   });

  //   if (activeSubscription) {
  //     await activeSubscription.update({
  //       status: 'cancelled',
  //       cancelledAt: data.cancelledAt,
  //       cancellationReason: data.reason
  //     });
  //   }

  //   // Log subscription cancellation in ActivityLog
  //   await ActivityLog.create({
  //     userId: user.id,
  //     action: 'SUBSCRIPTION_CANCELLED',
  //     entityType: 'subscription',
  //     entityId: user.id,
  //     details: {
  //       reason: data.reason,
  //       cancelledAt: data.cancelledAt.toISOString()
  //     },
  //     ipAddress: ipAddress || null
  //   });

  //   logger.info(`Subscription cancelled for user ${user.phoneFormatted}`);
  // }

  /**
   * Handle failed subscription
   */
  private async handleFailedSubscription(user: User, data: any, ipAddress?: string) {
    await user.update({
      subscriptionStatus: 'failed'
    });

    // Log failed subscription in ActivityLog
    await ActivityLog.create({
      userId: user.id,
      action: 'SUBSCRIPTION_FAILED',
      entityType: 'subscription',
      entityId: user.id,
      details: {
        transactionId: data.transactionId,
        reason: data.reason,
        telco: data.telco,
        failedAt: data.failedAt.toISOString()
      },
      ipAddress: ipAddress || null
    });

    logger.warn(`Subscription failed for user ${user.phoneFormatted}: ${data.reason}`);
  }

  /**
   * Calculate subscription end date based on plan
   */
  private calculateEndDate(startDate: Date, plan: string): Date {
    const endDate = new Date(startDate);
    
    switch (plan) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      default:
        endDate.setDate(endDate.getDate() + 1); // Default to daily
    }
    
    return endDate;
  }

  /**
   * Get plan amount (in kobo)
   */
  private getPlanAmount(plan: string): number {
    const planPrices: Record<string, number> = {
      'daily': 10000,    // ₦100
      'weekly': 50000,   // ₦500
      'monthly': 150000  // ₦1500
    };
    
    return planPrices[plan] || 10000; // Default to daily price
  }

  /**
   * Increment user workout stats
   * Uses ActivityHistory model (separate from ActivityLog)
   */
  async recordWorkout(userId: string, minutes: number, ipAddress?: string, userAgent?: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = new Date();
    const lastWorkout = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;
    
    // Update stats
    await user.update({
      totalWorkouts: (user.totalWorkouts || 0) + 1,
      totalMinutes: (user.totalMinutes || 0) + minutes,
      lastWorkoutDate: today
    });

    // Check if it's a new day for streak
    if (!lastWorkout || lastWorkout.toDateString() !== today.toDateString()) {
      // It's a new day, increment streak
      await user.update({
        dailyStreak: (user.dailyStreak || 0) + 1
      });
    }

    // Log workout activity in ActivityLog
    await ActivityLog.create({
      userId: user.id,
      action: 'WORKOUT_COMPLETED',
      entityType: 'user',
      entityId: user.id,
      details: {
        minutes,
        totalWorkouts: user.totalWorkouts,
        totalMinutes: user.totalMinutes,
        dailyStreak: user.dailyStreak,
        timestamp: today.toISOString()
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });

    // Note: For detailed workout tracking (video completion, etc.), you would use ActivityHistory model separately

    return {
      dailyStreak: user.dailyStreak,
      totalWorkouts: user.totalWorkouts,
      totalMinutes: user.totalMinutes
    };
  }

  /**
   * Get user activity logs
   */
 async getUserActivityLogs(userId: string, limit: number = 50, offset: number = 0) {
  const logs = await ActivityLog.findAndCountAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
    attributes: ['action', 'details', 'ipAddress', 'created_at']  // Changed from 'createdAt' to 'created_at'
  });

  return {
    count: logs.count,
    rows: logs.rows
  };
}
}