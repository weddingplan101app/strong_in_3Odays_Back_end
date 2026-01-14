// src/modules/video/video-stream.service.ts
import { Service } from 'typedi';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Service()
export class VideoStreamService {
  private s3Client: S3Client;
  
  constructor() {
    // Log for debugging
    // console.log('Initializing VideoStreamService with env:', {
    //   endpoint: process.env.DO_SPACES_ENDPOINT,
    //   region: process.env.DO_SPACES_REGION,
    //   bucket: process.env.DO_SPACES_BUCKET,
    //   hasKey: !!process.env.DO_SPACES_ACCESS_KEY,
    //   hasSecret: !!process.env.DO_SPACES_SECRET_KEY
    // });
    
    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
      region: process.env.DO_SPACES_REGION || 'fra1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY!
      },
      forcePathStyle: false
    });
  }

  // Generate signed URL for a video (expires in 1 hour)
  async getSignedVideoUrl(videoKey: string, expiresIn = 3600): Promise<string> {
    try {
      console.log('Generating signed URL for:', videoKey);
      
      const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET || 'my-fitness-app',
        Key: videoKey,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      console.log('Signed URL generated, length:', signedUrl.length);
      return signedUrl;
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // For thumbnails (you might want to keep these public)
  getPublicThumbnailUrl(thumbnailKey: string): string {
    if (!thumbnailKey) return '';
    
    const bucket = process.env.DO_SPACES_BUCKET || 'my-fitness-app';
    const region = process.env.DO_SPACES_REGION || 'fra1';
    return `https://${bucket}.${region}.digitaloceanspaces.com/${thumbnailKey}`;
  }

  // For cover images (you might want to keep these public too)
  getPublicCoverUrl(coverKey: string): string {
    if (!coverKey) return '';
    
    const bucket = process.env.DO_SPACES_BUCKET || 'my-fitness-app';
    const region = process.env.DO_SPACES_REGION || 'fra1';
    return `https://${bucket}.${region}.digitaloceanspaces.com/${coverKey}`;
  }
}