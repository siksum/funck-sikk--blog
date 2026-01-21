import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/about.json');
const ABOUT_DATA_ID = 'about-data';

// GET - Read about data
export async function GET() {
  try {
    // First try to get from database
    const dbData = await prisma.aboutData.findUnique({
      where: { id: ABOUT_DATA_ID },
    });

    if (dbData) {
      return NextResponse.json(dbData.data);
    }

    // Fallback to JSON file for initial data or development
    try {
      const fileData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileData);

      // Migrate file data to database
      await prisma.aboutData.upsert({
        where: { id: ABOUT_DATA_ID },
        create: { id: ABOUT_DATA_ID, data },
        update: { data },
      });

      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to read about data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// PUT - Update about data
export async function PUT(request: Request) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Use user-provided lastUpdated, or auto-generate if empty
    if (!data.lastUpdated) {
      data.lastUpdated = new Date().toISOString().split('T')[0].replace(/-/g, '.');
    }

    // Save to database
    await prisma.aboutData.upsert({
      where: { id: ABOUT_DATA_ID },
      create: { id: ABOUT_DATA_ID, data },
      update: { data },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to update about data:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
