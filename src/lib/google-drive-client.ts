// Client-side direct upload to Google Drive
// This bypasses server body size limits by uploading directly from browser
// Supports blog/sikk drives with category folders

export interface GoogleDriveDirectUploadResult {
  url: string;
  fileId: string;
  fileName: string;
  webViewLink: string;
  mimeType: string;
  provider: 'google-drive';
}

export interface GoogleDriveUploadOptions {
  driveType?: 'blog' | 'sikk';
  category?: string;
}

// Normalize folder name for consistent casing (Title Case)
function normalizeFolderName(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(''); // No spaces - "Wargame" not "War Game"
}

// Declare global window properties for TypeScript
declare global {
  interface Window {
    __googleDriveKnownFolderIds?: Map<string, string>;
    __googleDriveFolderCreationCache?: Map<string, Promise<string>>;
  }
}

// LocalStorage key for persistent folder cache
const FOLDER_CACHE_KEY = 'googleDriveFolderCache';
const FOLDER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Load folder cache from localStorage
function loadFolderCacheFromStorage(): Map<string, string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return new Map();
  }
  try {
    const cached = localStorage.getItem(FOLDER_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Check if cache is still valid (within TTL)
      if (Date.now() - timestamp < FOLDER_CACHE_TTL) {
        return new Map(Object.entries(data));
      }
    }
  } catch (e) {
    console.warn('Failed to load folder cache from localStorage:', e);
  }
  return new Map();
}

// Save folder cache to localStorage
function saveFolderCacheToStorage(cache: Map<string, string>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    const data = Object.fromEntries(cache);
    localStorage.setItem(FOLDER_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save folder cache to localStorage:', e);
  }
}

// Get persistent cache of known folder IDs (uses window global + localStorage for persistence)
// Key format: "parentFolderId:normalizedFolderName" -> folderId
function getKnownFolderIds(): Map<string, string> {
  if (typeof window === 'undefined') {
    return new Map();
  }
  if (!window.__googleDriveKnownFolderIds) {
    // Initialize from localStorage on first access
    window.__googleDriveKnownFolderIds = loadFolderCacheFromStorage();
  }
  return window.__googleDriveKnownFolderIds;
}

// Helper to add folder to cache and persist to localStorage
function cacheFolder(key: string, folderId: string): void {
  const cache = getKnownFolderIds();
  cache.set(key, folderId);
  saveFolderCacheToStorage(cache);
}

// Get cache for pending folder creation promises (uses window global to survive module reloads)
// Key format: "parentFolderId:normalizedFolderName"
function getFolderCreationCache(): Map<string, Promise<string>> {
  if (typeof window === 'undefined') {
    return new Map();
  }
  if (!window.__googleDriveFolderCreationCache) {
    window.__googleDriveFolderCreationCache = new Map();
  }
  return window.__googleDriveFolderCreationCache;
}

// Helper function to list folders in a parent and cache ALL of them
async function listAndCacheFolders(
  accessToken: string,
  parentFolderId: string
): Promise<Array<{ id: string; name: string }>> {
  const knownFolderIds = getKnownFolderIds();

  const listQuery = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
  );

  const listResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${listQuery}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name)&pageSize=1000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    console.warn('List folders failed:', errorText);
    return [];
  }

  const listResult = await listResponse.json();
  const folders = listResult.files || [];

  console.log(`Listed ${folders.length} folders in parent ${parentFolderId}`);

  // Cache ALL folders found with multiple key formats for maximum compatibility
  for (const folder of folders) {
    // Cache with normalized name (lowercase)
    const normalizedFolderName = normalizeFolderName(folder.name);
    const normalizedKey = `${parentFolderId}:${normalizedFolderName.toLowerCase()}`;
    knownFolderIds.set(normalizedKey, folder.id);

    // Also cache with original name (lowercase) for direct lookups
    const originalKey = `${parentFolderId}:${folder.name.toLowerCase()}`;
    if (originalKey !== normalizedKey) {
      knownFolderIds.set(originalKey, folder.id);
    }

    console.log(`Cached folder: "${folder.name}" (${folder.id}) with keys: ${normalizedKey}, ${originalKey}`);
  }

  // Persist cache to localStorage after batch update
  saveFolderCacheToStorage(knownFolderIds);

  return folders;
}

