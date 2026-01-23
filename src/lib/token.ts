import { randomBytes } from 'crypto';

/**
 * Generate a secure, URL-safe token for sharing posts
 * @param length - Number of bytes to generate (default: 16, produces ~22 char token)
 * @returns URL-safe base64 encoded token
 */
export function generateShareToken(length: number = 16): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Validate token format
 * @param token - Token to validate
 * @returns true if token appears to be valid format
 */
export function isValidTokenFormat(token: string): boolean {
  // Base64url characters: A-Z, a-z, 0-9, -, _
  // Minimum 16 characters for security
  return /^[A-Za-z0-9_-]{16,}$/.test(token);
}
