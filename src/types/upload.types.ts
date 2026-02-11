// src/types/upload.types.ts
import { Request } from 'express';
import { AdminPayload } from './admin.types';

export interface MulterFieldFiles {
  [fieldname: string]: Express.Multer.File[];
}

export interface VideoUploadFiles extends MulterFieldFiles {
  video: Express.Multer.File[];
  thumbnail: Express.Multer.File[];
}

// Type guard for video upload files
export function isVideoUploadFiles(
  files: any
): files is VideoUploadFiles {
  return (
    files &&
    typeof files === 'object' &&
    Array.isArray(files.video) &&
    files.video.length > 0 &&
    Array.isArray(files.thumbnail) &&
    files.thumbnail.length > 0
  );
}