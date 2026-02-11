
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.model';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'admin-secret-key-change-in-production';

export interface AdminAuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    permissions: string[];
  };
}

export const adminAuthMiddleware = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if admin exists and is active
    const admin = await Admin.findByPk(decoded.adminId, {
      attributes: ['id', 'email', 'role', 'isSuperAdmin', 'permissions', 'isActive']
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Admin account is inactive or not found'
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      isSuperAdmin: admin.isSuperAdmin,
      permissions: admin.permissions || []
    };

    next();

  } catch (error: any) {
    logger.error('Admin authentication failed', {
      error: error.message,
      path: req.path
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Permission-based authorization middleware
 */
export const adminPermissionMiddleware = (requiredPermission: string | string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Super admin has all permissions
      if (req.admin.isSuperAdmin) {
        return next();
      }

      // Check single permission
      if (typeof requiredPermission === 'string') {
        if (!req.admin.permissions.includes(requiredPermission)) {
          return res.status(403).json({
            success: false,
            error: `Missing permission: ${requiredPermission}`
          });
        }
      }
      // Check multiple permissions (any of them)
      else if (Array.isArray(requiredPermission)) {
        const hasAnyPermission = requiredPermission.some(permission => 
          req.admin!.permissions.includes(permission)
        );
        
        if (!hasAnyPermission) {
          return res.status(403).json({
            success: false,
            error: `Missing required permissions. Required one of: ${requiredPermission.join(', ')}`
          });
        }
      }

      next();

    } catch (error: any) {
      logger.error('Permission authorization failed', {
        error: error.message,
        adminId: req.admin?.adminId,
        requiredPermission
      });

      res.status(403).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
};