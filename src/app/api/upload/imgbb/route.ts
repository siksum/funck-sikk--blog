import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check if imgbb is configured
    if (!process.env.IMGBB_API_KEY) {
      return NextResponse.json(
        { error: 'imgbb is not configured. Please set IMGBB_API_KEY.' },
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

    // Validate file size (max 32MB for imgbb)
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 32MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Upload to imgbb
    const imgbbFormData = new FormData();
    imgbbFormData.append('key', process.env.IMGBB_API_KEY);
    imgbbFormData.append('image', base64);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('imgbb error:', errorText);
      throw new Error('imgbb upload failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return NextResponse.json({
      url: data.data.url,
      deleteUrl: data.data.delete_url,
      thumbnail: data.data.thumb?.url,
    });
  } catch (error) {
    console.error('imgbb upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
