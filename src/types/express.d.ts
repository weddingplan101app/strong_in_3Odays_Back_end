// src/types/express.d.ts
import { AdminPayload } from './admin.types';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}