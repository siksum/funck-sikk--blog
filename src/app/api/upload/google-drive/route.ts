import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const config = googleDriveService.checkConfiguration();
    if (!config.configured) {
      return NextResponse.json({ error: config.error }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed for Google Drive upload.' },
        { status: 400 }
      );
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await googleDriveService.uploadFile(buffer, file.name, file.type);

    return NextResponse.json({
      url: result.webContentLink,
      fileId: result.fileId,
      fileName: result.fileName,
      webViewLink: result.webViewLink,
      mimeType: result.mimeType,
      provider: 'google-drive',
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}