// Internal function that actually finds or creates the folder
async function findOrCreateSingleFolderInternal(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  // Normalize folder name for consistency
  const normalizedName = normalizeFolderName(folderName);
  const cacheKey = `${parentFolderId}:${normalizedName.toLowerCase()}`;
  const knownFolderIds = getKnownFolderIds();

  // Check persistent cache first (handles Google Drive API eventual consistency)
  const cachedFolderId = knownFolderIds.get(cacheKey);
  if (cachedFolderId) {
    console.log(`Using cached folder ID for "${normalizedName}": ${cachedFolderId}`);
    return cachedFolderId;
  }

  // Also check with original name as cache key
  const originalCacheKey = `${parentFolderId}:${folderName.toLowerCase()}`;
  const cachedByOriginal = knownFolderIds.get(originalCacheKey);
  if (cachedByOriginal) {
    console.log(`Using cached folder ID (original name) for "${folderName}": ${cachedByOriginal}`);
    // Also store with normalized key for consistency
    cacheFolder(cacheKey, cachedByOriginal);
    return cachedByOriginal;
  }

  // List all folders and cache them
  const folders = await listAndCacheFolders(accessToken, parentFolderId);

  // Check cache again after listing (listAndCacheFolders populates the cache)
  const cachedAfterList = knownFolderIds.get(cacheKey) || knownFolderIds.get(originalCacheKey);
  if (cachedAfterList) {
    console.log(`Found folder in cache after listing: ${cachedAfterList}`);
    return cachedAfterList;
  }

  // Also do a direct search through the results for extra safety
  if (folders.length > 0) {
    const existingFolder = folders.find(
      (f: { id: string; name: string }) =>
        f.name.toLowerCase() === normalizedName.toLowerCase() ||
        f.name.toLowerCase() === folderName.toLowerCase()
    );
    if (existingFolder) {
      console.log(`Found existing folder via direct search: ${existingFolder.name} (${existingFolder.id})`);
      cacheFolder(cacheKey, existingFolder.id);
      return existingFolder.id;
    }
    // Log all found folders for debugging
    console.log(`No match for "${normalizedName}" (original: "${folderName}") in:`, folders.map((f: { name: string }) => f.name));
  }

  // Create new folder if not found
  console.log(`Creating new folder: ${normalizedName} in parent ${parentFolderId}`);
  const folderMetadata = {
    name: normalizedName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Failed to create folder:', errorText);
    throw new Error(`Failed to create category folder: ${normalizedName}`);
  }

  const createResult = await createResponse.json();
  console.log(`Created folder: ${normalizedName} (${createResult.id})`);

  // Store in persistent cache for future lookups (persists to localStorage)
  cacheFolder(cacheKey, createResult.id);

  return createResult.id;
}

// Find or create a single folder inside the parent folder
// Uses caching to prevent race conditions when multiple uploads happen simultaneously
async function findOrCreateSingleFolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const normalizedName = normalizeFolderName(folderName);
  const cacheKey = `${parentFolderId}:${normalizedName.toLowerCase()}`;
  const folderCreationCache = getFolderCreationCache();

  // Check if there's already a pending creation for this folder
  const pending = folderCreationCache.get(cacheKey);
  if (pending) {
    console.log(`Waiting for pending folder creation: ${folderName}`);
    return pending;
  }

  // Create a promise for this folder operation and cache it
  const creationPromise = findOrCreateSingleFolderInternal(accessToken, parentFolderId, folderName)
    .finally(() => {
      // Clean up cache after completion, with a small delay to catch very close race conditions
      setTimeout(() => {
        getFolderCreationCache().delete(cacheKey);
      }, 2000);
    });

  folderCreationCache.set(cacheKey, creationPromise);
  return creationPromise;
}

// Pre-fetch all folders in the path to populate cache before creating
// This ensures we find existing folders even after page refresh
async function prefetchFolderPath(
  accessToken: string,
  rootFolderId: string,
  categoryPath: string
): Promise<void> {
  const parts = categoryPath.split('/').filter(p => p.trim() !== '');
  const knownFolderIds = getKnownFolderIds();

  console.log(`Pre-fetching folder path: ${categoryPath}`);

  let currentParentId = rootFolderId;

  for (const folderName of parts) {
    const normalizedName = normalizeFolderName(folderName);
    const cacheKey = `${currentParentId}:${normalizedName.toLowerCase()}`;
    const originalCacheKey = `${currentParentId}:${folderName.toLowerCase()}`;

    // Check cache first
    let folderId = knownFolderIds.get(cacheKey) || knownFolderIds.get(originalCacheKey);

    if (!folderId) {
      // List and cache all folders in this level
      const folders = await listAndCacheFolders(accessToken, currentParentId);

      // Check cache again after listing
      folderId = knownFolderIds.get(cacheKey) || knownFolderIds.get(originalCacheKey);

      if (!folderId) {
        // Folder doesn't exist at this level, stop prefetching
        console.log(`Folder "${normalizedName}" not found in parent ${currentParentId}, stopping prefetch`);
        break;
      }
    }

    console.log(`Pre-fetched folder "${normalizedName}": ${folderId}`);
    currentParentId = folderId;
  }
}

