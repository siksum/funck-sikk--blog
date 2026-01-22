import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdminUserId } from '@/lib/get-admin-user-id';

const isProduction = process.env.NODE_ENV === 'production';

// GET: List all locations
export async function GET(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);
    const where: any = { userId };

    if (category) {
      where.category = category;
    }

    const locations = await prisma.mapLocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST: Create a new location
export async function POST(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, address, latitude, longitude, category, tags, rating, visitDate, notes, photos } = body;

    if (!name || !category || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Name, category, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);

    const location = await prisma.mapLocation.create({
      data: {
        userId,
        name,
        address,
        latitude,
        longitude,
        category,
        tags: tags || [],
        rating,
        visitDate: visitDate ? new Date(visitDate) : null,
        notes,
        photos: photos || [],
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
