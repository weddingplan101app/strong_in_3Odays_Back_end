// src/models/User.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  HasOne,
  BeforeCreate,
  BeforeUpdate,
  DefaultScope,
  Scopes,
  Unique,
  Index
} from 'sequelize-typescript';
import { Subscription } from './Subscription.model';
import { ActivityHistory } from './ActivityHistory.model';
import { ActivityLog } from './ActivityLog.model';

type UserJSON = Omit<User, 'subscriptions' | 'activityHistory' | 'activityLogs'> & {
  subscription: ReturnType<User['getSubscriptionStatus']>;
  activityLogs?: ActivityLog[];
};

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['phone_formatted']
    },
    {
      fields: ['subscription_status']
    },
    {
      fields: ['subscription_end_date']
    }
  ]
})
@DefaultScope(() => ({
  attributes: { 
    exclude: ['deleted_at'] 
  }
}))
@Scopes(() => ({
  activeSubscribers: {
    where: {
      subscription_status: 'active',
      subscription_end_date: { $gt: new Date() }
    }
  },
  withSubscriptions: {
    include: [Subscription]
  }
}))
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Unique('phone_formatted')
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: {
      is: {
        args: /^\+?[1-9]\d{1,14}$/,
        msg: 'Invalid phone number format'
      }
    },
    set(this: User, value: string) {
      const formatted = User.formatPhoneNumber(value);
      this.setDataValue('phone', value);
      this.setDataValue('phoneFormatted', formatted);
    }
  })
  phone!: string;

  @Index
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
    field: 'phone_formatted'
  })
  phoneFormatted!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'Full name of the user'
  })
  name!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: 'User\'s email address'
  })
  email!: string | null;

//   @Column({
//   type: DataType.BOOLEAN,
//   defaultValue: false,
//   field: 'email_verified'
// })
// emailVerified!: boolean;

// @Column({
//   type: DataType.STRING(100),
//   allowNull: true,
//   field: 'email_verification_token'
// })
// emailVerificationToken!: string | null;

  @Column({
    type: DataType.ENUM('active', 'inactive', 'expired', 'pending', 'failed', 'cancelled'),
    defaultValue: 'inactive',
    field: 'subscription_status'
  })
  subscriptionStatus!: string;

  @Column({
    type: DataType.ENUM('daily', 'weekly', 'monthly'),
    allowNull: true,
    field: 'subscription_plan'
  })
  subscriptionPlan!: string | null;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'subscription_end_date'
  })
  subscriptionEndDate!: Date | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'daily_streak'
  })
  dailyStreak!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_workout_date'
  })
  lastWorkoutDate!: Date | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'total_workouts'
  })
  totalWorkouts!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'total_minutes'
  })
  totalMinutes!: number;

  @Column({
    type: DataType.ENUM('male', 'female', 'both'),
    defaultValue: 'both',
    field: 'gender_preference'
  })
  genderPreference!: string;

  @Column({
    type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner',
    field: 'fitness_level'
  })
  fitnessLevel!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'equipment_available'
  })
  equipmentAvailable!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'has_completed_welcome_video'
  })
  hasCompletedWelcomeVideo!: boolean;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'timezone',
    defaultValue: 'Africa/Lagos'
  })
  timezone!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'metadata'
  })
  metadata!: Record<string, any>;

  // Relationships
  @HasMany(() => Subscription)
  subscriptions!: Subscription[];

  @HasMany(() => ActivityHistory)
  activityHistory!: ActivityHistory[];

  @HasMany(() => ActivityLog, {
    foreignKey: 'user_id',
    as: 'activityLogs'
  })
  activityLogs!: ActivityLog[];

  // Hooks
  @BeforeCreate
  static formatPhone(instance: User) {
    if (!instance.phoneFormatted) {
      instance.phoneFormatted = User.formatPhoneNumber(instance.phone);
    }
  }

  // Static Methods
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, convert to 234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    // If doesn't start with 234, add it
    else if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    return cleaned;
  }

  getSubscriptionStatus(): {
    isActive: boolean;
    daysLeft: number;
    planType: string | null;
    shouldRenew: boolean;
  } {
    const now = new Date();
    const isActive = this.subscriptionStatus === 'active' && 
                this.subscriptionEndDate !== null && 
                this.subscriptionEndDate > new Date();
    
    let daysLeft = 0;
    if (this.subscriptionEndDate) {
      const diffTime = this.subscriptionEndDate.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const shouldRenew = isActive === true && daysLeft <= 3;
    
    return {
      isActive,
      daysLeft: Math.max(0, daysLeft),
      planType: this.subscriptionPlan,
      shouldRenew
    };
  }

 toJSON(): UserJSON {
  const values = Object.assign({}, this.get()) as any;

  return {
    ...values,
    subscription: this.getSubscriptionStatus(),
  };
}
}

export default User;