// src/modules/admin/base-admin.service.ts
import { Service } from 'typedi';
import { AdminActivityLog } from '../../models/AdminActivityLog.model';
import { logger } from '../../utils/logger';

@Service()
export class BaseAdminService {
  /**
   * Log admin activity using your existing model
   */
  protected async logAdminActivity(
    adminId: string,
    actionType: AdminActivityLog['actionType'],
    description: string,
    options?: {
      entityType?: string | null;
      entityId?: string | null;
      oldValues?: Record<string, any> | null;
      newValues?: Record<string, any> | null;
      metadata?: Record<string, any> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      wasSuccessful?: boolean;
      errorMessage?: string | null;
    }
  ): Promise<AdminActivityLog> {
    try {
      const log = await AdminActivityLog.logAction(
        adminId,
        actionType,
        description,
        options?.entityType || null,
        options?.entityId || null,
        options?.oldValues || null,
        options?.newValues || null,
        options?.ipAddress || null,
        options?.userAgent || null,
        options?.wasSuccessful !== undefined ? options.wasSuccessful : true,
        options?.errorMessage || null,
        options?.metadata || null
      );

      logger.debug('Admin activity logged', {
        adminId,
        actionType,
        entityType: options?.entityType,
        entityId: options?.entityId
      });

      return log;

    } catch (error) {
      logger.error('Failed to log admin activity', {
        error: (error as Error).message,
        adminId,
        actionType,
        description
      });
      
      // Don't throw - logging should not break main functionality
      throw error;
    }
  }

  /**
   * Map custom actions to your ENUM action types
   */
  protected mapActionToType(action: string): AdminActivityLog['actionType'] {
    const actionMap: Record<string, AdminActivityLog['actionType']> = {
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'ADMIN_CREATED': 'create',
      'ADMIN_UPDATED': 'update',
      'ADMIN_DELETED': 'delete',
      'PASSWORD_CHANGED': 'update',
      'PASSWORD_RESET': 'update',
      'PROFILE_UPDATED': 'update',
      'TOKEN_REFRESHED': 'system_action',
      'PROFILE_VIEWED': 'system_action',
      'LOGIN_FAILED': 'login',
      'PASSWORD_CHANGE_FAILED': 'update',
      'ADMIN_PASSWORD_RESET': 'update',
      'FILE_UPLOADED': 'upload',
      'FILE_DELETED': 'delete',
      'PROGRAM_CREATED': 'create',
      'PROGRAM_UPDATED': 'update',
      'WORKOUT_VIDEO_UPLOADED': 'upload',
      'WORKOUT_VIDEO_UPDATED': 'update'
    };

    return actionMap[action] || 'system_action';
  }

  /**
   * Generate description based on action and entity
   */
  protected generateDescription(
    action: string,
    entityType?: string,
    entityId?: string
  ): string {
    const descriptions: Record<string, string> = {
      'LOGIN': 'Admin logged into the system',
      'LOGOUT': 'Admin logged out of the system',
      'ADMIN_CREATED': 'Created a new admin account',
      'ADMIN_UPDATED': 'Updated admin account details',
      'ADMIN_DELETED': 'Deactivated an admin account',
      'PASSWORD_CHANGED': 'Changed password',
      'PROFILE_UPDATED': 'Updated profile information',
      'PROFILE_VIEWED': 'Viewed profile details',
      'TOKEN_REFRESHED': 'Refreshed authentication token',
      'FILE_UPLOADED': 'Uploaded a file',
      'FILE_DELETED': 'Deleted a file',
      'PROGRAM_CREATED': 'Created a new fitness program',
      'PROGRAM_UPDATED': 'Updated program details',
      'WORKOUT_VIDEO_UPLOADED': 'Uploaded a workout video',
      'WORKOUT_VIDEO_UPDATED': 'Updated workout video details'
    };

    let description = descriptions[action] || `Performed ${action.toLowerCase()}`;
    
    if (entityType) {
      description += ` (${entityType}${entityId ? ` ID: ${entityId}` : ''})`;
    }

    return description;
  }
}