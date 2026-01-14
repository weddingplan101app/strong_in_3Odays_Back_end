// src/models/ActivityLog.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { User } from './User.model';

// Define the attributes interface
export interface ActivityLogAttributes {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define the creation attributes (omit auto-generated fields)
export type ActivityLogCreationAttributes = Omit<ActivityLogAttributes, 'id' | 'createdAt' | 'updatedAt'>;

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['action']
    }
  ]
})
export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => User)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id'
  })
  userId!: string;

  @Index
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: 'Action type: LOGIN, LOGOUT, PROFILE_UPDATED, etc.'
  })
  action!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'Entity type (user, subscription, etc.)'
  })
  entityType!: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'Entity ID'
  })
  entityId!: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    comment: 'Additional details about the activity'
  })
  details!: Record<string, any>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'IP address where the action originated'
  })
  ipAddress!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'User agent from the request'
  })
  userAgent!: string | null;

  @BelongsTo(() => User)
  user!: User;
}

export default ActivityLog;