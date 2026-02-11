// src/modules/admin/admin-content.controller.ts
import { Request, Response } from 'express';
import { Service, Inject } from 'typedi';
import multer from 'multer';
import { AdminUploadService } from '../../services/admin-upload.service';
import { AdminAuthService } from './admin-auth.service';
import { ProgramsService } from '../program/programs.service';
import { AdminAuthRequest } from '../../middleware/admin-auth.middleware';
import { logger } from '../../utils/logger';
import { Program } from '../../models/Program.model';
import { isVideoUploadFiles } from '../../types/upload.types';



// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'video/mp4': ['.mp4'],
    };

    if (allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

@Service()
export class AdminContentController {
  constructor(
    @Inject() private adminUploadService: AdminUploadService,
    @Inject() private adminAuthService: AdminAuthService,
    @Inject() private programService: ProgramsService
  ) {}

  /**
   * Upload program cover image
   */
  async uploadCoverImage(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const { programSlug } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Get program
      const program = await Program.unscoped().findOne({ where: { slug: programSlug } });
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
        });
      }

      // Process upload
      const result = await this.adminUploadService.processCoverUpload(
        adminId,
        program,
        file.buffer,
        file.originalname
      );

      res.status(200).json({
        success: true,
        data: {
          key: result.key,
          url: result.url,
          program: {
            id: program.id,
            slug: program.slug,
            coverImageUrl: this.adminUploadService.getPublicUrl(result.key),
          },
        },
        message: 'Cover image uploaded successfully',
      });
    } catch (error: any) {
      logger.error('Failed to upload cover image', {
        error: error.message,
        adminId: req.admin?.adminId,
        programSlug: req.params.programSlug,
      });

      const status = error.message.includes('permissions') ? 403 : 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to upload cover image',
      });
    }
  }

  /**
   * Upload workout video with thumbnail
   */
  async uploadWorkoutVideo(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const { programSlug, day } = req.params;
      
      if (!req.files || !isVideoUploadFiles(req.files)) {
      return res.status(400).json({
        success: false,
        error: 'Video and thumbnail files are required',
      });
    }
      const videoFile = req.files?.video?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];

      if (!videoFile) {
        return res.status(400).json({
          success: false,
          error: 'Video file is required',
        });
      }

      if (!thumbnailFile) {
        return res.status(400).json({
          success: false,
          error: 'Thumbnail file is required',
        });
      }

      console.log("Programxcd:dd", programSlug);
      // Get program
      const program = await Program.unscoped().findOne({ where: { slug: programSlug } });
      console.log("Programxcd:", program);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
        });
      }

      const metadata = {
        title: req.body.title || `Day ${day} Workout`,
        description: req.body.description,
        duration: parseInt(req.body.duration) || 1800, // Default 30 minutes
        caloriesBurned: parseInt(req.body.caloriesBurned) || 300,
        muscleGroups: req.body.muscleGroups 
          ? JSON.parse(req.body.muscleGroups)
          : ['full-body'],
      };

      // Process upload
      const result = await this.adminUploadService.processWorkoutVideoUpload(
        adminId,
        program,
        parseInt(day),
        videoFile.buffer,
        thumbnailFile.buffer,
        metadata
      );

      res.status(200).json({
        success: true,
        data: {
          video: {
            key: result.video.key,
            url: result.video.url,
          },
          thumbnail: {
            key: result.thumbnail.key,
            url: result.thumbnail.url,
          },
          workoutVideo: {
            id: result.workoutVideo.id,
            day: result.workoutVideo.day,
            title: result.workoutVideo.title,
            duration: result.workoutVideo.duration,
          },
          signedUrl: await this.adminUploadService.generateSignedUrl(result.video.key),
        },
        message: 'Workout video uploaded successfully',
      });
    } catch (error: any) {
      logger.error('Failed to upload workout video', {
        error: error.message,
        adminId: req.admin?.adminId,
        programSlug: req.params.programSlug,
        day: req.params.day,
      });

      const status = error.message.includes('permissions') ? 403 : 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to upload workout video',
      });
    }
  }

  /**
   * Create new program (admin only)
   */
  async createProgram(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check permissions
      const admin = await this.adminAuthService.getAdminProfile(adminId);
      if (!admin.hasPermission('manage_programs')) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      const {
        name,
        description,
        duration,
        difficulty,
        genderTarget,
        equipmentRequired,
        status = 'draft',
      } = req.body;

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create program
      const program = await Program.create({
        name,
        slug,
        description,
        duration: parseInt(duration) || 30,
        difficulty,
        genderTarget,
        equipmentRequired: equipmentRequired === 'true',
        status,
        isActive: true,
        sortOrder: 0,
        enrollmentCount: 0,
      });

      res.status(201).json({
        success: true,
        data: program.toJSON(),
        message: 'Program created successfully',
      });
    } catch (error: any) {
      logger.error('Failed to create program', {
        error: error.message,
        adminId: req.admin?.adminId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create program',
      });
    }
  }

  /**
   * Update program
   */
  async updateProgram(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      const { programSlug } = req.params;
      

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication requireddd',
        });
      }

      // Check permissions
      const admin = await this.adminAuthService.getAdminProfile(adminId);
      if (!admin.hasPermission('manage_programs')) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      console.log("bambam", programSlug);
      const program = await Program.unscoped().findOne({ 
      where: { 
        slug: programSlug 
      } 
    });
      console.log("bamba", program);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
        });
      }

      // Update program
      await program.update({
        ...req.body,
        equipmentRequired: req.body.equipmentRequired === 'true',
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        data: program.toJSON(),
        message: 'Program updated successfully',
      });
    } catch (error: any) {
      logger.error('Failed to update program', {
        error: error.message,
        adminId: req.admin?.adminId,
        programSlug: req.params.programSlug,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update program',
      });
    }
  }

  /**
   * Delete program
   */
  async deleteProgram(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      const { programSlug } = req.params;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check permissions (super admin only for deletion)
      const admin = await this.adminAuthService.getAdminProfile(adminId);
      if (!admin.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only super admins can delete programs',
        });
      }

     const program = await Program.unscoped().findOne({ where: { slug: programSlug } });
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
        });
      }

      // Soft delete
      await program.update({
        isActive: false,
        status: 'archived',
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        message: 'Program archived successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete program', {
        error: error.message,
        adminId: req.admin?.adminId,
        programSlug: req.params.programSlug,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete program',
      });
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(req: AdminAuthRequest, res: Response) {
    try {
      const adminId = req.admin?.adminId;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Get file counts from spaces
      const coverCount = await this.adminUploadService.listFiles('cover/');
      const videoCount = await this.adminUploadService.listFiles('video/');
      const thumbnailCount = await this.adminUploadService.listFiles('thumbnail/');

      // Get program counts
      const programCount = await Program.count({ where: { isActive: true } });
      const draftCount = await Program.count({ where: { status: 'draft' } });
      const publishedCount = await Program.count({ where: { status: 'published' } });

      res.status(200).json({
        success: true,
        data: {
          storage: {
            covers: coverCount.length,
            videos: videoCount.length,
            thumbnails: thumbnailCount.length,
            total: coverCount.length + videoCount.length + thumbnailCount.length,
          },
          programs: {
            total: programCount,
            draft: draftCount,
            published: publishedCount,
            byDifficulty: {
              beginner: await Program.count({ where: { difficulty: 'beginner' } }),
              intermediate: await Program.count({ where: { difficulty: 'intermediate' } }),
              advanced: await Program.count({ where: { difficulty: 'advanced' } }),
            },
            byGender: {
              male: await Program.count({ where: { genderTarget: 'male' } }),
              female: await Program.count({ where: { genderTarget: 'female' } }),
              both: await Program.count({ where: { genderTarget: 'both' } }),
            },
          },
        },
      });
    } catch (error: any) {
      logger.error('Failed to get upload stats', {
        error: error.message,
        adminId: req.admin?.adminId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get upload stats',
      });
    }
  }
}

// Export multer middleware
export const uploadMiddleware = upload;