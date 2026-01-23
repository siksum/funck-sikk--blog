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

// Find or create a category folder inside the parent folder
async function findOrCreateCategoryFolder(
  accessToken: string,
  parentFolderId: string,
  categoryName: string
): Promise<string> {
  // Search for existing folder inside the parent folder
  // Use corpora=allDrives to search across all shared drives
  const searchQuery = encodeURIComponent(
    `name='${categoryName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
  );

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (searchResponse.ok) {
    const searchResult = await searchResponse.json();
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }
  }

  // Create new folder if not found
  const folderMetadata = {
    name: categoryName,
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
    throw new Error(`Failed to create category folder: ${categoryName}`);
  }

  const createResult = await createResponse.json();
  return createResult.id;
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

  return {
    // Include filename in URL as query parameter for display purposes
    url: `https://drive.google.com/uc?id=${fileId}&export=download&name=${encodeURIComponent(fileName)}`,
    fileId: fileId,
    fileName: fileName,
    webViewLink: uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    mimeType: uploadResult.mimeType || file.type,
    provider: 'google-drive',
  };
}
