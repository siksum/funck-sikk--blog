import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  downloadUrl: string;
  thumbnailLink?: string;
  createdTime: string;
  size?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

// List files from Google Drive
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driveType = searchParams.get('drive') || 'blog';
    const folderId = searchParams.get('folderId'); // Optional folder to list
    const pageToken = searchParams.get('pageToken') || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

    const blogDriveId = process.env.GOOGLE_DRIVE_BLOG_ID;
    const sikkDriveId = process.env.GOOGLE_DRIVE_SIKK_ID;
    const homeDriveId = process.env.GOOGLE_DRIVE_HOME_ID;
    const legacyFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    let driveId: string | undefined;
    if (driveType === 'sikk') {
      driveId = sikkDriveId || legacyFolderId;
    } else if (driveType === 'home') {
      driveId = homeDriveId || legacyFolderId;
    } else {
      driveId = blogDriveId || legacyFolderId;
    }

    if (!clientEmail || !privateKey || !driveId) {
      return NextResponse.json(
        { error: 'Google Drive is not configured' },
        { status: 500 }
      );
    }

    // Handle different private key formats
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith('"')) {
      privateKey = privateKey.slice(1);
    }
    if (privateKey.endsWith('"')) {
      privateKey = privateKey.slice(0, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n').trim();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Parent folder to list (either specified folder or drive root)
    const parentId = folderId || driveId;

    // List files in the folder
    const response = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, size)',
      orderBy: 'createdTime desc',
      pageSize,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
    });

    const filesMap = new Map<string, DriveFile>();
    const foldersMap = new Map<string, DriveFolder>();

    for (const file of response.data.files || []) {
      // Skip if already processed (deduplicate by ID)
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        if (!foldersMap.has(file.id!)) {
          foldersMap.set(file.id!, {
            id: file.id!,
            name: file.name!,
          });
        }
      } else {
        if (!filesMap.has(file.id!)) {
          // Use lh3.googleusercontent.com for images (embeddable), uc for downloads
          const isImage = file.mimeType?.startsWith('image/');
          const downloadUrl = isImage
            ? `https://lh3.googleusercontent.com/d/${file.id}`
            : `https://drive.google.com/uc?id=${file.id}&export=download&name=${encodeURIComponent(file.name!)}`;

          filesMap.set(file.id!, {
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            downloadUrl,
            thumbnailLink: file.thumbnailLink || undefined,
            createdTime: file.createdTime!,
            size: file.size || undefined,
          });
        }
      }
    }

    const files = Array.from(filesMap.values());
    const folders = Array.from(foldersMap.values());

    return NextResponse.json({
      files,
      folders,
      nextPageToken: response.data.nextPageToken || null,
      currentFolderId: parentId,
      rootFolderId: driveId,
    });
  } catch (error) {
    console.error('List files error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to list files: ${errorMessage}` },
      { status: 500 }
    );
  }
}
