// src/lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Initialize Cloudflare R2 Client
 */
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Generates a secure filename for upload
 * @param originalName - Original filename
 * @param prefix - Optional prefix for the filename (e.g., 'user-avatars/')
 * @returns A secure filename
 */
export function generateSecureFilename(originalName: string, prefix = ''): string {
  const filenameParts = originalName.split('.');
  const ext = filenameParts.pop() || '';
  const sanitizedName = filenameParts.join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
  
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  
  return `${prefix}${sanitizedName}-${timestamp}-${randomString}.${ext}`;
}

/**
 * Validates a file before upload
 * @param file - The file to validate
 * @param options - Validation options
 * @returns True if valid, throws error if invalid
 */
export function validateFile(
  file: File, 
  options: { 
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): boolean {
  const { 
    maxSize = MAX_FILE_SIZE,
    allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
  } = options;
  
  if (file.size > maxSize) {
    throw new Error(`File size exceeds the maximum allowed limit of ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type not supported. Allowed types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`);
  }

  return true;
}

/**
 * Uploads a file to Cloudflare R2 with progress tracking
 * @param file - The file to upload
 * @param path - The path/key where the file will be stored in the bucket
 * @param options - Upload options
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
  file: File, 
  path: string,
  options: {
    onProgress?: (progress: number) => void;
    metadata?: Record<string, string>;
    cacheControl?: string;
    validateOptions?: Parameters<typeof validateFile>[1];
    maxRetries?: number;
  } = {}
): Promise<string> {
  const {
    onProgress,
    metadata = {},
    cacheControl = 'public, max-age=31536000',
    validateOptions = {},
    maxRetries = 3
  } = options;
  
  try {
    validateFile(file, validateOptions);
    
    const arrayBuffer = await file.arrayBuffer();
    
    let retries = 0;
    let success = false;

    while (!success && retries <= maxRetries) {
      try {
        if (retries > 0) {
          console.log(`Retrying upload (attempt ${retries} of ${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
        
        await R2.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: path,
            Body: Buffer.from(arrayBuffer),
            ContentType: file.type,
            CacheControl: cacheControl,
            Metadata: metadata,
          })
        );
        
        success = true;
        if (onProgress) onProgress(100);
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }
      }
    }

    return `${PUBLIC_URL}/${path}`;
  } catch (error: any) {
    console.error("Error uploading to R2:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Generates a presigned URL for temporary access to a private file
 * @param path - The path/key of the file in the bucket
 * @param expirationSeconds - How long the URL should be valid (default: 1 hour)
 * @returns A pre-signed URL with temporary access
 */
export async function getPresignedUrl(path: string, expirationSeconds = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    });

    return getSignedUrl(R2, command, { expiresIn: expirationSeconds });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Deletes a file from Cloudflare R2
 * @param path - The path/key of the file to delete
 * @returns Promise<void>
 */
export async function deleteFromR2(path: string): Promise<void> {
  try {
    await R2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      })
    );
  } catch (error: any) {
    console.error("Error deleting from R2:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Converts a file path to a public URL
 * @param path - The path/key of the file in the bucket
 * @returns The public URL of the file
 */
export function getPublicUrl(path: string): string {
  return `${PUBLIC_URL}/${path}`;
}

/**
 * Checks if a file exists in the R2 bucket
 * @param path - The path/key of the file to check
 * @returns Promise<boolean> True if file exists
 */
export async function fileExistsInR2(path: string): Promise<boolean> {
  try {
    await R2.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      })
    );
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    console.error("Error checking if file exists in R2:", error);
    throw new Error(`Failed to check if file exists: ${error.message}`);
  }
}
