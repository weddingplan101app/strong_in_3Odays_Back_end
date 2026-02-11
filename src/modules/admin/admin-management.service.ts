// src/modules/admin/admin-management.service.ts
import { Service } from 'typedi';
import { Op } from 'sequelize';
import { Admin } from '../../models/Admin.model';
import { AdminActivityLog } from '../../models/AdminActivityLog.model';
import { logger } from '../../utils/logger';
import { BaseAdminService } from './base-admin.service';

interface UpdateAdminData {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  department?: string;
  phone?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  forcePasswordChange?: boolean;
  preferences?: Record<string, any>;
}

@Service()
export class AdminManagementService extends BaseAdminService {
  /**
   * Update admin
   */
  async updateAdmin(updaterId: string, adminId: string, data: UpdateAdminData): Promise<Admin> {
    try {
      const updater = await Admin.findByPk(updaterId);
      const admin = await Admin.findByPk(adminId);

      if (!updater || !admin) {
        throw new Error('Admin not found');
      }

      // Check permissions
      if (!updater.hasPermission('manage_admins') && updaterId !== adminId) {
        throw new Error('Insufficient permissions to update this admin');
      }

      // Prevent non-super admin from updating super admin
      if (admin.isSuperAdmin && !updater.isSuperAdmin) {
        throw new Error('Only super admin can update super admin');
      }

      // Only super admin can change role to super_admin
      if (data.role === 'super_admin' && !updater.isSuperAdmin) {
        throw new Error('Only super admin can assign super admin role');
      }

      // Only super admin can change permissions
      if (data.permissions && !updater.isSuperAdmin) {
        throw new Error('Only super admin can modify permissions');
      }

      // Get old values for logging
      const oldValues = {
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
        department: admin.department,
        phone: admin.phone,
        profileImageUrl: admin.profileImageUrl,
        isActive: admin.isActive,
        forcePasswordChange: admin.forcePasswordChange,
        preferences: admin.preferences
      };

      // Update admin
      await admin.update(data);

      // Get new values for logging
      await admin.reload();
      const newValues = {
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
        department: admin.department,
        phone: admin.phone,
        profileImageUrl: admin.profileImageUrl,
        isActive: admin.isActive,
        forcePasswordChange: admin.forcePasswordChange,
        preferences: admin.preferences
      };

      // Log activity
      await this.logAdminActivity(
        updaterId,
        'update',
        `Updated admin account: ${admin.email}`,
        {
          entityType: 'admin',
          entityId: admin.id,
          oldValues,
          newValues,
          metadata: {
            updatedFields: Object.keys(data),
            updaterId,
            updaterEmail: updater.email
          }
        }
      );

      logger.info('Admin updated', {
        updaterId,
        adminId,
        updatedFields: Object.keys(data)
      });

      return admin;

    } catch (error: any) {
      logger.error('Failed to update admin', {
        error: error.message,
        updaterId,
        adminId
      });
      throw error;
    }
  }

  /**
   * Delete admin (soft delete)
   */
  async deleteAdmin(deleterId: string, adminId: string): Promise<void> {
    try {
      const deleter = await Admin.findByPk(deleterId);
      const admin = await Admin.findByPk(adminId);

      if (!deleter || !admin) {
        throw new Error('Admin not found');
      }

      // Check permissions
      if (!deleter.hasPermission('manage_admins')) {
        throw new Error('Insufficient permissions to delete admins');
      }

      // Prevent self-deletion
      if (deleterId === adminId) {
        throw new Error('Cannot delete your own account');
      }

      // Prevent deleting super admin unless you're super admin
      if (admin.isSuperAdmin && !deleter.isSuperAdmin) {
        throw new Error('Only super admin can delete super admin');
      }

      // Get old values for logging
      const oldValues = {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      };

      // Soft delete (deactivate)
      await admin.update({
        isActive: false
        // deactivatedAt: new Date(),
        // deactivatedBy: deleterId
      });

      // Log activity
      await this.logAdminActivity(
        deleterId,
        'delete',
        `Deactivated admin account: ${admin.email}`,
        {
          entityType: 'admin',
          entityId: admin.id,
          oldValues,
          newValues: {
            isActive: false
            // deactivatedAt: new Date(),
            // deactivatedBy: deleterId
          },
          metadata: {
            deleterId,
            deleterEmail: deleter.email,
            deletedAdminEmail: admin.email,
            role: admin.role
          }
        }
      );

      logger.info('Admin deleted', {
        deleterId,
        adminId
      });

    } catch (error: any) {
      logger.error('Failed to delete admin', {
        error: error.message,
        deleterId,
        adminId
      });
      throw error;
    }
  }

