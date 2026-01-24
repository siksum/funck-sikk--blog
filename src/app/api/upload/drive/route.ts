import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Google Drive API
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function POST(request: NextRequest) {
  try {
    // Check if Google Drive is configured
    if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json(
        { error: 'Google Drive is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create readable stream from buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload to Google Drive
    const drive = getDriveClient();
    const timestamp = Date.now();
    const fileName = `banner_${timestamp}_${file.name}`;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = response.data.id;

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get the direct link for the image
    // Google Drive direct link format: https://drive.google.com/uc?export=view&id=FILE_ID
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

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
