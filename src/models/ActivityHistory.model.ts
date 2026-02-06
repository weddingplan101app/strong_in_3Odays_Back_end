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
import { WorkoutVideo } from './WorkoutVideo.model';
import { Program } from './Program.model';
import { TargetedWorkout } from './TargetedWorkout.model';

@Table({
  tableName: 'activity_history',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: false,
      fields: ['user_id', 'workout_video_id']
    },
    {
      unique: false,
      fields: ['user_id', 'targeted_workout_id']
    },
    {
      unique: false,
      fields: ['user_id', 'day']
    },
    {
      unique: false,
      fields: ['user_id', 'created_at']
    },
    {
      unique: false,
      fields: ['is_completed']
    },
    {
      unique: false,
      fields: ['activity_type']
    }
  ]
})
export class ActivityHistory extends Model<ActivityHistory> {
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

  // Foreign key for Program Workout Videos (for 30-day programs)
  @ForeignKey(() => WorkoutVideo)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Changed to allow null for targeted workouts
    field: 'workout_video_id'
  })
  workoutVideoId!: string | null;

  // Foreign key for Targeted Workouts (for 3-5 min targeted workouts)
  @ForeignKey(() => TargetedWorkout)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Changed to allow null for program workouts
    field: 'targeted_workout_id'
  })
  targetedWorkoutId!: string | null;

  // Activity type to distinguish between program workouts and targeted workouts
  @Column({
    type: DataType.ENUM('PROGRAM_WORKOUT', 'TARGETED_WORKOUT'),
    allowNull: false,
    defaultValue: 'PROGRAM_WORKOUT',
    field: 'activity_type'
  })
  activityType!: 'PROGRAM_WORKOUT' | 'TARGETED_WORKOUT';

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: true, // Can be null for targeted workouts
    defaultValue: 1,
    comment: 'Day of the program (0-30) - Only for program workouts'
  })
  day!: number | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'watched_duration',
    comment: 'Seconds watched'
  })
  watchedDuration!: number;

  @Index
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  })
  isCompleted!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'completed_at'
  })
  completedAt!: Date | null;

  @ForeignKey(() => Program)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Can be null for targeted workouts
    field: 'program_id'
  })
  programId!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  })
  rating!: number | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'details',
    defaultValue: {},
    get(this: ActivityHistory) {
      const rawValue = this.getDataValue('details');
      return rawValue || {};
    },
    set(this: ActivityHistory, value: any) {
      this.setDataValue('details', value || {});
    }
  })
  details!: Record<string, any> | null;

  // Virtual field for completion percentage
  @Column({
    type: DataType.VIRTUAL(DataType.FLOAT),
    get(this: ActivityHistory) {
      let totalDuration = 0;
      
      if (this.activityType === 'PROGRAM_WORKOUT' && this.workoutVideo) {
        totalDuration = this.workoutVideo.duration || 0;
      } else if (this.activityType === 'TARGETED_WORKOUT' && this.targetedWorkout) {
        totalDuration = this.targetedWorkout.totalDuration || 0;
      }
      
      if (!totalDuration || totalDuration === 0) return 0;
      
      const percentage = (this.watchedDuration / totalDuration) * 100;
      return Math.min(100, Math.round(percentage * 100) / 100);
    },
    field: 'completion_percentage'
  })
  completionPercentage!: number;

  // Relationships
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => WorkoutVideo, {
    foreignKey: 'workoutVideoId',
    constraints: false
  })
  workoutVideo!: WorkoutVideo;

  @BelongsTo(() => TargetedWorkout, {
    foreignKey: 'targetedWorkoutId',
    constraints: false
  })
  targetedWorkout!: TargetedWorkout;

  @BelongsTo(() => Program, {
    foreignKey: 'programId',
    constraints: false
  })
  program!: Program;

  // Helper method to get activity title
  getActivityTitle(): string {
    if (this.activityType === 'PROGRAM_WORKOUT' && this.workoutVideo) {
      return this.workoutVideo.title || 'Program Workout';
    } else if (this.activityType === 'TARGETED_WORKOUT' && this.targetedWorkout) {
      return this.targetedWorkout.title || 'Targeted Workout';
    }
    return 'Workout';
  }

  // Helper method to get activity duration
  getActivityDuration(): number {
    if (this.activityType === 'PROGRAM_WORKOUT' && this.workoutVideo) {
      return this.workoutVideo.duration || 0;
    } else if (this.activityType === 'TARGETED_WORKOUT' && this.targetedWorkout) {
      return this.targetedWorkout.totalDuration || 0;
    }
    return 0;
  }

  // Helper method to get activity type display name
  getActivityTypeDisplay(): string {
    return this.activityType === 'PROGRAM_WORKOUT' ? 'Program Workout' : 'Targeted Workout';
  }
}

export default ActivityHistory;