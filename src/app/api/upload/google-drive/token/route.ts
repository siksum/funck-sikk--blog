import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Returns access token and drive ID for direct client-side upload
// Supports blog and sikk drives with category folders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driveType = searchParams.get('drive') || 'blog'; // 'blog' or 'sikk'
    const category = searchParams.get('category') || '';

    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

    // Get the appropriate drive ID based on type
    const blogDriveId = process.env.GOOGLE_DRIVE_BLOG_ID;
    const sikkDriveId = process.env.GOOGLE_DRIVE_SIKK_ID;
    const homeDriveId = process.env.GOOGLE_DRIVE_HOME_ID;
    // Fallback to single folder ID for backward compatibility
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
      scopes: ['https://www.googleapis.com/auth/drive'],
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
      driveId,
      category,
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
