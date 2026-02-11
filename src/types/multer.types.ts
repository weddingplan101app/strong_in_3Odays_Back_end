import { Request } from 'express';
import { AdminPayload } from './admin.types';

export interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export interface WorkoutVideoUploadFiles extends MulterFiles {
  video: Express.Multer.File[];
  thumbnail: Express.Multer.File[];
}

// Extend the Request type
declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}