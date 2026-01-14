// src/helpers/activityLogger.helper.ts
import { ActivityLog } from '../models/ActivityLog.model';
import type { ActivityLogCreationAttributes } from '../models/ActivityLog.model';

export const createActivityLog = async (data: ActivityLogCreationAttributes): Promise<ActivityLog> => {
  return await ActivityLog.create(data);
};

export const logUserActivity = async (
  userId: string, 
  action: string, 
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<ActivityLog> => {
  const logData: ActivityLogCreationAttributes = {
    userId,
    action,
    entityType: 'user',
    entityId: userId,
    details: details || {},
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  };
  
  return await createActivityLog(logData);
};