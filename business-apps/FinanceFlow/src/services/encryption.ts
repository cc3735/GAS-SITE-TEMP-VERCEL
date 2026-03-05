import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Derive key from password using PBKDF2
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    config.encryption.key,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypt sensitive data (e.g., SSN, financial info)
 * Returns base64 encoded string: salt:iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  // Combine all parts: salt:iv:authTag:encryptedData
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract parts
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash data (one-way, for comparisons)
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data + config.encryption.key)
    .digest('hex');
}

/**
 * Mask sensitive data for display (e.g., SSN: ***-**-1234)
 */
export function maskSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return '***-**-****';
  return `***-**-${cleaned.slice(-4)}`;
}

/**
 * Mask account number for display
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return '****';
  return `****${accountNumber.slice(-4)}`;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate SSN format
 */
export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return false;
  
  // Basic validation - not 000, 666, or 900-999 for area number
  const areaNumber = parseInt(cleaned.slice(0, 3), 10);
  if (areaNumber === 0 || areaNumber === 666 || areaNumber >= 900) {
    return false;
  }
  
  // Group number cannot be 00
  const groupNumber = parseInt(cleaned.slice(3, 5), 10);
  if (groupNumber === 0) return false;
  
  // Serial number cannot be 0000
  const serialNumber = parseInt(cleaned.slice(5), 10);
  if (serialNumber === 0) return false;
  
  return true;
}

/**
 * Format SSN with dashes
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return ssn;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

