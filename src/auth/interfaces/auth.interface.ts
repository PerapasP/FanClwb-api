import { UserRole } from '@prisma/client';
import { type Request } from 'express';

export interface JwtPayload {
  user_id: string;
  email: string | null;
  role: UserRole;
}

// override Express.User globally
declare module 'express' {
  interface User extends JwtPayload {
    // extends JwtPayload to merge with Express.User
    _brand?: never;
  }
}

// user มีแน่นอน (JwtAuthGuard)
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// user อาจไม่มี (OptionalJwtAuthGuard)
export type OptionalAuthRequest = Request & {
  user?: JwtPayload;
};
