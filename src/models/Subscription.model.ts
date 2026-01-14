// src/models/Subscription.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  BeforeCreate,
  BeforeUpdate
} from 'sequelize-typescript';
import { User } from './User.model';

@Table({
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['aggregator_transaction_id']
    },
    {
      unique: false,
      fields: ['telco_ref']
    },
    {
      unique: false,
      fields: ['user_id', 'status']
    },
    {
      unique: false,
      fields: ['phone']
    }
  ]
})
export class Subscription extends Model<Subscription> {
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

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'aggregator_product_id'
  })
  aggregatorProductId!: number | null;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'aggregator_transaction_id'
  })
  aggregatorTransactionId!: string | null;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'telco_ref'
  })
  telcoRef!: string | null;

  @Column({
    type: DataType.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
    field: 'plan_type'
  })
  planType!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Amount in kobo (₦100 = 10000)'
  })
  amount!: number;

  @Column({
    type: DataType.ENUM('active', 'pending', 'cancelled', 'expired', 'failed', 'suspended'),
    defaultValue: 'pending'
  })
  status!: string;

  @Column({
    type: DataType.ENUM('SMS', 'USSD', 'WEB', 'APP'),
    defaultValue: 'SMS'
  })
  channel!: string;

  @Column({
    type: DataType.ENUM('MTN', 'AIRTEL', 'NINEMOBILE'),
    defaultValue: 'MTN'
  })
  telco!: string;

  @Index
  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  phone!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'start_date'
  })
  startDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'end_date'
  })
  endDate!: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'auto_renewal'
  })
  autoRenewal!: boolean;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    field: 'telco_status_code'
  })
  telcoStatusCode!: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'telco_status_message'
  })
  telcoStatusMessage!: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'aggregator_response'
  })
  aggregatorResponse!: Record<string, any>;

  @Column({
  type: DataType.INTEGER,
  defaultValue: 0,
  field: 'renewal_count'
})
renewalCount!: number;

@Column({
  field: 'cancelled_at',
  type: DataType.DATE,
  allowNull: true
})
cancelledAt?: Date;

@Column({
  field: 'cancellation_reason',
  type: DataType.STRING,
  allowNull: true
})
cancellationReason?: string;

  // Virtual field for days remaining
  @Column({
    type: DataType.VIRTUAL(DataType.INTEGER),
    get() {
      const self = this as any as Subscription;
      if (!self.endDate) return 0;
      
      const now = new Date();
      const diffTime = self.endDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    field: 'days_remaining'
  })
  daysRemaining!: number;

  // Virtual field for active status check
  @Column({
    type: DataType.VIRTUAL(DataType.BOOLEAN),
    get() {
      const self = this as any as Subscription;
      return self.status === 'active' && 
             self.endDate !== null && 
             self.endDate > new Date();
    },
    field: 'is_active'
  })
  isActive!: boolean;

  @BelongsTo(() => User)
  user!: User;

  @BeforeCreate
  static setCalculatedFields(instance: Subscription) {
    // Calculate amount based on plan type
    if (!instance.amount) {
      const amounts: Record<string, number> = {
        daily: 10000,
        weekly: 50000,
        monthly: 150000
      };
      instance.amount = amounts[instance.planType] || 10000;
    }

    // Set end date based on plan type
    if (!instance.endDate && instance.startDate) {
      instance.endDate = instance.calculateEndDate();
    }
  }

  @BeforeUpdate
  static updateCalculatedFields(instance: Subscription) {
    // Recalculate end date if plan type or start date changes
    if (instance.changed('planType') || instance.changed('startDate')) {
      instance.endDate = instance.calculateEndDate();
    }
  }

  calculateEndDate(): Date {
    const date = new Date(this.startDate);
    switch (this.planType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date;
  }

 
}

export default Subscription;