// src/modules/admin/admin-management.controller.ts
import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import { AdminManagementService } from './admin-management.service';
import { AdminAuthRequest } from '../../middleware/admin-auth.middleware';
import { logger } from '../../utils/logger';

@Service()
export class AdminManagementController {
  constructor(
    @Inject() private adminManagementService: AdminManagementService
  ) {}

  /**
   * Get all admins
   */
  async getAllAdmins(req: AdminAuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        department, 
        isActive, 
        search 
      } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        department: department as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string
      };

      const result = await this.adminManagementService.getAllAdmins(filters);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Failed to get admins in controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get admins'
      });
    }
  }

  /**
   * Get admin by ID
   */
  async getAdminById(req: AdminAuthRequest, res: Response) {
    try {
      const { adminId } = req.params;

      const admin = await this.adminManagementService.getAdminById(adminId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'Admin not found'
        });
      }

      res.status(200).json({
        success: true,
        data: admin
      });

    } catch (error: any) {
      logger.error('Failed to get admin by ID in controller', {
        error: error.message,
        adminId: req.params.adminId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get admin'
      });
    }
  }

  /**
   * Update admin
   */
  async updateAdmin(req: AdminAuthRequest, res: Response) {
    try {
      const updaterId = req.admin?.adminId;
      const { adminId } = req.params;

      if (!updaterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Allow self-update or require manage_admins permission for updating others
      if (updaterId !== adminId) {
        if (!req.admin?.permissions?.includes('manage_admins')) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }
      }

      const admin = await this.adminManagementService.updateAdmin(updaterId, adminId, req.body);

      res.status(200).json({
        success: true,
        data: admin.toJSON(),
        message: 'Admin updated successfully'
      });

    } catch (error: any) {
      logger.error('Failed to update admin in controller', {
        error: error.message,
        updaterId: req.admin?.adminId,
        adminId: req.params.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update admin'
      });
    }
  }

  /**
   * Delete admin
   */
  async deleteAdmin(req: AdminAuthRequest, res: Response) {
    try {
      const deleterId = req.admin?.adminId;
      const { adminId } = req.params;

      if (!deleterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await this.adminManagementService.deleteAdmin(deleterId, adminId);

      res.status(200).json({
        success: true,
        message: 'Admin deactivated successfully'
      });

    } catch (error: any) {
      logger.error('Failed to delete admin in controller', {
        error: error.message,
        deleterId: req.admin?.adminId,
        adminId: req.params.adminId
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete admin'
      });
    }
  }

  /**
   * Get admin activity logs
   */
  async getAdminActivityLogs(req: AdminAuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        actionType, 
        startDate, 
        endDate, 
        entityType,
        wasSuccessful,
        adminId
      } = req.query;

      const filters = {
        adminId: adminId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        actionType: actionType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        entityType: entityType as string,
        wasSuccessful: wasSuccessful === 'true' ? true : wasSuccessful === 'false' ? false : undefined
      };

      const result = await this.adminManagementService.getAdminActivityLogs(filters);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Failed to get admin activity logs in controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get activity logs'
      });
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStatistics(req: AdminAuthRequest, res: Response) {
    try {
      const stats = await this.adminManagementService.getAdminStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      logger.error('Failed to get admin statistics in controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }
}