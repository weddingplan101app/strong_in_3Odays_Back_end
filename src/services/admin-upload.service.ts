// src/services/admin-upload.service.ts
import { Service } from 'typedi';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Admin } from '../models/Admin.model';
import { Program } from '../models/Program.model';
import { WorkoutVideo } from '../models/WorkoutVideo.model';
import { logger } from '../utils/logger';

interface UploadConfig {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  size: number;
  mimeType: string;
  etag?: string;
}

@Service()
export class AdminUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  // In AdminUploadService constructor
constructor() {
  const config: UploadConfig = {
    bucket: process.env.DO_SPACES_BUCKET || 'my-fitness-app',
    region: process.env.DO_SPACES_REGION || 'fra1',
    endpoint: process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  };

  // Log config (masking sensitive data)
  console.log('🔧 Digital Ocean Spaces Config:', {
    bucket: config.bucket,
    region: config.region,
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId ? '***' + config.accessKeyId.slice(-4) : 'NOT SET',
    secretAccessKey: config.secretAccessKey ? '***' + config.secretAccessKey.slice(-4) : 'NOT SET'
  });

  this.s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: false,
  });

  this.bucketName = config.bucket;
}

  /**
   * Generate structured key for program cover image
   */
  generateCoverKey(program: Program): string {
    const sanitizedSlug = program.slug.replace(/[^a-z0-9-]/g, '-');
    const category = this.getProgramCategory(program);
    const gender = program.genderTarget;
    
    return `cover/${category}/${gender}/${sanitizedSlug}-${Date.now()}.jpg`;
  }

  /**
   * Generate structured key for workout video
   */
  generateVideoKey(program: Program, day: number, isWelcomeVideo: boolean = false): string {
    const sanitizedSlug = program.slug.replace(/[^a-z0-9-]/g, '-');
    const prefix = isWelcomeVideo ? 'welcome' : `day-${day}`;
    
    return `video/programs/${sanitizedSlug}/${prefix}-${uuidv4().slice(0, 8)}.mp4`;
  }

  /**
   * Generate structured key for video thumbnail
   */
  generateThumbnailKey(program: Program, day: number, isWelcomeVideo: boolean = false): string {
    const sanitizedSlug = program.slug.replace(/[^a-z0-9-]/g, '-');
    const prefix = isWelcomeVideo ? 'welcome' : `day-${day}`;
    
    return `thumbnail/programs/${sanitizedSlug}/${prefix}-${uuidv4().slice(0, 8)}.jpg`;
  }

  /**
   * Upload file to Digital Ocean Spaces
   */
  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPublic: boolean = true
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: isPublic ? 'public-read' : 'private',
      });

      const response = await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.fra1.digitaloceanspaces.com/${key}`;

      logger.info('File uploaded successfully', {
        key,
        size: fileBuffer.length,
        mimeType,
        etag: response.ETag,
      });

      return {
        success: true,
        key,
        url: publicUrl,
        size: fileBuffer.length,
        mimeType,
        etag: response.ETag,
      };
    } catch (error: any) {
      logger.error('Failed to upload file', {
        error: error.message,
        key,
      });
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Digital Ocean Spaces
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted successfully', { key });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete file', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Process and categorize uploaded cover image
   */
  async processCoverUpload(
    adminId: string,
    program: Program,
    imageBuffer: Buffer,
    originalName: string
  ): Promise<UploadResult> {
    try {
      // Validate admin permissions
      const admin = await Admin.findByPk(adminId);
      if (!admin || !admin.hasPermission('upload_content')) {
        throw new Error('Insufficient permissions');
      }

      // Generate structured key
      const key = this.generateCoverKey(program);
      
      // Upload to Spaces
      const result = await this.uploadFile(
        imageBuffer,
        key,
        'image/jpeg',
        true
      );

      // Update program with new cover
      await program.update({
        coverImageUrl: key,
        updatedAt: new Date(),
      });

      logger.info('Cover image processed and saved', {
        adminId,
        programId: program.id,
        key,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process cover upload', {
        error: error.message,
        adminId,
        programId: program.id,
      });
      throw error;
    }
  }

  /**
   * Process and upload workout video with thumbnail
   */
  async processWorkoutVideoUpload(
    adminId: string,
    program: Program,
    day: number,
    videoBuffer: Buffer,
    thumbnailBuffer: Buffer,
    metadata: {
      title: string;
      description?: string;
      duration: number;
      caloriesBurned: number;
      muscleGroups: string[];
    }
  ): Promise<{ video: UploadResult; thumbnail: UploadResult; workoutVideo: WorkoutVideo }> {
    try {
      // Validate admin permissions
      const admin = await Admin.findByPk(adminId);
      if (!admin || !admin.hasPermission('upload_videos')) {
        throw new Error('Insufficient permissions');
      }

      const isWelcomeVideo = day === 0;
      
      // Generate structured keys
      const videoKey = this.generateVideoKey(program, day, isWelcomeVideo);
      const thumbnailKey = this.generateThumbnailKey(program, day, isWelcomeVideo);

      // Upload video (private for now, will generate signed URLs)
      const videoResult = await this.uploadFile(
        videoBuffer,
        videoKey,
        'video/mp4',
        false
      );

      // Upload thumbnail (public)
      const thumbnailResult = await this.uploadFile(
        thumbnailBuffer,
        thumbnailKey,
        'image/jpeg',
        true
      );

      // Create workout video record
      const workoutVideo = await WorkoutVideo.create({
        programId: program.id,
        day,
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        caloriesBurned: metadata.caloriesBurned,
        muscleGroups: metadata.muscleGroups,
        videoKey: videoKey,
        thumbnailKey: thumbnailKey,
        isWelcomeVideo,
        isActive: true,
        difficulty: program.difficulty,
        hasAdaptiveStreaming: false,
        streamingManifestKey: null,
      });

      logger.info('Workout video processed and saved', {
        adminId,
        programId: program.id,
        day,
        videoKey,
        thumbnailKey,
      });

      return {
        video: videoResult,
        thumbnail: thumbnailResult,
        workoutVideo,
      };
    } catch (error: any) {
      logger.error('Failed to process workout video upload', {
        error: error.message,
        adminId,
        programId: program.id,
        day,
      });
      throw error;
    }
  }

  /**
   * Get program category based on difficulty and equipment
   */
  private getProgramCategory(program: Program): string {
    if (program.difficulty === 'beginner' && !program.equipmentRequired) {
      return 'beginner';
    } else if (program.equipmentRequired) {
      return 'equipment';
    } else {
      return 'targeted';
    }
  }

  /**
   * Generate signed URL for private video access
   */
  async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get public URL for asset (for covers and thumbnails)
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.fra1.digitaloceanspaces.com/${key}`;
  }

  /**
   * List files in a directory (for admin file management)
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response: ListObjectsV2CommandOutput = await this.s3Client.send(command);
      
      // Contents is optional, so we need to check it exists
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      return response.Contents
        .map(item => item.Key || '')
        .filter(key => key !== ''); // Filter out empty keys
    } catch (error: any) {
      logger.error('Failed to list files', {
        error: error.message,
        prefix,
      });
      return [];
    }
  }

  /**
   * List files with more details (size, last modified)
   */
  async listFilesWithDetails(prefix: string): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag?: string;
  }>> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response: ListObjectsV2CommandOutput = await this.s3Client.send(command);
      
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      return response.Contents
        .map(item => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          etag: item.ETag,
        }))
        .filter(item => item.key !== ''); // Filter out empty keys
    } catch (error: any) {
      logger.error('Failed to list files with details', {
        error: error.message,
        prefix,
      });
      return [];
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const list = await this.listFiles(key);
      return list.length > 0 && list.some(item => item === key);
    } catch (error: any) {
      logger.error('Failed to check if file exists', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Get total storage usage for a prefix
   */
  async getStorageUsage(prefix: string): Promise<number> {
    try {
      const files = await this.listFilesWithDetails(prefix);
      return files.reduce((total, file) => total + file.size, 0);
    } catch (error: any) {
      logger.error('Failed to get storage usage', {
        error: error.message,
        prefix,
      });
      return 0;
    }
  }

  /**
   * Get presigned URL for temporary admin access
   */
  async generateAdminPresignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    // This is for admin to preview private files
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

export default AdminUploadService;