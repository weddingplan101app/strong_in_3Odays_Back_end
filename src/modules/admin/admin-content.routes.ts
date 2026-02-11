// src/modules/admin/admin-content.routes.ts
import { Router } from 'express';
import Container from 'typedi';
import { AdminContentController, uploadMiddleware } from './admin-content.controller';
import { 
  adminAuthMiddleware, 
  adminPermissionMiddleware,
  AdminAuthRequest 
} from '../../middleware/admin-auth.middleware';

const router = Router();
const adminContentController = Container.get(AdminContentController);

// =================== PROGRAM MANAGEMENT ===================

// Create program (requires manage_programs permission)
router.post('/programs',
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_programs'),
  (req: AdminAuthRequest, res) => adminContentController.createProgram(req, res)
);

// Update program (requires manage_programs permission)
router.put('/programs/:programSlug',
  adminAuthMiddleware,
  adminPermissionMiddleware('manage_programs'),
  (req: AdminAuthRequest, res) => adminContentController.updateProgram(req, res)
);

// Delete program (requires super admin)
router.delete('/programs/:programSlug',
  adminAuthMiddleware,
  (req: AdminAuthRequest, res) => adminContentController.deleteProgram(req, res)
);

// =================== UPLOAD ENDPOINTS ===================

// Upload program cover image
router.post('/upload/cover/:programSlug',
  adminAuthMiddleware,
  adminPermissionMiddleware('upload_content'),
  uploadMiddleware.single('cover'),
  (req: AdminAuthRequest, res) => adminContentController.uploadCoverImage(req, res)
);

// Upload workout video with thumbnail
router.post('/upload/video/:programSlug/day/:day',
  adminAuthMiddleware,
  adminPermissionMiddleware('upload_videos'),
  uploadMiddleware.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  (req: AdminAuthRequest, res) => adminContentController.uploadWorkoutVideo(req, res)
);

// =================== STATISTICS ===================

// Get upload statistics
router.get('/stats/uploads',
  adminAuthMiddleware,
  adminPermissionMiddleware('view_stats'),
  (req: AdminAuthRequest, res) => adminContentController.getUploadStats(req, res)
);

export default router;