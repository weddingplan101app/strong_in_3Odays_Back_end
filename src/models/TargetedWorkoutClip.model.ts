// src/models/TargetedWorkoutClip.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { TargetedWorkout } from './TargetedWorkout.model';
import { MediaAsset } from './MediaAsset.model';

@Table({
  tableName: 'targeted_workout_clips',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['targeted_workout_id']
    },
    {
      unique: false,
      fields: ['clip_order']
    }
  ]
})
export class TargetedWorkoutClip extends Model<TargetedWorkoutClip> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => TargetedWorkout)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'targeted_workout_id'
  })
  targetedWorkoutId!: string;

  // ✅ Order in the sequence (1, 2, 3...)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'clip_order'
  })
  clipOrder!: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  // ✅ NEW: Specific exercise name
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'exercise'
  })
  exercise!: string;

  // ✅ FIXED: Each clip is 30 seconds
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duration in seconds (always 30 seconds)'
  })
  duration!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'video_key'
  })
  videoKey!: string;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as TargetedWorkoutClip;
      const videoKey = self.videoKey;
      
      const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      
      if (process.env.DO_SPACES_CDN_URL) {
        return `${process.env.DO_SPACES_CDN_URL}/${videoKey}`;
      }
      
      return `https://${bucketName}.${region}.digitaloceanspaces.com/${videoKey}`;
    },
    field: 'video_url'
  })
  videoUrl!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'thumbnail_key'
  })
  thumbnailKey!: string | null;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as TargetedWorkoutClip;
      const thumbnailKey = self.thumbnailKey;
      
      if (!thumbnailKey) return null;
      
      const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      
      if (process.env.DO_SPACES_CDN_URL) {
        return `${process.env.DO_SPACES_CDN_URL}/${thumbnailKey}`;
      }
      
      return `https://${bucketName}.${region}.digitaloceanspaces.com/${thumbnailKey}`;
    },
    field: 'thumbnail_url'
  })
  thumbnailUrl!: string | null;

  // ✅ NEW: Exercise instructions
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'instructions'
  })
  instructions!: string | null;

  // ✅ NEW: Tips for better form
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'tips'
  })
  tips!: string | null;

  // ✅ NEW: Calories burned for this clip
  @Column({
    type: DataType.INTEGER,
    defaultValue: 5,
    field: 'calories_burned'
  })
  caloriesBurned!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  })
  isActive!: boolean;

  // Relationships
  @BelongsTo(() => TargetedWorkout)
  targetedWorkout!: TargetedWorkout;

  @ForeignKey(() => MediaAsset)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'original_video_asset_id'
  })
  originalVideoAssetId!: string | null;

  @ForeignKey(() => MediaAsset)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'thumbnail_asset_id'
  })
  thumbnailAssetId!: string | null;

  @BelongsTo(() => MediaAsset, 'originalVideoAssetId')
  originalVideoAsset!: MediaAsset | null;

  @BelongsTo(() => MediaAsset, 'thumbnailAssetId')
  thumbnailAsset!: MediaAsset | null;

  // Get formatted time
  getFormattedTime(): string {
    return '0:30'; // Always 30 seconds
  }

  // Get next clip
  async getNextClip(): Promise<TargetedWorkoutClip | null> {
    return TargetedWorkoutClip.findOne({
      where: {
        targetedWorkoutId: this.targetedWorkoutId,
        clipOrder: this.clipOrder + 1
      },
      order: [['clip_order', 'ASC']]
    });
  }

  // Get previous clip
  async getPreviousClip(): Promise<TargetedWorkoutClip | null> {
    return TargetedWorkoutClip.findOne({
      where: {
        targetedWorkoutId: this.targetedWorkoutId,
        clipOrder: this.clipOrder - 1
      },
      order: [['clip_order', 'DESC']]
    });
  }
}

export default TargetedWorkoutClip;