// Find or create nested category folders (supports paths like "wargame/bandit")
async function findOrCreateCategoryFolder(
  accessToken: string,
  rootFolderId: string,
  categoryPath: string
): Promise<string> {
  // Split path into parts and create folders recursively
  const parts = categoryPath.split('/').filter(p => p.trim() !== '');

  console.log(`Creating category path: ${categoryPath} (parts: ${parts.join(' -> ')}) in root ${rootFolderId}`);

  // Pre-fetch existing folders first to populate cache
  await prefetchFolderPath(accessToken, rootFolderId, categoryPath);

  let currentParentId = rootFolderId;
  for (const folderName of parts) {
    currentParentId = await findOrCreateSingleFolder(accessToken, currentParentId, folderName);
  }

  return currentParentId;
}

export async function uploadToGoogleDriveDirect(
  file: File,
  options: GoogleDriveUploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<GoogleDriveDirectUploadResult> {
  const { driveType = 'blog', category = '' } = options;

  // Step 1: Get access token from our server
  const tokenUrl = `/api/upload/google-drive/token?drive=${driveType}&category=${encodeURIComponent(category)}`;
  const tokenResponse = await fetch(tokenUrl);
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    throw new Error(error.error || 'Failed to get upload token');
  }

  const { accessToken, driveId } = await tokenResponse.json();

  // Step 2: Determine parent folder (drive root or category folder)
  let parentFolderId = driveId;

  if (category) {
    parentFolderId = await findOrCreateCategoryFolder(accessToken, driveId, category);
  }

  // Step 3: Create the file metadata
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/pdf',
    parents: [parentFolderId],
  };

  // Step 4: Create multipart/related body for Google Drive API
  const boundary = '-------314159265358979323846';

  // Read file as ArrayBuffer
  const fileArrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileArrayBuffer);

  // Build multipart body - first boundary has no leading CRLF
  const metadataPart =
    '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n';

  const filePart = '--' + boundary + '\r\n' + 'Content-Type: ' + (file.type || 'application/pdf') + '\r\n\r\n';

  const closeDelimiter = '\r\n--' + boundary + '--';

  // Combine parts
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const filePartBytes = encoder.encode(filePart);
  const closeBytes = encoder.encode(closeDelimiter);

  // Create combined buffer
  const bodyBuffer = new Uint8Array(
    metadataBytes.length + filePartBytes.length + fileBytes.length + closeBytes.length
  );
  bodyBuffer.set(metadataBytes, 0);
  bodyBuffer.set(filePartBytes, metadataBytes.length);
  bodyBuffer.set(fileBytes, metadataBytes.length + filePartBytes.length);
  bodyBuffer.set(closeBytes, metadataBytes.length + filePartBytes.length + fileBytes.length);

  // Step 5: Upload directly to Google Drive using multipart/related
  // supportsAllDrives=true is required for Shared Drives
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,mimeType',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: bodyBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Google Drive upload error:', uploadResponse.status, errorText);
    // Try to parse JSON error for better message
    try {
      const errorJson = JSON.parse(errorText);
      const message = errorJson.error?.message || errorText;
      throw new Error(`Google Drive: ${message}`);
    } catch {
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText.substring(0, 200)}`);
    }
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;

  // Step 6: Make the file publicly accessible
  // supportsAllDrives=true is required for Shared Drives
  const permissionResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );

  if (!permissionResponse.ok) {
    console.warn('Failed to set public permissions, file may not be accessible');
  }

  const fileName = uploadResult.name || file.name;
  const mimeType = uploadResult.mimeType || file.type;

  // Use appropriate URL format based on file type
  let url: string;
  if (mimeType.startsWith('image/')) {
    // For images, use lh3.googleusercontent.com for direct embedding
    url = `https://lh3.googleusercontent.com/d/${fileId}`;
  } else {
    // For other files, use download URL
    url = `https://drive.google.com/uc?id=${fileId}&export=download&name=${encodeURIComponent(fileName)}`;
  }

  return {
    url,
    fileId: fileId,
    fileName: fileName,
    webViewLink: uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    mimeType: mimeType,
    provider: 'google-drive',
  };
}
