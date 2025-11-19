import path from 'path';

import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

import { ApiError } from '@/middleware/error';

const sanitizeFolder = (folder: string): string => folder.replace(/[^a-zA-Z0-9/_-]/g, '-');

const ensureEmulatorHost = (): void => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST ?? process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  if (!emulatorHost) {
    return;
  }

  // Extract host:port from the emulator host (remove protocol if present)
  let hostPort = emulatorHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // If it doesn't have a port, add default
  if (!hostPort.includes(':')) {
    hostPort = `${hostPort}:9199`;
  }
  
  // Firebase Admin SDK requires FIREBASE_STORAGE_EMULATOR_HOST in format: host:port (NO protocol)
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = hostPort;
  
  // Our buildPublicUrl function expects STORAGE_EMULATOR_HOST with http:// protocol
  if (!process.env.STORAGE_EMULATOR_HOST?.startsWith('http')) {
    process.env.STORAGE_EMULATOR_HOST = `http://${hostPort}`;
  }
};

// Run immediately when module loads to set env vars before Firebase initialization
ensureEmulatorHost();

export interface SaveAssetParams {
  buffer: Buffer;
  contentType: string;
  filename: string;
  folder: string;
  metadata?: Record<string, string>;
}

export interface StoredAsset {
  path: string;
  url: string;
  bucket: string;
}

const buildPublicUrl = (bucket: string, relativePath: string): string => {
  const emulatorHost =
    process.env.STORAGE_EMULATOR_HOST ?? `http://127.0.0.1:${process.env.STORAGE_EMULATOR_PORT ?? '9199'}`;
  const baseUrl = emulatorHost.replace(/\/$/, '');
  const encodedPath = encodeURIComponent(relativePath);
  return `${baseUrl}/v0/b/${bucket}/o/${encodedPath}?alt=media`;
};

export const saveAsset = async ({
  buffer,
  contentType,
  filename,
  folder,
  metadata,
}: SaveAssetParams): Promise<StoredAsset> => {
  // Try env vars first, then fall back to Firebase app config
  let bucketName = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.STORAGE_BUCKET;
  
  if (!bucketName) {
    // Fall back to bucket from Firebase app config (set in initializeFirebase)
    const app = admin.apps[0];
    if (app?.options.storageBucket) {
      bucketName = app.options.storageBucket;
    }
  }
  
  if (!bucketName) {
    throw new ApiError(500, 'Firebase storage bucket not configured. Set FIREBASE_STORAGE_BUCKET or ensure Firebase is initialized with storageBucket.');
  }

  const sanitizedFolder = sanitizeFolder(folder);
  const relativePath = path.posix.join(sanitizedFolder, filename);

  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(relativePath);

  await file.save(buffer, {
    contentType,
    metadata,
    resumable: false,
  });

  const url = buildPublicUrl(bucketName, relativePath);

  return {
    path: relativePath,
    url,
    bucket: bucketName,
  };
};
