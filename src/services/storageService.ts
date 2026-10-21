import { supabase } from '../supabaseClient';

export const STORAGE_BUCKET = 'app-files';

/**
 * Clean and extract file extension from a filename or mime type
 */
export function getCleanExtension(filename: string, mimeType?: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (ext) return ext;
  }

  // Fallback to mime type
  if (mimeType) {
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('svg')) return 'svg';
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('markdown') || mimeType.includes('md')) return 'md';
    if (mimeType.includes('text') || mimeType.includes('plain')) return 'txt';
    if (mimeType.includes('pdf')) return 'pdf';
  }

  return 'bin';
}

/**
 * Generate unique UUID for file naming
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate Supabase Storage file path adhering strictly to:
 * ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
 */
export function buildStoragePath(
  userId: string,
  featureName: string,
  itemId: string,
  filename: string,
  mimeType?: string
): string {
  const sanitizedUserId = userId.trim();
  const sanitizedFeature = featureName.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const sanitizedItemId = itemId.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'item';
  const ext = getCleanExtension(filename, mimeType);
  const uuid = generateUUID();

  return `${sanitizedUserId}/${sanitizedFeature}/${sanitizedItemId}/${uuid}.${ext}`;
}

export interface UploadResult {
  filePath: string;
  originalName: string;
  size: number;
  type: string;
  signedUrl: string | null;
}

/**
 * Upload any File or Blob to Supabase Storage in "app-files" private bucket
 * Folder path rule: ${userId}/${featureName}/${itemId}/${uuid}.${extension}
 */
export async function uploadFileToStorage(
  file: File | Blob,
  options: {
    userId: string;
    featureName: 'prompts' | 'avatars' | 'projects' | 'attachments';
    itemId: string;
    filename?: string;
  }
): Promise<UploadResult> {
  const originalName = options.filename || (file instanceof File ? file.name : 'upload.bin');
  const mimeType = file.type || 'application/octet-stream';
  const filePath = buildStoragePath(options.userId, options.featureName, options.itemId, originalName, mimeType);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError.message);
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${uploadError.message}`);
  }

  // Obtain an initial signed URL for display (since bucket is private)
  const signedUrl = await getSignedUrl(filePath, 3600);

  return {
    filePath,
    originalName,
    size: file.size,
    type: mimeType,
    signedUrl,
  };
}

/**
 * Generate temporary signed URL for a file in the private "app-files" bucket
 * Valid for expiresInSeconds (default 1 hour = 3600s)
 */
export async function getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!filePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.warn(`Could not create signed URL for path "${filePath}":`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error('getSignedUrl exception:', err);
    return null;
  }
}

/**
 * Batch generate signed URLs for an array of storage paths
 */
export async function batchGetSignedUrls(
  filePaths: string[],
  expiresInSeconds = 3600
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(filePaths.filter(Boolean)));
  if (uniquePaths.length === 0) return {};

  const results: Record<string, string> = {};

  // Supabase createSignedUrls accepts an array of paths
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(uniquePaths, expiresInSeconds);

    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach((item) => {
        const url = item.signedUrl || (item as any).signedURL;
        if (item.path && url) {
          results[item.path] = url;
        }
      });
    }
  } catch (e) {
    console.warn('batch createSignedUrls fallback to single calls', e);
  }

  // Fallback to sequential/parallel individual calls for any paths missing from batch
  const missing = uniquePaths.filter((path) => !results[path]);
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (path) => {
        const url = await getSignedUrl(path, expiresInSeconds);
        if (url) {
          results[path] = url;
        }
      })
    );
  }

  return results;
}

/**
 * Delete a file from the "app-files" bucket in Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  if (!filePath) return true;

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn(`Failed to delete file "${filePath}" from Supabase Storage:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deleteFileFromStorage exception:', err);
    return false;
  }
}

/**
 * Download a file from private storage using its signed URL
 */
export async function downloadFileFromStorage(filePath: string, downloadName?: string): Promise<void> {
  const signedUrl = await getSignedUrl(filePath, 300);
  if (!signedUrl) {
    throw new Error('Gagal mendapatkan tautan unduhan dari Supabase Storage.');
  }

  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error('Gagal mengunduh file.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName || filePath.split('/').pop() || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
