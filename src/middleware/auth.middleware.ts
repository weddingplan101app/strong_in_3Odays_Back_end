// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if header has Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token || token === '') {
      logger.warn('Empty token provided');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check token type (should be access token, not refresh token)
    if (decoded.type !== 'access') {
      logger.warn('Invalid token type provided');
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if token has required fields
    if (!decoded.id || !decoded.phone) {
      logger.warn('Token missing required fields');
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Attach user to request object
    req.user = {
      id: decoded.id,
      phone: decoded.phone
    };

    // Log successful authentication (optional, for debugging)
    logger.info(`User authenticated: ${decoded.id}`, {
      userId: decoded.id,
      phone: decoded.phone,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Generic error
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Optional: Create a middleware for optional authentication
// (routes that can work with or without auth)
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token, but allow to proceed (user will be undefined)
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type === 'access' && decoded.id && decoded.phone) {
      req.user = {
        id: decoded.id,
        phone: decoded.phone
      };
    }
  } catch (error) {
    // If token is invalid, just proceed without user (don't throw error)
    logger.debug('Optional auth failed, proceeding without user');
  }
  
  next();
};