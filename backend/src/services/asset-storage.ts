import path from 'path';

import { getStorage } from 'firebase-admin/storage';

import { ApiError } from '@/middleware/error';

const sanitizeFolder = (folder: string): string => folder.replace(/[^a-zA-Z0-9/_-]/g, '-');

const ensureEmulatorHost = (): void => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST ?? process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  if (!emulatorHost) {
    return;
  }

  try {
    const url = new URL(emulatorHost);
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${url.hostname}:${url.port ?? '9199'}`;
  } catch {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = emulatorHost;
  }
};

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
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.STORAGE_BUCKET;
  if (!bucketName) {
    throw new ApiError(500, 'Firebase storage bucket not configured. Set FIREBASE_STORAGE_BUCKET.');
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
