  // src/models/ActivityHistory.model.ts
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
import Program from './Program.model';

  @Table({
    tableName: 'activity_history',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at', // Explicitly map createdAt to created_at
    updatedAt: 'updated_at', // Explicitly map updatedAt to updated_at
    indexes: [
      {
        unique: false,
        fields: ['user_id', 'workout_video_id']
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

    @ForeignKey(() => WorkoutVideo)
    @Column({
      type: DataType.UUID,
      allowNull: false,
      field: 'workout_video_id'
    })
    workoutVideoId!: string;

    @Index
    @Column({
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Day of the program (0-30)'
    })
    day!: number;

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
  allowNull: false,
  field: 'program_id'
})
programId!: string;


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

@BelongsTo(() => Program)
program!: Program;

    @Column({
      type: DataType.VIRTUAL(DataType.FLOAT),
      get(this: ActivityHistory) {
        const workoutVideo = this.workoutVideo as WorkoutVideo | undefined;
        if (!workoutVideo?.duration || workoutVideo.duration === 0) return 0;
        
        const percentage = (this.getDataValue('watchedDuration') / workoutVideo.duration) * 100;
        return Math.min(100, Math.round(percentage * 100) / 100);
      },
      field: 'completion_percentage'
    })
    completionPercentage!: number;

    @BelongsTo(() => User)
    user!: User;

    @BelongsTo(() => WorkoutVideo)
    workoutVideo!: WorkoutVideo;

  //   getCompletionPercentage(): number {
  //     if (!this.workoutVideo?.duration || this.workoutVideo.duration === 0) return 0;
      
  //     const percentage = (this.watchedDuration / this.workoutVideo.duration) * 100;
  //     return Math.min(100, Math.round(percentage * 100) / 100);
  //   }

  //   toJSON(): any {
  //     const values = Object.assign({}, this.get());
  //     values.completion_percentage = this.getCompletionPercentage();
  //     return values;
  //   }
  }

  export default ActivityHistory;