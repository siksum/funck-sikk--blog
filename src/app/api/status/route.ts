import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STATUS_ID = 'owner-status';
const STATUS_SECRET = process.env.STATUS_UPDATE_SECRET;

// GET - Fetch current status
export async function GET() {
  try {
    const status = await prisma.ownerStatus.findUnique({
      where: { id: STATUS_ID },
    });

    if (!status) {
      return NextResponse.json({
        app: null,
        activity: null,
        emoji: null,
        isOnline: false,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      app: status.app,
      activity: status.activity,
      emoji: status.emoji,
      isOnline: status.isOnline,
      updatedAt: status.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

// POST - Update status (requires secret)
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!STATUS_SECRET || providedSecret !== STATUS_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { app, activity, emoji, isOnline } = body;

    const status = await prisma.ownerStatus.upsert({
      where: { id: STATUS_ID },
      update: {
        app: app ?? null,
        activity: activity ?? null,
        emoji: emoji ?? null,
        isOnline: isOnline ?? true,
      },
      create: {
        id: STATUS_ID,
        app: app ?? null,
        activity: activity ?? null,
        emoji: emoji ?? null,
        isOnline: isOnline ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      status: {
        app: status.app,
        activity: status.activity,
        emoji: status.emoji,
        isOnline: status.isOnline,
        updatedAt: status.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
