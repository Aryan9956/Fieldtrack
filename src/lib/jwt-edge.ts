import { jwtVerify } from 'jose';
import { JWTPayload } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fieldtrack-dev-secret-key-change-in-production-min32chars'
);

export async function verifyJWTTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
