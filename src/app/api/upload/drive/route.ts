import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Google Drive API
function getDriveClient() {
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

// Convert buffer to readable stream
function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
  return readable;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Google Drive is configured
    if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.error('Missing Google Drive config:', {
        hasEmail: !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        hasKey: !!process.env.GOOGLE_DRIVE_PRIVATE_KEY,
        hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      });
      return NextResponse.json(
        { error: 'Google Drive is not configured. Please set environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Google Drive
    const drive = getDriveClient();
    const timestamp = Date.now();
    const fileName = `banner_${timestamp}_${file.name}`;

    console.log('Uploading to Google Drive:', { fileName, size: buffer.length, type: file.type });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: bufferToStream(buffer),
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    console.log('File uploaded, setting permissions:', fileId);

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Use lh3.googleusercontent.com for direct image access (better for embedding)
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    console.log('Upload successful:', directUrl);

    return NextResponse.json({
      url: directUrl,
      fileId: fileId,
      fileName: fileName,
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
