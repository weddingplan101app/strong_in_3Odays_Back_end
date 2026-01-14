// src/models/MediaAsset.model.ts
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
import { Admin } from './Admin.model'; 

@Table({
  tableName: 'media_assets',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['storage_key']
    },
    {
      unique: false,
      fields: ['uploaded_by']
    },
    {
      unique: false,
      fields: ['asset_type', 'processing_status']
    }
  ]
})
export class MediaAsset extends Model<MediaAsset> {
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
    field: 'uploaded_by'
  })
  uploadedBy!: string;

  @ForeignKey(() => WorkoutVideo)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'workout_video_id'
  })
  workoutVideoId!: string | null;

  @ForeignKey(() => Program)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'program_id'
  })
  programId!: string | null;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'storage_key',
    comment: 'Digital Ocean Spaces key (e.g., "videos/workout-123/original.mp4")'
  })
  storageKey!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: 'Original filename'
  })
  filename!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'file_extension'
  })
  fileExtension!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: 'file_size',
    comment: 'File size in bytes'
  })
  fileSize!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'mime_type'
  })
  mimeType!: string;

  @Column({
    type: DataType.ENUM('video', 'image', 'audio', 'document'),
    allowNull: false,
    field: 'asset_type'
  })
  assetType!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'metadata',
    comment: 'File metadata (dimensions, duration, codec, etc.)'
  })
  metadata!: Record<string, any>;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'processing_status',
    defaultValue: 'pending',
    comment: 'pending, processing, completed, failed'
  })
  processingStatus!: string;

  @Column({
    type: DataType.ENUM('original', 'thumbnail', 'hls_manifest', 'hls_segment', 'dash_manifest'),
    allowNull: false,
    field: 'file_purpose'
  })
  filePurpose!: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'cdn_url'
  })
  cdnUrl!: string | null;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
    field: 'direct_url'
  })
  directUrl!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'processing_log'
  })
  processingLog!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'duration',
    comment: 'Duration in seconds (for videos/audio)'
  })
  duration!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'width',
    comment: 'Width in pixels (for images/videos)'
  })
  width!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'height',
    comment: 'Height in pixels (for images/videos)'
  })
  height!: number | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_archived'
  })
  isArchived!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'processed_at'
  })
  processedAt!: Date | null;

  @BelongsTo(() => User)
  uploader!: User;

  @BelongsTo(() => WorkoutVideo)
  workoutVideo!: WorkoutVideo | null;

  @BelongsTo(() => Program)
  program!: Program | null;

  // Virtual field for formatted file size
  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as MediaAsset;
      const bytes = self.fileSize;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Byte';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },
    field: 'file_size_formatted'
  })
  fileSizeFormatted!: string;

   @ForeignKey(() => Admin)  // Change from User to Admin
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'processed_by'
  })
  processedBy!: string | null;

 @BelongsTo(() => Admin)  // Change from User to Admin
  processor!: Admin | null;

  // Get appropriate URL based on configuration
  getUrl(): string {
    if (this.cdnUrl) return this.cdnUrl;
    if (this.directUrl) return this.directUrl;
    
    // Generate Digital Ocean Spaces URL
    const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
    const region = process.env.DO_SPACES_REGION || 'nyc3';
    const cdnUrl = process.env.DO_SPACES_CDN_URL;
    
    if (cdnUrl) {
      return `${cdnUrl}/${this.storageKey}`;
    }
    
    return `https://${bucketName}.${region}.digitaloceanspaces.com/${this.storageKey}`;
  }
}

export default MediaAsset;