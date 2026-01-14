// src/models/AdminInvite.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  BeforeCreate
} from 'sequelize-typescript';
import { Admin } from './Admin.model';

@Table({
  tableName: 'admin_invites',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      unique: false,
      fields: ['status']
    },
    {
      unique: false,
      fields: ['email']
    }
  ]
})
export class AdminInvite extends Model<AdminInvite> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => Admin)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'invited_by'
  })
  invitedBy!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  })
  email!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  name!: string | null;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique invitation token'
  })
  token!: string;

  @Column({
    type: DataType.ENUM('super_admin', 'content_manager', 'video_editor', 'support', 'viewer'),
    defaultValue: 'content_manager'
  })
  role!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: []
  })
  permissions!: string[];

  @Column({
    type: DataType.ENUM('pending', 'accepted', 'expired', 'revoked'),
    defaultValue: 'pending'
  })
  status!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'expires_at'
  })
  expiresAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'accepted_at'
  })
  acceptedAt!: Date | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'accepted_by_admin_id',
    comment: 'ID of admin who accepted (if different from invited by)'
  })
  acceptedByAdminId!: string | null;

  @BelongsTo(() => Admin, 'invitedBy')
  inviter!: Admin;

  @BelongsTo(() => Admin, 'acceptedByAdminId')
  acceptor!: Admin | null;

  @BeforeCreate
  static setExpiryDate(instance: AdminInvite) {
    if (!instance.expiresAt) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry
      instance.expiresAt = expiryDate;
    }
  }

  // Check if invite is valid
  isValid(): boolean {
    return this.status === 'pending' && this.expiresAt > new Date();
  }

  // Accept invite
  accept(adminId: string): void {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.acceptedByAdminId = adminId;
  }

  // Get invitation link
  getInvitationLink(baseUrl: string): string {
    return `${baseUrl}/admin/invite/${this.token}`;
  }
}

export default AdminInvite;