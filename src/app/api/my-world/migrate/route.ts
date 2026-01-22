import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Migrate 'dev-user' data to actual user
export async function POST() {
  const session = await auth();

  if (!session?.user?.isAdmin || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
  }

  const actualUserId = session.user.id;

  try {
    // Migrate all 'dev-user' data to the actual admin user
    const results = await prisma.$transaction([
      // Migrate todos
      prisma.todo.updateMany({
        where: { userId: 'dev-user' },
        data: { userId: actualUserId },
      }),
      // Migrate map locations
      prisma.mapLocation.updateMany({
        where: { userId: 'dev-user' },
        data: { userId: actualUserId },
      }),
      // Migrate calendar events
      prisma.calendarEvent.updateMany({
        where: { userId: 'dev-user' },
        data: { userId: actualUserId },
      }),
      // Migrate daily entries
      prisma.dailyEntry.updateMany({
        where: { userId: 'dev-user' },
        data: { userId: actualUserId },
      }),
      // Migrate trips
      prisma.trip.updateMany({
        where: { userId: 'dev-user' },
        data: { userId: actualUserId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      migratedTo: actualUserId,
      counts: {
        todos: results[0].count,
        mapLocations: results[1].count,
        calendarEvents: results[2].count,
        dailyEntries: results[3].count,
        trips: results[4].count,
      },
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

// GET - Check current data status
export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
  }

  const actualUserId = session.user.id || 'no-user-id';

  try {
    // Count data for both 'dev-user' and actual user
    const [devUserTodos, actualUserTodos] = await Promise.all([
      prisma.todo.count({ where: { userId: 'dev-user' } }),
      prisma.todo.count({ where: { userId: actualUserId } }),
    ]);

    const [devUserLocations, actualUserLocations] = await Promise.all([
      prisma.mapLocation.count({ where: { userId: 'dev-user' } }),
      prisma.mapLocation.count({ where: { userId: actualUserId } }),
    ]);

    const [devUserEvents, actualUserEvents] = await Promise.all([
      prisma.calendarEvent.count({ where: { userId: 'dev-user' } }),
      prisma.calendarEvent.count({ where: { userId: actualUserId } }),
    ]);

    return NextResponse.json({
      currentUserId: actualUserId,
      userEmail: session.user.email,
      isAdmin: session.user.isAdmin,
      dataCounts: {
        devUser: {
          todos: devUserTodos,
          mapLocations: devUserLocations,
          calendarEvents: devUserEvents,
        },
        actualUser: {
          todos: actualUserTodos,
          mapLocations: actualUserLocations,
          calendarEvents: actualUserEvents,
        },
      },
    });
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
