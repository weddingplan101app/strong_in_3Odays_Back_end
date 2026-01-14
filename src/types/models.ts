// src/types/models.ts
export interface IUserAttributes {
  id?: string;
  phone: string;
  phoneFormatted: string;
  name: string | null;
  email: string | null;
  subscriptionStatus: string;
  subscriptionPlan: 'daily' | 'weekly' | 'monthly' | null;
  subscriptionEndDate: Date | null;
  dailyStreak: number;
  genderPreference: string;
  fitnessLevel: string;
  equipmentAvailable: boolean;
  hasCompletedWelcomeVideo: boolean;
  timezone: string;
  metadata?: Record<string, any>;
  lastWorkoutDate?: Date | null;
  totalWorkouts?: number;
  totalMinutes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionAttributes {
  id?: string;
  userId: string;
  aggregatorProductId?: string;
  aggregatorTransactionId?: string;
  telcoRef: string;
  planType: 'daily' | 'weekly' | 'monthly';
  amount: number;
  status: 'active' | 'cancelled' | 'failed' | 'expired';
  channel: string;
  telco: string;
  phone: string;
  telcoStatusCode: string;
  telcoStatusMessage?: string;
  aggregatorResponse?: any;
  startDate: Date;
  endDate: Date;
  renewalCount?: number;
  cancelledAt?: Date | null;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes {
  id?: string;
  phone: string;
  phoneFormatted: string;
  name: string | null;
  email: string | null;
  subscriptionStatus: string;
  subscriptionPlan: 'daily' | 'weekly' | 'monthly' | null;
  subscriptionEndDate: Date | null;
  dailyStreak: number;
  genderPreference: string;
  fitnessLevel: string;
  equipmentAvailable: boolean;
  hasCompletedWelcomeVideo: boolean;
  timezone: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  lastWorkoutDate?: Date | null;
  totalWorkouts?: number;
  totalMinutes?: number;
}
