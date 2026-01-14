// src/models/Admin.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  HasMany,
  Index
} from 'sequelize-typescript';
import bcrypt from 'bcrypt';
import { MediaAsset } from './MediaAsset.model';

@Table({
  tableName: 'admins',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    }
  ]
})
export class Admin extends Model<Admin> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Admin username for login'
  })
  username!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  password!: string;

  @Column({
    type: DataType.ENUM('super_admin', 'content_manager', 'video_editor', 'support', 'viewer'),
    defaultValue: 'content_manager',
    comment: 'Admin role hierarchy'
  })
  role!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
    field: 'permissions',
    comment: 'Array of specific permissions (e.g., ["upload_videos", "edit_programs", "manage_users"])'
  })
  permissions!: string[];

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'profile_image_url'
  })
  profileImageUrl!: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: 'Phone for 2FA or emergency contact'
  })
  phone!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_super_admin'
  })
  isSuperAdmin!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'force_password_change'
  })
  forcePasswordChange!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login_at'
  })
  lastLoginAt!: Date | null;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
    field: 'last_login_ip'
  })
  lastLoginIp!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'two_factor_secret'
  })
  twoFactorSecret!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled'
  })
  twoFactorEnabled!: boolean;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'reset_password_token'
  })
  resetPasswordToken!: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'reset_password_expires'
  })
  resetPasswordExpires!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'password_changed_at'
  })
  passwordChangedAt!: Date | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'preferences',
    comment: 'Admin dashboard preferences (theme, notifications, etc.)'
  })
  preferences!: Record<string, any>;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'department',
    comment: 'Admin department (e.g., Content, Marketing, Support)'
  })
  department!: string | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'failed_login_attempts'
  })
  failedLoginAttempts!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'locked_until'
  })
  lockedUntil!: Date | null;

  @HasMany(() => MediaAsset)
  uploadedAssets!: MediaAsset[];

  @BeforeCreate
  static async hashPassword(instance: Admin) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
      instance.passwordChangedAt = new Date();
    }
  }

  @BeforeUpdate
  static async hashPasswordOnUpdate(instance: Admin) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
      instance.passwordChangedAt = new Date();
      instance.forcePasswordChange = false;
    }
  }

  // Check if admin is locked
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  // Check specific permission
  hasPermission(permission: string): boolean {
    if (this.isSuperAdmin) return true;
    return this.permissions.includes(permission);
  }

  // Check if admin has any of the given permissions
  hasAnyPermission(permissions: string[]): boolean {
    if (this.isSuperAdmin) return true;
    return permissions.some(permission => this.permissions.includes(permission));
  }

  // Verify password
  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Record successful login
  recordSuccessfulLogin(ipAddress: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ipAddress;
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  // Record failed login attempt
  recordFailedLoginAttempt(): void {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      this.lockedUntil = lockTime;
    }
  }

  toJSON(): any {
    // Use parent's toJSON to get plain object
    const values = super.toJSON();
    
    // Remove sensitive fields using destructuring
    const { 
      password, 
      twoFactorSecret, 
      resetPasswordToken, 
      resetPasswordExpires, 
      ...safeValues 
    } = values;
    
    return safeValues;
  }
}

export default Admin;