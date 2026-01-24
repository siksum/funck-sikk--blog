import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a new folder in Cloudinary
export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured' },
        { status: 500 }
      );
    }

    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
    }

    // Create folder by uploading a placeholder (Cloudinary creates folders implicitly)
    // We'll create an empty folder using the Admin API
    const result = await cloudinary.api.create_folder(folderPath);

    return NextResponse.json({
      success: true,
      folder: result,
    });
  } catch (error) {
    console.error('Cloudinary folder creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create folder: ${errorMessage}` },
      { status: 500 }
    );
  }
}
