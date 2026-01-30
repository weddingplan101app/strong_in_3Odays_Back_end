import { Request, Response, NextFunction } from 'express';
import Container from 'typedi';
import { UserDashboardService } from '../modules/users/user-dashboard.service';

export const subscriptionRequired = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const dashboardService = Container.get(UserDashboardService);
    const subscriptionStatus = await dashboardService.checkSubscriptionStatus(userId);

    if (!subscriptionStatus.canAccessContent) {
      return res.status(403).json({
        success: false,
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        subscription: subscriptionStatus.subscription
      });
    }

    req.subscription = subscriptionStatus.subscription;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking subscription'
    });
  }
};