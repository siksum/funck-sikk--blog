import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET: Get a specific location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = session?.user?.id || 'dev-user';

    const location = await prisma.mapLocation.findFirst({
      where: { id, userId },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to fetch location:', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}

// PUT: Update a location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const userId = session?.user?.id || 'dev-user';

    const existing = await prisma.mapLocation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const { name, address, latitude, longitude, category, tags, rating, visitDate, notes, photos, isPublic } = body;

    const location = await prisma.mapLocation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(category && { category }),
        ...(tags !== undefined && { tags }),
        ...(rating !== undefined && { rating }),
        ...(visitDate !== undefined && { visitDate: visitDate ? new Date(visitDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(photos !== undefined && { photos }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// DELETE: Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = session?.user?.id || 'dev-user';

    const existing = await prisma.mapLocation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    await prisma.mapLocation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
