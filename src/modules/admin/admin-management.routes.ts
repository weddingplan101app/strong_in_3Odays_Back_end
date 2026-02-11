// src/modules/admin/admin-management.routes.ts
import { Router } from 'express';
import Container from 'typedi';
import { AdminManagementController } from './admin-management.controller';
import { 
  adminAuthMiddleware, 
  adminPermissionMiddleware,
  AdminAuthRequest 
} from '../../middleware/admin-auth.middleware';

const router = Router();
const adminManagementController = Container.get(AdminManagementController);

// =================== PROTECTED ADMIN MANAGEMENT ROUTES ===================

// Get all admins (requires manage_admins permission)
router.get('/', 
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_admins'),
  (req: AdminAuthRequest, res) => adminManagementController.getAllAdmins(req, res)
);

// Get admin by ID (requires manage_admins permission)
router.get('/:adminId', 
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_admins'),
  (req: AdminAuthRequest, res) => adminManagementController.getAdminById(req, res)
);

// Update admin (self-update allowed, updating others requires manage_admins)
router.put('/:adminId', 
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminManagementController.updateAdmin(req, res)
);

// Delete admin (requires manage_admins permission)
router.delete('/:adminId', 
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_admins'),
  (req: AdminAuthRequest, res) => adminManagementController.deleteAdmin(req, res)
);

// Get admin activity logs (requires view_admin_logs permission)
router.get('/logs/activity', 
  adminAuthMiddleware,
  adminPermissionMiddleware('view_admin_logs'),
  (req: AdminAuthRequest, res) => adminManagementController.getAdminActivityLogs(req, res)
);

// Get admin statistics (requires view_admin_stats permission)
router.get('/stats/overview', 
  adminAuthMiddleware,
  adminPermissionMiddleware('view_admin_stats'),
  (req: AdminAuthRequest, res) => adminManagementController.getAdminStatistics(req, res)
);

export default router;