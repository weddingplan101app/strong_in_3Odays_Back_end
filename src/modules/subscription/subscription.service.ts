// src/modules/subscription/subscription.service.ts
import { Service } from 'typedi';
import { User, Subscription } from '../../models';
import { logger } from '../../utils/logger';
import { Op } from 'sequelize';
import { fn, col } from 'sequelize';

@Service()
export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string) {
    const user = await User.findByPk(userId, {
      include: [{
        model: Subscription,
        as: 'subscriptions',
        where: { status: 'active' },
        required: false,
        order: [['createdAt', 'DESC']],
        limit: 1
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: user.id,
        phone: user.phone,
        phoneFormatted: user.phoneFormatted,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEndDate: user.subscriptionEndDate
      },
      activeSubscription: user.subscriptions?.[0] || null
    };
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string, reason?: string) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update user
    await user.update({
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: new Date()
    });

    // Cancel active subscriptions
    const [updatedCount] = await Subscription.update(
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'user_cancelled'
      },
      {
        where: {
          userId: user.id,
          status: 'active'
        }
      }
    );

    logger.info(`Subscription cancelled for user ${userId}, updated ${updatedCount} records`);

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      cancelledAt: new Date()
    };
  }

  /**
   * Get user's subscription history
   */
  async getSubscriptionHistory(userId: string, limit = 10, offset = 0) {
    const { count, rows } = await Subscription.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      total: count,
      subscriptions: rows.map(sub => ({
        id: sub.id,
        planType: sub.planType,
        amount: sub.amount,
        status: sub.status,
        telco: sub.telco,
        startDate: sub.startDate,
        endDate: sub.endDate,
        cancelledAt: sub.cancelledAt,
        createdAt: sub.createdAt
      }))
    };
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    
    if (!user) return false;
    
    if (user.subscriptionStatus !== 'active') return false;
    
    if (user.subscriptionEndDate && user.subscriptionEndDate < new Date()) {
      // Update status if expired
      await user.update({ subscriptionStatus: 'expired' });
      return false;
    }
    
    return true;
  }

  /**
   * Get subscription statistics (for admin)
   */
  async getSubscriptionStats() {
    const now = new Date();
    
    const [
      totalSubscriptions,
      activeSubscriptions,
      todaysSubscriptions,
      revenueStats
    ] = await Promise.all([
      Subscription.count(),
      Subscription.count({ where: { status: 'active' } }),
      Subscription.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      }),
      Subscription.aggregate('amount', 'sum', {
        where: { status: 'active' }
      })
    ]);

  const planDistribution = await Subscription.findAll({
  attributes: [
    'planType',
    [fn('COUNT', col('planType')), 'count']
  ],
  where: { status: 'active' },
  group: ['planType']
});
    return {
      total: totalSubscriptions,
      active: activeSubscriptions,
      today: todaysSubscriptions,
      totalRevenue: revenueStats || 0,
      planDistribution: planDistribution.reduce<Record<string, number>>((acc, curr: any) => {
        acc[curr.planType] = curr.get('count');
        return acc;
      }, {})
    };
  }

  /**
   * Get all active subscriptions (for admin)
   */
  async getAllActiveSubscriptions(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Subscription.findAndCountAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'phone', 'phoneFormatted']
      }],
      order: [['endDate', 'ASC']],
      limit,
      offset
    });

    return {
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      subscriptions: rows
    };
  }
}