  /**
   * Get all admins with pagination and filtering
   */
  async getAllAdmins(filters: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{
    admins: Admin[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        department,
        isActive,
        search
      } = filters;

      const where: any = {};

      if (role) where.role = role;
      if (department) where.department = department;
      if (isActive !== undefined) where.isActive = isActive;

      // Search functionality
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } },
          { department: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { rows: admins, count: total } = await Admin.findAndCountAll({
        where,
        attributes: { 
          exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] 
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(total / limit);

      return {
        admins,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error: any) {
      logger.error('Failed to get admins', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get admin by ID
   */
  async getAdminById(adminId: string): Promise<Admin | null> {
    try {
      const admin = await Admin.findByPk(adminId, {
        attributes: { 
          exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] 
        },
        include: [{
          model: AdminActivityLog,
          as: 'activityLogs',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }]
      });

      return admin;

    } catch (error: any) {
      logger.error('Failed to get admin by ID', {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  /**
   * Get admin activity logs
   */
  async getAdminActivityLogs(filters: {
    adminId?: string;
    page?: number;
    limit?: number;
    actionType?: string;
    startDate?: Date;
    endDate?: Date;
    entityType?: string;
    wasSuccessful?: boolean;
  } = {}): Promise<{
    logs: AdminActivityLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        adminId,
        page = 1,
        limit = 50,
        actionType,
        startDate,
        endDate,
        entityType,
        wasSuccessful
      } = filters;

      const where: any = {};

      if (adminId) where.adminId = adminId;
      if (actionType) where.actionType = actionType;
      if (entityType) where.entityType = entityType;
      if (wasSuccessful !== undefined) where.wasSuccessful = wasSuccessful;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = startDate;
        if (endDate) where.createdAt[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { rows: logs, count: total } = await AdminActivityLog.findAndCountAll({
        where,
        include: [{
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'role', 'department']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error: any) {
      logger.error('Failed to get admin activity logs', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStatistics(): Promise<{
    totalAdmins: number;
    activeAdmins: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
    todayActivity: number;
    last7DaysActivity: number;
    last30DaysActivity: number;
  }> {
    try {
      // Basic counts
      const totalAdmins = await Admin.count();
      const activeAdmins = await Admin.count({ where: { isActive: true } });

      // Count by role
      const roles = await Admin.findAll({
        attributes: ['role'],
        group: ['role'],
        raw: true
      });

      const byRole: Record<string, number> = {};
      for (const role of roles) {
        const count = await Admin.count({ where: { role: role.role } });
        byRole[role.role] = count;
      }

      // Count by department
      const departments = await Admin.findAll({
        attributes: ['department'],
        where: { department: { [Op.not]: null } },
        group: ['department'],
        raw: true
      });

      const byDepartment: Record<string, number> = {};
      for (const dept of departments) {
        const count = await Admin.count({ where: { department: dept.department } });
        byDepartment[dept.department] = count;
      }

      // Activity counts
      const now = new Date();
      
      // Today's activity
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayActivity = await AdminActivityLog.count({
        where: { createdAt: { [Op.gte]: todayStart } }
      });

      // Last 7 days activity
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const last7DaysActivity = await AdminActivityLog.count({
        where: { createdAt: { [Op.gte]: sevenDaysAgo } }
      });

      // Last 30 days activity
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30DaysActivity = await AdminActivityLog.count({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } }
      });

      return {
        totalAdmins,
        activeAdmins,
        byRole,
        byDepartment,
        todayActivity,
        last7DaysActivity,
        last30DaysActivity
      };

    } catch (error: any) {
      logger.error('Failed to get admin statistics', {
        error: error.message
      });
      throw error;
    }
  }
}