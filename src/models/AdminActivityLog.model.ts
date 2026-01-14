// src/models/AdminActivityLog.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { Admin } from './Admin.model';

@Table({
  tableName: 'admin_activity_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['admin_id']
    },
    {
      unique: false,
      fields: ['action_type']
    },
    {
      unique: false,
      fields: ['created_at']
    },
    {
      unique: false,
      fields: ['ip_address']
    }
  ]
})
export class AdminActivityLog extends Model<AdminActivityLog> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => Admin)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'admin_id'
  })
  adminId!: string;

  @Column({
    type: DataType.ENUM(
      'login',
      'logout',
      'create',
      'update',
      'delete',
      'upload',
      'download',
      'export',
      'import',
      'approve',
      'reject',
      'system_action'
    ),
    allowNull: false,
    field: 'action_type'
  })
  actionType!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    comment: 'What was the action (e.g., "Uploaded workout video", "Updated user profile")'
  })
  description!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true, // Make this nullable
    field: 'entity_type',
    comment: 'What entity was affected (e.g., "WorkoutVideo", "User", "Program")'
  })
  entityType!: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'entity_id',
    comment: 'ID of the affected entity'
  })
  entityId!: string | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true, // Make this nullable
    field: 'old_values',
    comment: 'Values before change (for updates)'
  })
  oldValues!: Record<string, any> | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true, // Make this nullable
    field: 'new_values',
    comment: 'Values after change (for updates)'
  })
  newValues!: Record<string, any> | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true, // Make this nullable
    field: 'metadata',
    comment: 'Additional metadata about the action'
  })
  metadata!: Record<string, any> | null;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
    field: 'ip_address'
  })
  ipAddress!: string | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'user_agent'
  })
  userAgent!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'was_successful'
  })
  wasSuccessful!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'error_message'
  })
  errorMessage!: string | null;

  @BelongsTo(() => Admin)
  admin!: Admin;

  // Helper to create log entry - Fixed version
  static async logAction(
    adminId: string,
    actionType: string,
    description: string,
    entityType?: string | null,
    entityId?: string | null,
    oldValues?: Record<string, any> | null,
    newValues?: Record<string, any> | null,
    ipAddress?: string | null,
    userAgent?: string | null,
    wasSuccessful: boolean = true,
    errorMessage?: string | null,
    metadata?: Record<string, any> | null
  ): Promise<AdminActivityLog> {
    // Create a plain object that matches exactly what the model expects
    const data: any = {
      adminId,
      actionType,
      description,
      entityType: entityType || null,
      entityId: entityId || null,
      oldValues: oldValues || null,
      newValues: newValues || null,
      metadata: metadata || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      wasSuccessful,
      errorMessage: errorMessage || null
    };
    
    return await AdminActivityLog.create(data);
  }
}

export default AdminActivityLog;