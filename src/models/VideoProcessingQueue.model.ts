// src/models/VideoProcessingQueue.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index
} from 'sequelize-typescript';
import { MediaAsset } from './MediaAsset.model';
import { Admin } from './Admin.model'; // Remove User import

@Table({
  tableName: 'video_processing_queue',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['status']
    },
    {
      unique: false,
      fields: ['priority', 'created_at']
    },
    {
      unique: false,
      fields: ['media_asset_id']
    }
  ]
})
export class VideoProcessingQueue extends Model<VideoProcessingQueue> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => MediaAsset)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'media_asset_id'
  })
  mediaAssetId!: string;

  @ForeignKey(() => Admin)  // Changed from User to Admin
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'processed_by'
  })
  processedBy!: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'pending, processing, completed, failed'
  })
  status!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0 = lowest, 10 = highest'
  })
  priority!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'processing_options',
    comment: 'Options for processing (quality, formats, etc.)'
  })
  processingOptions!: Record<string, any>;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'retry_count'
  })
  retryCount!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'error_message'
  })
  errorMessage!: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    field: 'processing_result',
    comment: 'Result of processing (output files, sizes, etc.)'
  })
  processingResult!: Record<string, any>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'started_at'
  })
  startedAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'completed_at'
  })
  completedAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'next_retry_at'
  })
  nextRetryAt!: Date | null;

  @BelongsTo(() => MediaAsset)
  mediaAsset!: MediaAsset;

  @BelongsTo(() => Admin)  // Changed from User to Admin
  processor!: Admin | null;

  // Check if processing can be retried
  canRetry(): boolean {
    return this.retryCount < 3 && this.status === 'failed';
  }

  // Get estimated processing time based on file size
  getEstimatedProcessingTime(): number {
    const sizeInMB = this.mediaAsset?.fileSize ? this.mediaAsset.fileSize / (1024 * 1024) : 0;
    // Rough estimate: 1 minute per 100MB for HLS conversion
    return Math.ceil(sizeInMB / 100) * 60;
  }

  // Helper method to update status
  async updateStatus(newStatus: string, errorMessage?: string): Promise<void> {
    this.status = newStatus;
    
    if (newStatus === 'processing') {
      this.startedAt = new Date();
    } else if (newStatus === 'completed' || newStatus === 'failed') {
      this.completedAt = new Date();
    }
    
    if (errorMessage) {
      this.errorMessage = errorMessage;
      if (newStatus === 'failed') {
        this.retryCount += 1;
        // Set next retry time (5 minutes later)
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + 5);
        this.nextRetryAt = nextRetry;
      }
    }
    
    await this.save();
  }

  // Get processing time in seconds
  getProcessingTime(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
}

export default VideoProcessingQueue;