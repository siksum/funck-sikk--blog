// Client-side direct upload to Google Drive
// This bypasses server body size limits by uploading directly from browser

export interface GoogleDriveDirectUploadResult {
  url: string;
  fileId: string;
  fileName: string;
  webViewLink: string;
  mimeType: string;
  provider: 'google-drive';
}

export async function uploadToGoogleDriveDirect(
  file: File,
  onProgress?: (progress: number) => void
): Promise<GoogleDriveDirectUploadResult> {
  // Step 1: Get access token from our server
  const tokenResponse = await fetch('/api/upload/google-drive/token');
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    throw new Error(error.error || 'Failed to get upload token');
  }

  const { accessToken, folderId } = await tokenResponse.json();

  // Step 2: Create the file metadata
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  // Step 3: Create multipart form data for Google Drive API
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  // Step 4: Upload directly to Google Drive
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Google Drive upload error:', errorText);
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;

  // Step 5: Make the file publicly accessible
  const permissionResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
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

  return {
    url: `https://drive.google.com/uc?id=${fileId}&export=download`,
    fileId: fileId,
    fileName: uploadResult.name || file.name,
    webViewLink: uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    mimeType: uploadResult.mimeType || file.type,
    provider: 'google-drive',
  };
}

// For large files, use resumable upload
export async function uploadToGoogleDriveResumable(
  file: File,
  onProgress?: (progress: number) => void
): Promise<GoogleDriveDirectUploadResult> {
  // Step 1: Get access token from our server
  const tokenResponse = await fetch('/api/upload/google-drive/token');
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    throw new Error(error.error || 'Failed to get upload token');
  }

  const { accessToken, folderId } = await tokenResponse.json();

  // Step 2: Initiate resumable upload
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': file.type,
        'X-Upload-Content-Length': file.size.toString(),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initResponse.ok) {
    throw new Error(`Failed to initiate upload: ${initResponse.status}`);
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('No upload URL returned');
  }

  // Step 3: Upload file content
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size.toString(),
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;

  // Step 4: Make the file publicly accessible
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
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

  return {
    url: `https://drive.google.com/uc?id=${fileId}&export=download`,
    fileId: fileId,
    fileName: uploadResult.name || file.name,
    webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
    mimeType: uploadResult.mimeType || file.type,
    provider: 'google-drive',
  };
}
