import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryFile {
  id: string;
  name: string;
  url: string;
  secureUrl: string;
  thumbnailUrl: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  folder: string;
  bytes: number;
}

export interface CloudinaryFolder {
  name: string;
  path: string;
}

// List files and folders from Cloudinary
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'blog';
    const nextCursor = searchParams.get('nextCursor') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '50', 10);

    // List subfolders in the current folder
    let subfolders: CloudinaryFolder[] = [];
    try {
      const foldersResult = await cloudinary.api.sub_folders(folder);
      subfolders = foldersResult.folders.map((f: { name: string; path: string }) => ({
        name: f.name,
        path: f.path,
      }));
    } catch {
      // Folder might not exist or no subfolders - that's ok
    }

    // List images in the current folder
    const resourcesResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
      next_cursor: nextCursor,
      resource_type: 'image',
    });

    const files: CloudinaryFile[] = resourcesResult.resources
      .filter((r: { folder: string }) => r.folder === folder) // Only files directly in this folder
      .map(
        (r: {
          public_id: string;
          url: string;
          secure_url: string;
          format: string;
          width: number;
          height: number;
          created_at: string;
          folder: string;
          bytes: number;
        }) => ({
          id: r.public_id,
          name: r.public_id.split('/').pop() || r.public_id,
          url: r.url,
          secureUrl: r.secure_url,
          thumbnailUrl: cloudinary.url(r.public_id, {
            width: 150,
            height: 150,
            crop: 'fill',
            quality: 'auto',
          }),
          format: r.format,
          width: r.width,
          height: r.height,
          createdAt: r.created_at,
          folder: r.folder,
          bytes: r.bytes,
        })
      );

    // Get parent folder
    const folderParts = folder.split('/');
    const parentFolder = folderParts.length > 1 ? folderParts.slice(0, -1).join('/') : null;

    return NextResponse.json({
      files,
      folders: subfolders,
      currentFolder: folder,
      parentFolder,
      nextCursor: resourcesResult.next_cursor || null,
    });
  } catch (error) {
    console.error('Cloudinary list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to list Cloudinary files: ${errorMessage}` },
      { status: 500 }
    );
  }
}
