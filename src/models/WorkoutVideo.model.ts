// src/models/WorkoutVideo.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  DefaultScope,
  Scopes,
  AfterFind
} from 'sequelize-typescript';
import { Program } from './Program.model';
import { MediaAsset } from './MediaAsset.model';

@Table({
  tableName: 'workout_videos',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['program_id', 'day']
    },
    {
      unique: false,
      fields: ['is_active']
    },
    {
      unique: false,
      fields: ['is_welcome_video']
    }
  ]
})
@DefaultScope(() => ({
  where: { is_active: true },
  order: [['day', 'ASC'], ['sort_order', 'ASC']]
}))
@Scopes(() => ({
  welcomeVideos: {
    where: { is_welcome_video: true }
  },
  dailyWorkouts: {
    where: { 
      is_welcome_video: false,
      day: { $gte: 1, $lte: 30 }
    }
  },
  byDay: (day: number) => ({
    where: { day }
  }),
  byProgram: (programId: string) => ({
    where: { program_id: programId }
  })
}))
export class WorkoutVideo extends Model<WorkoutVideo> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => Program)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'program_id'
  })
  programId!: string | null;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Day of the program (0-30). 0 is welcome video.'
  })
  day!: number;

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

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'video_key',
    comment: 'Object key in Digital Ocean Spaces (e.g., "videos/workout-123.mp4")'
  })
  videoKey!: string;

   @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  views!: number;

  // @Column({
  //   type: DataType.VIRTUAL(DataType.STRING),
  //   get() {
  //     const self = this as any as WorkoutVideo;
  //     const videoKey = self.videoKey;
  //     // Digital Ocean Spaces URL structure
  //     // Use your actual bucket name and region
  //     const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
  //     const region = process.env.DO_SPACES_REGION || 'nyc3';
      
  //     // Return CDN URL if configured, otherwise direct Spaces URL
  //     if (process.env.DO_SPACES_CDN_URL) {
  //       return `${process.env.DO_SPACES_CDN_URL}/${videoKey}`;
  //     }
      
  //     // Default to Spaces URL
  //     return `https://${bucketName}.${region}.digitaloceanspaces.com/${videoKey}`;
  //   },
  //   field: 'video_url'
  // })
  // videoUrl!: string;
  @Column({
  type: DataType.VIRTUAL(DataType.STRING),
  get() {
    // Return null, let the service handle URL generation
    return null;
  },
  field: 'video_url'
})
videoUrl!: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'thumbnail_key',
    comment: 'Object key for thumbnail in Digital Ocean Spaces'
  })
  thumbnailKey!: string | null;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as WorkoutVideo;
      const thumbnailKey = self.thumbnailKey;
      
      if (!thumbnailKey) return null;
      
      // Digital Ocean Spaces URL structure
      const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      
      // Return CDN URL if configured
      if (process.env.DO_SPACES_CDN_URL) {
        return `${process.env.DO_SPACES_CDN_URL}/${thumbnailKey}`;
      }
      
      // Default to Spaces URL
      return `https://${bucketName}.${region}.digitaloceanspaces.com/${thumbnailKey}`;
    },
    field: 'thumbnail_url'
  })
  thumbnailUrl!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Duration in seconds'
  })
  duration!: number;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as WorkoutVideo;
      const minutes = Math.floor(self.duration / 60);
      const seconds = self.duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    field: 'duration_formatted'
  })
  durationFormatted!: string;

  @Column({
    type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  })
  difficulty!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'calories_burned'
  })
  caloriesBurned!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_welcome_video'
  })
  isWelcomeVideo!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  })
  isActive!: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  })
  sortOrder!: number;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
    field: 'muscle_groups'
  })
  muscleGroups!: string[];

  // For adaptive streaming (HLS/DASH)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'has_adaptive_streaming',
    comment: 'Whether video has been processed for adaptive streaming (HLS/DASH)'
  })
  hasAdaptiveStreaming!: boolean;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'streaming_manifest_key',
    comment: 'Key for HLS/DASH manifest file (e.g., "streaming/workout-123/master.m3u8")'
  })
  streamingManifestKey!: string | null;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as WorkoutVideo;
      const manifestKey = self.streamingManifestKey;
      
      if (!manifestKey || !self.hasAdaptiveStreaming) return self.videoUrl;
      
      // Return adaptive streaming URL
      const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      
      if (process.env.DO_SPACES_CDN_URL) {
        return `${process.env.DO_SPACES_CDN_URL}/${manifestKey}`;
      }
      
      return `https://${bucketName}.${region}.digitaloceanspaces.com/${manifestKey}`;
    },
    field: 'streaming_url'
  })
  streamingUrl!: string;

 

  @BelongsTo(() => Program)
  program!: Program;

  @ForeignKey(() => MediaAsset)
@Column({
  type: DataType.UUID,
  allowNull: true,
  field: 'original_video_asset_id',
  comment: 'Reference to the original uploaded video asset'
})
originalVideoAssetId!: string | null;

@ForeignKey(() => MediaAsset)
@Column({
  type: DataType.UUID,
  allowNull: true,
  field: 'thumbnail_asset_id',
  comment: 'Reference to the thumbnail asset'
})
thumbnailAssetId!: string | null;

@BelongsTo(() => MediaAsset, 'originalVideoAssetId')
originalVideoAsset!: MediaAsset | null;

@BelongsTo(() => MediaAsset, 'thumbnailAssetId')
thumbnailAsset!: MediaAsset | null;

  // Helper method for admin to get the best URL based on configuration
  getBestVideoUrl(): string | null {
    // Priority: Adaptive streaming > CDN URL > Direct Spaces URL
    if (this.hasAdaptiveStreaming && this.streamingManifestKey) {
      return this.streamingUrl;
    }
    return this.videoUrl;
  }
}

export default WorkoutVideo;