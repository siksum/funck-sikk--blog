import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/about.json');

// GET - Read about data
export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
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

    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to update about data:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
