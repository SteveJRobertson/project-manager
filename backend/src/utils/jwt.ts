import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = (process.env.JWT_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev_jwt_secret_fallback_12345')) as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_EXPIRES_IN = '1d';

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
