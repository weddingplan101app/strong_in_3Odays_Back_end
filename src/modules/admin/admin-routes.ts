// src/modules/admin/admin.routes.ts
import { Router } from 'express';
import Container from 'typedi';
import { AdminAuthController } from './admin-auth.controller';
import { 
  adminAuthMiddleware, 
  adminPermissionMiddleware,
  AdminAuthRequest 
} from '../../middleware/admin-auth.middleware';

const router = Router();
const adminAuthController = Container.get(AdminAuthController);

// =================== PUBLIC ROUTES ===================

// Admin login
router.post('/login', (req, res) => adminAuthController.login(req, res));

// Create super admin (initial setup - remove or secure in production)
router.post('/super-admin', (req, res) => adminAuthController.createSuperAdmin(req, res));

// Refresh token
router.post('/refresh-token', (req, res) => adminAuthController.refreshToken(req, res));

// Verify token
router.get('/verify-token', adminAuthMiddleware, (req: AdminAuthRequest, res) => 
  adminAuthController.verifyToken(req, res)
);

// =================== PROTECTED ROUTES ===================

// Get profile
router.get('/profile', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminAuthController.getProfile(req, res)
);

// Update profile
router.put('/profile', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminAuthController.updateProfile(req, res)
);

// Change password
router.post('/password/change', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminAuthController.changePassword(req, res)
);

// Create new admin (requires manage_admins permission)
router.post('/create', 
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_admins'),
  (req: AdminAuthRequest, res) => adminAuthController.createAdmin(req, res)
);

// Reset password (super admin or self)
router.post('/password/reset/:adminId', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminAuthController.resetPassword(req, res)
);

// Logout
router.post('/logout', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminAuthController.logout(req, res)
);

export default router;