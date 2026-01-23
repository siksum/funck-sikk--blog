import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Returns access token and folder ID for direct client-side upload
export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey || !folderId) {
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
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const accessToken = await auth.getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken,
      folderId,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate token: ${errorMessage}` },
      { status: 500 }
    );
  }
}
